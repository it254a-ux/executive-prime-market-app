/**
 * An MT5 sub-account under the user's Deriv login, as returned by the
 * legacy `mt5_login_list` API call.
 *
 * This is a genuinely different account type from `DerivAccount`
 * (Options/Multipliers) — MT5 accounts are provisioned and managed via
 * Deriv's legacy WebSocket API only. There is no MT5 equivalent on the
 * `trading/v1/options` API this app otherwise uses, and Deriv's own docs
 * state that actual trade execution on MT5 is not supported via any API —
 * only account management (list/create/deposit/withdraw/password) is.
 * See packages/core/src/mt5/accounts.ts for how these are fetched.
 *
 * Field shape is based on Deriv's documented `mt5_login_list` response.
 * Not yet verified against a live account — if any field name here
 * doesn't match what a real response returns, this type (and
 * fetchMT5Accounts) will need a small adjustment once tested end-to-end.
 */
export interface MT5Account {
  /** MT5 login ID, e.g. "MTD529153" (demo) or a real-account equivalent. */
  login: string;
  /** Raw numeric balance in the account's currency. */
  balance: number;
  /** Pre-formatted display string for the balance, e.g. "10000.00". */
  display_balance: string;
  currency: string;
  /** MT5 server group string, e.g. "demo\\svg" — encodes server/routing, not a product category to show as-is in the UI. */
  group: string;
  leverage: number;
  name: string;
  email: string;
  country: string;
  /** Which Deriv landing company this MT5 account is regulated under. */
  landing_company_short: 'svg' | 'malta' | 'maltainvest' | 'vanuatu' | 'labuan' | string;
  account_type: 'real' | 'demo';
  /** Broad MT5 offering type: 'financial' accounts trade Forex/CFDs, 'gaming' accounts trade synthetic indices. */
  market_type: 'financial' | 'gaming';
  sub_account_type: 'financial' | 'financial_stp' | 'swap_free' | string;
}
