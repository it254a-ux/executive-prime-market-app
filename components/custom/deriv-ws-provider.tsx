'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useDerivWS } from '@deriv/core';
import { useAuth } from '@/hooks/use-auth';
import type { DerivWS } from '@deriv/core';
import type { UseAuthReturn } from '@/hooks/use-auth';

export interface LiveBalance {
  loginid: string;
  balance: number;
  currency: string;
}

/** Map of loginid -> live balance, one entry per account under the login. */
export type LiveBalanceMap = Record<string, LiveBalance>;

interface DerivWSContextValue {
  ws: DerivWS | null;
  isConnected: boolean;
  isExhausted: boolean;
  auth: UseAuthReturn;
  /**
   * Live balances for every account under the current login, pushed in real
   * time via a `balance` WebSocket subscription with `account: 'all'`, keyed
   * by loginid. Empty until the first update arrives after (re)connecting.
   * Prefer this over `auth.accounts[i].balance` wherever a live figure
   * matters — the value on `auth.accounts` is only a one-time snapshot from
   * login/switch, and for non-active accounts it may never update on its own.
   */
  liveBalances: LiveBalanceMap;
}

const DerivWSContext = createContext<DerivWSContextValue | null>(null);

/**
 * Maintains a single WebSocket connection and auth state above all page components
 * so navigation between pages (e.g. main → reports → back) does not tear down
 * and recreate the connection.
 */
export function DerivWSProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { ws, isConnected, isExhausted } = useDerivWS({
    url: auth.wsUrl,
    accountId: auth.activeAccountId ?? undefined,
  });
  const [liveBalances, setLiveBalances] = useState<LiveBalanceMap>({});

  // Subscribe to live balance updates for every account under the login
  // (account: 'all') once the socket is connected and authenticated. A
  // fresh `DerivWS` instance is created on every reconnect (login, logout,
  // account switch), so this effect re-subscribes naturally each time — no
  // manual unsubscribe-on-switch logic needed. The DerivWS instance itself
  // clears its own subscription handlers on disconnect.
  useEffect(() => {
    if (!ws || !isConnected || auth.authState !== 'authenticated') {
      setLiveBalances({});
      return;
    }

    let cancelled = false;
    let unsubscribeFn: (() => void) | null = null;

    ws.subscribe({ balance: 1, account: 'all' }, (data) => {
      if (cancelled) return;

      const balancePayload = data.balance as
        | {
            balance?: number;
            currency?: string;
            loginid?: string;
            accounts?: Record<string, { balance: number; currency: string }>;
          }
        | undefined;
      if (!balancePayload) return;

      setLiveBalances((prev) => {
        const next = { ...prev };

        // Initial `account: 'all'` response includes a full snapshot of
        // every account's balance in `accounts`, keyed by loginid.
        if (balancePayload.accounts) {
          for (const [loginid, acc] of Object.entries(balancePayload.accounts)) {
            next[loginid] = { loginid, balance: acc.balance, currency: acc.currency };
          }
        }

        // Subsequent stream updates report the single account whose balance
        // just changed (e.g. after a trade or deposit) — merge that in too.
        if (
          balancePayload.loginid &&
          balancePayload.balance !== undefined &&
          balancePayload.currency !== undefined
        ) {
          next[balancePayload.loginid] = {
            loginid: balancePayload.loginid,
            balance: balancePayload.balance,
            currency: balancePayload.currency,
          };
        }

        return next;
      });
    })
      .then((result) => {
        if (cancelled) {
          result.unsubscribe();
          return;
        }
        unsubscribeFn = result.unsubscribe;
      })
      .catch(() => {
        // Balance subscription failed (e.g. socket dropped mid-request) —
        // leave liveBalances as-is so callers fall back to snapshots.
      });

    return () => {
      cancelled = true;
      unsubscribeFn?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws, isConnected, auth.authState]);

  return (
    <DerivWSContext.Provider value={{ ws, isConnected, isExhausted, auth, liveBalances }}>
      {children}
    </DerivWSContext.Provider>
  );
}

export function useDerivWSContext(): DerivWSContextValue {
  const ctx = useContext(DerivWSContext);
  if (!ctx) {
    throw new Error('useDerivWSContext must be used within a DerivWSProvider');
  }
  return ctx;
}
