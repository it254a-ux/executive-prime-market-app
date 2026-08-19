type DerivEnv = 'production' | 'preview';

function getEnv(): DerivEnv {
  if (typeof globalThis !== 'undefined' && typeof process !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_DERIV_ENV;
    if (env === 'preview') return 'preview';
  }
  return 'production';
}

const URLS = {
  production: {
    authBase: 'https://auth.deriv.com/oauth2',
    apiBase: 'https://api.derivws.com/trading/v1/options',
    publicWs: 'wss://api.derivws.com/trading/v1/options/ws/public',
    appBuilder: 'https://developers.deriv.com',
    // Legacy WebSocket API — this is a SEPARATE product surface from
    // apiBase/publicWs above (trading/v1/options). It's used only for
    // calls that have no equivalent on the newer API, currently just MT5
    // account management (mt5_login_list, mt5_new_account, etc. — see
    // packages/core/src/mt5/accounts.ts). Not yet verified end-to-end
    // against a live account; if the `authorize`/`app_id` handshake needs
    // adjustment, this is the URL to check first.
    legacyWs: 'wss://ws.derivws.com/websockets/v3',
  },
  preview: {
    authBase: 'https://staging-auth.deriv.com/oauth2',
    apiBase: 'https://staging-api.derivws.com/trading/v1/options',
    publicWs: 'wss://staging-api.derivws.com/trading/v1/options/ws/public',
    appBuilder: 'https://staging-developers.deriv.com',
    legacyWs: 'wss://ws.derivws.com/websockets/v3',
  },
} as const;

export function getAuthBaseUrl(): string {
  return URLS[getEnv()].authBase;
}

export function getApiBaseUrl(): string {
  return URLS[getEnv()].apiBase;
}

export function getPublicWsUrl(): string {
  return URLS[getEnv()].publicWs;
}

/**
 * Base URL of the app-builder BFF (deriv-api-v2). Used to call its runtime
 * affiliate-resolution proxy. Derived from NEXT_PUBLIC_DERIV_ENV so no extra
 * env var is needed in the assembled app.
 */
export function getAppBuilderBaseUrl(): string {
  return URLS[getEnv()].appBuilder;
}

/**
 * Legacy WebSocket API URL, with the app's client ID attached as `app_id`
 * (required by this endpoint) and language forced to English. Used only
 * by fetchMT5Accounts today — see packages/core/src/mt5/accounts.ts.
 */
export function getLegacyWsUrl(appId: string): string {
  return `${URLS[getEnv()].legacyWs}?app_id=${encodeURIComponent(appId)}&l=EN`;
}
