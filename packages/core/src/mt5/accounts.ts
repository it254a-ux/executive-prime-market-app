import type { AuthInfo } from '../types';
import type { MT5Account } from '../types/mt5';
import { DerivWS } from '../ws';
import { getLegacyWsUrl } from '../config/urls';

/**
 * Fetch every MT5 account under the user's Deriv login.
 *
 * MT5 account management (list/create/deposit/withdraw) only exists on
 * Deriv's legacy WebSocket API — it is not part of the `trading/v1/options`
 * API this app otherwise uses. This function therefore opens its own,
 * temporary `DerivWS` connection to the legacy endpoint, separate from
 * (and never interfering with) the main OTP-authenticated `ws` connection
 * managed by DerivWSProvider:
 *
 *  1. Connect to the legacy WS endpoint.
 *  2. `authorize` using the SAME access token already issued during OAuth
 *     login — no new login step, no extra prompt for the user.
 *  3. Send `mt5_login_list` and collect the result.
 *  4. Always disconnect this temporary socket afterwards (success or
 *     failure), via try/finally, so nothing is left open or leaked.
 *
 * If this fails for any reason (unsupported call, network issue, bad
 * token), it fails in isolation — it does not touch `authState`,
 * `accessToken`, or any stored auth data, so the rest of the app (Options
 * accounts, live balances, iframes) is completely unaffected.
 */
export async function fetchMT5Accounts(
  authInfo: AuthInfo,
  clientId: string
): Promise<MT5Account[]> {
  const ws = new DerivWS(getLegacyWsUrl(clientId));

  try {
    await ws.connect();
    await ws.send({ authorize: authInfo.access_token });

    const response = await ws.send<{ login_list?: MT5Account[] }>({
      mt5_login_list: 1,
    });

    return response.login_list ?? [];
  } finally {
    ws.disconnect();
  }
}
