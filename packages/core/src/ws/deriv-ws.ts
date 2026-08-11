import { getPublicWsUrl } from '../config/urls';

type MessageHandler = (data: Record<string, unknown>) => void;
type ConnectionStateHandler = (connected: boolean) => void;
type ReconnectExhaustedHandler = () => void;

interface PendingRequest {
  resolve: (data: Record<string, unknown>) => void;
  reject: (error: Error) => void;
}

// Max time to wait for an in-flight connection attempt (made by another
// caller) before giving up and rejecting instead of polling forever.
const CONNECT_WAIT_TIMEOUT_MS = 15000;

// Once the fast exponential-backoff attempts are exhausted, keep retrying
// at this fixed interval indefinitely instead of stopping permanently.
// A live trading platform should never require a manual page reload just
// because of a brief network drop (WiFi/cellular handoff, app backgrounded).
const SUSTAINED_RETRY_INTERVAL_MS = 15000;

/**
 * Lightweight WebSocket manager for the Deriv public WS API.
 * Handles connection, reconnection, request/response matching via req_id,
 * and subscription streaming.
 */
export class DerivWS {
  private ws: WebSocket | null = null;
  private reqIdCounter = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  private subscriptionHandlers = new Map<string, MessageHandler>();
  private globalHandlers: MessageHandler[] = [];
  private connectionStateHandlers: ConnectionStateHandler[] = [];
  private reconnectExhaustedHandlers: ReconnectExhaustedHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private url: string;
  private isConnecting = false;
  // True once the fast backoff attempts have been exhausted at least once
  // since the last successful connection. Used to switch to sustained retry
  // and to notify listeners exactly once per outage (not on every retry).
  private hasNotifiedExhausted = false;
  // True once disconnect() has been called intentionally (logout / full
  // reconnect / unmount) — stops any further reconnect attempts for good.
  private isDisposed = false;

  constructor(url?: string) {
    this.url = url ?? getPublicWsUrl();
  }

  /**
   * Register a listener for connection state changes.
   * Called with `true` on connect and `false` on disconnect.
   * Returns an unsubscribe function.
   */
  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.push(handler);
    return () => {
      this.connectionStateHandlers = this.connectionStateHandlers.filter((h) => h !== handler);
    };
  }

  onReconnectExhausted(handler: ReconnectExhaustedHandler): () => void {
    this.reconnectExhaustedHandlers.push(handler);
    return () => {
      this.reconnectExhaustedHandlers = this.reconnectExhaustedHandlers.filter((h) => h !== handler);
    };
  }

  private notifyConnectionState(connected: boolean): void {
    for (const handler of this.connectionStateHandlers) {
      handler(connected);
    }
  }

  /**
   * Update the URL used for future reconnections without disrupting the current connection.
   * Call this when an OTP URL is refreshed but the live socket is still healthy.
   */
  updateUrl(url: string): void {
    this.url = url;
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      // Wait for the in-flight attempt, but never poll forever: if it
      // doesn't succeed within CONNECT_WAIT_TIMEOUT_MS (e.g. the underlying
      // socket errored out and went to CLOSED instead of OPEN), reject so
      // the caller can react instead of hanging indefinitely.
      return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const check = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(check);
            resolve();
            return;
          }
          if (!this.isConnecting || Date.now() - startedAt > CONNECT_WAIT_TIMEOUT_MS) {
            clearInterval(check);
            reject(new Error('WebSocket connection attempt timed out'));
          }
        }, 100);
      });
    }

    this.isDisposed = false;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.hasNotifiedExhausted = false;
        this.startPing();
        this.notifyConnectionState(true);
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        reject(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopPing();
        this.subscriptionHandlers.clear();
        this.notifyConnectionState(false);
        if (!this.isDisposed) {
          this.attemptReconnect();
        }
      };
    });
  }

  /**
   * Send a one-shot request and wait for the response matched by req_id.
   */
  send<T = Record<string, unknown>>(payload: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const reqId = ++this.reqIdCounter;
      const message = { ...payload, req_id: reqId };

      this.pendingRequests.set(reqId, {
        resolve: resolve as (data: Record<string, unknown>) => void,
        reject,
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Send a subscription request. The handler is called for every streamed message.
   * Returns a function to unsubscribe.
   */
  subscribe(
    payload: Record<string, unknown>,
    handler: MessageHandler
  ): Promise<{ subscriptionId: string | null; unsubscribe: () => void }> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const reqId = ++this.reqIdCounter;
      const message = { ...payload, subscribe: 1, req_id: reqId };

      this.pendingRequests.set(reqId, {
        resolve: (data) => {
          const subscriptionId = this.extractSubscriptionId(data);
          if (subscriptionId) {
            this.subscriptionHandlers.set(subscriptionId, handler);
          }
          // Also call handler with the initial response
          handler(data);
          resolve({
            subscriptionId,
            unsubscribe: () => {
              if (subscriptionId) {
                this.subscriptionHandlers.delete(subscriptionId);
                this.send({ forget: subscriptionId }).catch(() => {});
              }
            },
          });
        },
        reject,
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.globalHandlers.push(handler);
    return () => {
      this.globalHandlers = this.globalHandlers.filter((h) => h !== handler);
    };
  }

  disconnect(): void {
    this.isDisposed = true;
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
    this.subscriptionHandlers.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(data: Record<string, unknown>): void {
    // Notify global handlers
    for (const handler of this.globalHandlers) {
      handler(data);
    }

    const reqId = data.req_id as number | undefined;

    // Check for error
    if (data.error) {
      if (reqId && this.pendingRequests.has(reqId)) {
        const pending = this.pendingRequests.get(reqId)!;
        this.pendingRequests.delete(reqId);
        pending.reject(new Error((data.error as Record<string, string>).message));
      }
      return;
    }

    // Check if this is a subscription stream
    const subId = this.extractSubscriptionId(data);
    if (subId && this.subscriptionHandlers.has(subId)) {
      this.subscriptionHandlers.get(subId)!(data);
    }

    // Resolve pending one-shot request
    if (reqId && this.pendingRequests.has(reqId)) {
      const pending = this.pendingRequests.get(reqId)!;
      this.pendingRequests.delete(reqId);
      pending.resolve(data);
    }
  }

  private extractSubscriptionId(data: Record<string, unknown>): string | null {
    // Subscription ID can be in tick.id, subscription.id, or proposal.id
    if (data.subscription && typeof data.subscription === 'object') {
      return (data.subscription as Record<string, string>).id ?? null;
    }
    if (data.tick && typeof data.tick === 'object') {
      return (data.tick as Record<string, string>).id ?? null;
    }
    return null;
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ ping: 1 }));
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Reconnect strategy: fast exponential backoff (2s, 4s, 8s, 16s, 30s) for
   * the first maxReconnectAttempts tries, matching the original behaviour.
   * After that, instead of giving up permanently (which previously left the
   * app dead until a full page reload), keep retrying at a fixed interval.
   * onReconnectExhausted still fires exactly once per outage so the UI can
   * show a "reconnecting..." state, but the socket keeps trying to recover
   * on its own — a brief network drop should never require the user to
   * manually reload or re-log-in.
   */
  private attemptReconnect(): void {
    if (this.isDisposed) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (!this.hasNotifiedExhausted) {
        this.hasNotifiedExhausted = true;
        for (const handler of this.reconnectExhaustedHandlers) handler();
      }
      this.reconnectTimeout = setTimeout(() => {
        this.connect().catch(() => {});
      }, SUSTAINED_RETRY_INTERVAL_MS);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }
}
