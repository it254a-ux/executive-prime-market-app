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

interface DerivWSContextValue {
  ws: DerivWS | null;
  isConnected: boolean;
  isExhausted: boolean;
  auth: UseAuthReturn;
  /**
   * Live balance for the currently active account, pushed in real time via a
   * `balance` WebSocket subscription. `null` until the first update arrives
   * after (re)connecting. Prefer this over `auth.activeAccount.balance`
   * wherever a live figure matters (e.g. while a trade is open) — the value
   * on `auth.activeAccount` is only a one-time snapshot from login/switch.
   */
  liveBalance: LiveBalance | null;
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

  const [liveBalance, setLiveBalance] = useState<LiveBalance | null>(null);

  // Subscribe to live balance updates once the socket is connected and
  // authenticated. A fresh `DerivWS` instance is created on every reconnect
  // (login, logout, account switch), so this effect re-subscribes naturally
  // each time — no manual unsubscribe-on-switch logic needed. The DerivWS
  // instance itself clears its own subscription handlers on disconnect.
  useEffect(() => {
    if (!ws || !isConnected || auth.authState !== 'authenticated') {
      setLiveBalance(null);
      return;
    }

    let cancelled = false;
    let unsubscribeFn: (() => void) | null = null;

    ws.subscribe({ balance: 1 }, (data) => {
      if (cancelled) return;
      const balanceData = data.balance as
        | { balance: number; currency: string; loginid: string }
        | undefined;
      if (!balanceData) return;
      setLiveBalance({
        loginid: balanceData.loginid,
        balance: balanceData.balance,
        currency: balanceData.currency,
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
        // leave liveBalance as null so callers fall back to the snapshot.
      });

    return () => {
      cancelled = true;
      unsubscribeFn?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws, isConnected, auth.authState]);

  return (
    <DerivWSContext.Provider value={{ ws, isConnected, isExhausted, auth, liveBalance }}>
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
