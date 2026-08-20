'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initiateLogin,
  initiateSignUp,
  handleOAuthCallback,
  refreshAccessToken,
  fetchAccounts,
  fetchMT5Accounts,
  getWebSocketOTP,
  logout as coreLogout,
  getAuthInfo,
  getDerivAccounts,
  getActiveLoginId,
  setActiveLoginId,
  setAccountType,
  clearAllAuthData,
  parseReferralLink,
  parseLandingParams,
  resolveReferralViaProxy,
} from '@deriv/core';
import type { AuthInfo, DerivAccount, MT5Account, AuthState, AuthConfig } from '@deriv/core';

function getAuthConfig(): AuthConfig {
  const config: AuthConfig = {
    clientId: process.env.NEXT_PUBLIC_DERIV_APP_ID ?? '',
    redirectUri:
      process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ??
      (typeof window !== 'undefined' ? window.location.origin : ''),
  };

  // Convert comma-separated scopes to space-separated (OAuth spec)
  const scopesEnv = process.env.NEXT_PUBLIC_DERIV_OAUTH_SCOPES ?? '';
  if (scopesEnv) {
    config.scopes = scopesEnv
      .split(',')
      .map(s => s.trim())
      .join(' ');
  }

  const referralLink = process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ?? '';
  if (referralLink) {
    const referral = parseReferralLink(referralLink);
    if (referral) {
      config.affiliateToken = referral.affiliateToken;
      config.affiliateTokenParam = referral.affiliateTokenParam;
      config.utmCampaign = referral.utmCampaign;
      config.utmSource = referral.utmSource;
      config.utmMedium = referral.utmMedium;
    }
  }

  // Override with live per-click params from landing URL (e.g. Scaleo t= token).
  // These are present in window.location.search when the user arrives via an
  // affiliate link and haven't been removed yet (OAuth params aren't in the URL
  // at this point — they only appear after Deriv redirects back with ?code=).
  const landing = parseLandingParams();
  if (landing) {
    // Only override the token when the landing URL actually carries one (t=).
    // parseLandingParams returns a non-null result for any utm_* param, so an
    // unguarded write would clobber a valid env token with '' on generic
    // marketing links (e.g. ?utm_source=google with no t=).
    if (landing.affiliateToken) {
      config.affiliateToken = landing.affiliateToken;
      config.affiliateTokenParam = landing.affiliateTokenParam;
    }
    if (landing.utmSource) config.utmSource = landing.utmSource;
    if (landing.utmMedium) config.utmMedium = landing.utmMedium;
    if (landing.utmCampaign) config.utmCampaign = landing.utmCampaign;
  }

  return config;
}

// Build the auth config and, if we don't already have an affiliate token (from
// a resolved/Format-3 referral link or live landing params), try to resolve a
// fresh per-user token via the app-builder BFF proxy. Strictly non-blocking:
// any failure leaves the config untouched so login/sign-up always proceeds.
async function getAuthConfigWithReferral(): Promise<AuthConfig> {
  const config = getAuthConfig();
  if (!config.affiliateToken) {
    try {
      const referralLink = process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ?? '';
      const resolved = await resolveReferralViaProxy(referralLink);
      if (resolved) {
        config.affiliateToken = resolved.affiliateToken;
        config.affiliateTokenParam = resolved.affiliateTokenParam;
        if (resolved.utmSource) config.utmSource = resolved.utmSource;
        if (resolved.utmMedium) config.utmMedium = resolved.utmMedium;
        if (resolved.utmCampaign) config.utmCampaign = resolved.utmCampaign;
      }
    } catch {
      // Never block login on attribution resolution.
    }
  }
  return config;
}

// Small delay helper used for the completeAuth retry below.
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface UseAuthReturn {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  activeAccountId: string | null;
  accessToken: string | null;
  wsUrl: string | undefined;
  /**
   * MT5 accounts under the current login, fetched via Deriv's legacy
   * WebSocket API (see fetchMT5Accounts in @deriv/core). Fetched
   * automatically once Options auth completes. Empty until that fetch
   * resolves, or if it fails — a failure here never affects `authState`
   * or any other part of the session, since it's fetched on a completely
   * separate, temporary connection.
   */
  mt5Accounts: MT5Account[];
  /** True while the MT5 accounts fetch is in flight. */
  mt5AccountsLoading: boolean;
  login: () => Promise<void>;
  signUp: () => Promise<void>;
  logout: () => void;
  switchAccount: (accountId: string) => Promise<void>;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>(() =>
    typeof window !== 'undefined' && getAuthInfo() ? 'authenticated' : 'unauthenticated'
  );
  const [accounts, setAccounts] = useState<DerivAccount[]>(() => {
    if (typeof window === 'undefined') return [];
    return getDerivAccounts() ?? [];
  });
  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getActiveLoginId() ?? null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getAuthInfo()?.access_token ?? null;
  });
  const [wsUrl, setWsUrl] = useState<string | undefined>(undefined);
  const [mt5Accounts, setMt5Accounts] = useState<MT5Account[]>([]);
  const [mt5AccountsLoading, setMt5AccountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);
  const activeAccountIdRef = useRef<string | null>(null);
  const tabHiddenAtRef = useRef<number | null>(null);

  // Fetch OTP WebSocket URL for an account
  const fetchOTPUrl = useCallback(
    async (accountId: string, authInfo: AuthInfo): Promise<string> => {
      return getWebSocketOTP(accountId, authInfo, getAuthConfig().clientId);
    },
    []
  );

  // Fetch MT5 accounts for the current login. Deliberately isolated: this
  // runs on its own temporary connection (see fetchMT5Accounts), so any
  // failure here (unsupported call, network issue) is caught and swallowed
  // — it must never affect authState, accessToken, or the main Options
  // session. Fire-and-forget from the callers below.
  const loadMT5Accounts = useCallback(async (authInfo: AuthInfo) => {
    setMt5AccountsLoading(true);
    try {
      const mt5 = await fetchMT5Accounts(authInfo, getAuthConfig().clientId);
      setMt5Accounts(mt5);
    } catch {
      // Supplementary data only — leave mt5Accounts as-is on failure.
    } finally {
      setMt5AccountsLoading(false);
    }
  }, []);

  // Complete auth: fetch accounts → get OTP → set WS URL
  const completeAuth = useCallback(
    async (authInfo: AuthInfo) => {
      setAccessToken(authInfo.access_token);

      const fetchedAccounts = await fetchAccounts(authInfo, getAuthConfig().clientId);
      setAccounts(fetchedAccounts);

      if (fetchedAccounts.length > 0) {
        const firstAccount = fetchedAccounts[0];
        setActiveAccountId(firstAccount.account_id);

        const otpUrl = await fetchOTPUrl(firstAccount.account_id, authInfo);
        setWsUrl(otpUrl);
      }

      setAuthState('authenticated');
      // Fire-and-forget: MT5 accounts load in the background and populate
      // whenever they're ready, without delaying the main auth flow above.
      loadMT5Accounts(authInfo);
    },
    [fetchOTPUrl, loadMT5Accounts]
  );

  // Same as completeAuth, but retries once after a short delay before giving
  // up. This only applies right after a fresh OAuth code exchange: the token
  // exchange itself already succeeded at that point, so a transient failure
  // in the follow-up fetchAccounts/OTP calls (common on mobile right after a
  // redirect, while the network is still reconnecting) shouldn't discard a
  // valid login and force the user to redo the whole OAuth flow.
  const completeAuthWithRetry = useCallback(
    async (authInfo: AuthInfo) => {
      try {
        await completeAuth(authInfo);
      } catch (err) {
        await delay(1200);
        await completeAuth(authInfo);
      }
    },
    [completeAuth]
  );

  // Initialize: check for OAuth callback or existing session
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      // Phase 3-5: Handle OAuth callback
      if (code) {
        setAuthState('authenticating');
        try {
          const authInfo = await handleOAuthCallback(window.location.href, getAuthConfig());
          await completeAuthWithRetry(authInfo);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setAuthState('error');
          clearAllAuthData();
        }
        return;
      }

      // Check for existing session
      const storedAuth = getAuthInfo();
      if (storedAuth) {
        // Check if token is expired
        if (storedAuth.expires_at && Date.now() / 1000 > storedAuth.expires_at) {
          // Try to refresh
          try {
            const refreshed = await refreshAccessToken(
              storedAuth.refresh_token,
              getAuthConfig().clientId
            );
            await completeAuthWithRetry(refreshed);
          } catch {
            // Refresh failed — fall back to unauthenticated (public WS)
            clearAllAuthData();
            setAuthState('unauthenticated');
          }
          return;
        }

        // Valid stored session — restore accounts and get fresh OTP
        const storedAccounts = getDerivAccounts();
        if (storedAccounts && storedAccounts.length > 0) {
          setAccessToken(storedAuth.access_token);
          setAccounts(storedAccounts);
          const loginId = getActiveLoginId() ?? storedAccounts[0].account_id;
          setActiveAccountId(loginId);

          try {
            const otpUrl = await fetchOTPUrl(loginId, storedAuth);
            setWsUrl(otpUrl);
            setAuthState('authenticated');
            loadMT5Accounts(storedAuth);
          } catch {
            // OTP fetch failed — token may be invalid, clear and fallback
            clearAllAuthData();
            setAuthState('unauthenticated');
          }
        } else {
          // Have auth info but no accounts — re-fetch
          try {
            await completeAuthWithRetry(storedAuth);
          } catch {
            clearAllAuthData();
            setAuthState('unauthenticated');
          }
        }
      }
    };

    init();
  }, [completeAuthWithRetry, fetchOTPUrl, loadMT5Accounts]);

  // Keep ref in sync so visibility handler always has the current account ID
  useEffect(() => {
    activeAccountIdRef.current = activeAccountId;
  }, [activeAccountId]);

  // Refresh the OTP WebSocket URL when returning to the tab after >30s of inactivity.
  // OTP URLs are single-use, so a stale URL will cause reconnect failures.
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        tabHiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = tabHiddenAtRef.current;
      if (!hiddenAt || Date.now() - hiddenAt < 30_000) return;
      tabHiddenAtRef.current = null;

      const accountId = activeAccountIdRef.current;
      const authInfo = getAuthInfo();
      if (!authInfo || !accountId) return;

      try {
        const otpUrl = await fetchOTPUrl(accountId, authInfo);
        setWsUrl(otpUrl);
      } catch {
        clearAllAuthData();
        setAuthState('unauthenticated');
        setWsUrl(undefined);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState, fetchOTPUrl]);

  // Phase 1: Initiate login — includes partner attribution params, resolving a
  // fresh per-user Scaleo token via the BFF proxy when needed (non-blocking).
  // Set 'authenticating' first so the header button shows a pending state and is
  // disabled during the (up to ~2.5s) resolve before the redirect — prevents a
  // frozen-looking button and double-clicks. Reset only if the redirect throws.
  const login = useCallback(async () => {
    setAuthState('authenticating');
    try {
      await initiateLogin(await getAuthConfigWithReferral());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setAuthState('unauthenticated');
    }
  }, []);

  // Initiate sign-up — adds prompt=registration and partner attribution params
  const signUp = useCallback(async () => {
    setAuthState('authenticating');
    try {
      await initiateSignUp(await getAuthConfigWithReferral());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed');
      setAuthState('unauthenticated');
    }
  }, []);

  // Logout: close WS (handled by useDerivWS cleanup), clear storage, reset state
  const logout = useCallback(() => {
    coreLogout();
    setAccounts([]);
    setActiveAccountId(null);
    setAccessToken(null);
    setWsUrl(undefined);
    setMt5Accounts([]);
    setAuthState('unauthenticated');
    setError(null);
  }, []);

  // Account switch: fetch new OTP first, then update accountId and wsUrl together
  // so reconnectKey and url change in the same render cycle with the correct OTP.
  const switchAccount = useCallback(
    async (accountId: string) => {
      const authInfo = getAuthInfo();
      if (!authInfo) return;

      try {
        const account = accounts.find(a => a.account_id === accountId);
        if (account) setAccountType(account.account_type);
        // Fetch OTP before updating accountId so reconnectKey and url are consistent
        const otpUrl = await fetchOTPUrl(accountId, authInfo);
        setActiveLoginId(accountId);
        setActiveAccountId(accountId);
        setWsUrl(otpUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Account switch failed');
      }
    },
    [fetchOTPUrl, accounts]
  );

  const activeAccount =
    accounts.find(acc => acc.account_id === activeAccountId) ?? accounts[0] ?? null;

  return {
    authState,
    accounts,
    activeAccount,
    activeAccountId,
    accessToken,
    wsUrl,
    mt5Accounts,
    mt5AccountsLoading,
    login,
    signUp,
    logout,
    switchAccount,
    error,
  };
}
