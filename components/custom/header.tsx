'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { AuthState, DerivAccount } from '@deriv/core';

interface HeaderProps {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  /** When provided, a Sign up button is rendered to the right of the Log in button. */
  onSignUp?: () => Promise<void>;
  /** Logo source URL or data URL. When omitted, a placeholder badge is shown until
   *  the user provides a logo via the app builder (passed as a data URL via PREVIEW_BRANDING). */
  logoSrc?: string;
  /** App name used to derive the fallback logo letter when no logoSrc is provided.
   *  Falls back to NEXT_PUBLIC_DERIV_APP_NAME env var, then 'Deriv Trading'. */
  appName?: string;
  /** Optional controls rendered to the left of the login/logout button (e.g. a theme toggle). */
  actions?: React.ReactNode;
}

// Scroll must move past this many pixels from the top before the
// scroll-away behaviour kicks in, so tiny scroll jitter near the top
// doesn't hide the header.
const SCROLL_HIDE_THRESHOLD = 80;

function formatBalance(balance: string): string {
  return Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Both account IDs (real + demo) belonging to the one login that should
 * always display as "Real account" regardless of which of its two
 * accounts is actually active — matched by account_id since this app's
 * account data does not expose an email field. The balance value shown
 * is always the true value for whichever account is active; only the
 * label is forced. Same IDs / same behavior as rise-fall-epm-dtrader.
 */
const FORCED_REAL_LABEL_ACCOUNT_IDS = ['ROT92086906', 'DOT93462536'];

/** Returns the account_type to DISPLAY (may differ from the account's real
 * account_type for the forced-real IDs above) — never changes the actual
 * balance, currency, or which account is active. */
function getDisplayAccountType(account: DerivAccount): 'demo' | 'real' {
  if (FORCED_REAL_LABEL_ACCOUNT_IDS.includes(account.account_id)) {
    return 'real';
  }
  return account.account_type;
}

/**
 * Centered site wordmark. If appName is exactly three words (e.g.
 * "Executive Prime Markets"), the middle word renders gold to match the
 * reference design. Any other name renders as a single gold serif wordmark.
 */
function Wordmark({ appName }: { appName?: string }) {
  const name = (appName ?? process.env.NEXT_PUBLIC_DERIV_APP_NAME ?? 'Trading App').trim();
  const words = name.split(/\s+/);

  return (
    <span className="font-serif tracking-wide text-lg sm:text-xl md:text-2xl select-none whitespace-nowrap">
      {words.length === 3 ? (
        <>
          <span className="text-foreground">{words[0]}</span>
          <span className="text-amber-400">{words[1]}</span>
          <span className="text-foreground">{words[2]}</span>
        </>
      ) : (
        <span className="text-amber-400">{name}</span>
      )}
    </span>
  );
}

function AccountLabel({ type }: { type: 'demo' | 'real' }) {
  return (
    <span
      className={cn(
        'text-sm font-medium',
        type === 'demo' ? 'text-orange-500' : 'text-emerald-600'
      )}
    >
      {type === 'demo' ? 'Demo account' : 'Real account'}
    </span>
  );
}

export function Header({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onLogout,
  onSwitchAccount,
  onSignUp,
  logoSrc,
  appName,
  actions,
}: HeaderProps) {
  const [logoError, setLogoError] = useState(false);
  const logoLetter = (appName ?? process.env.NEXT_PUBLIC_DERIV_APP_NAME ?? 'Deriv Trading')
    .trim()
    .charAt(0)
    .toUpperCase() || 'D';
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';

  // Auto-collapse: the header slides away when the user scrolls down past
  // the threshold, or clicks anywhere in the page outside the header. It
  // reappears when the user scrolls back up (or all the way to the top).
  const [collapsed, setCollapsed] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const previousY = lastScrollY.current;

      if (currentY <= SCROLL_HIDE_THRESHOLD) {
        // Always show near the top of the page.
        setCollapsed(false);
      } else if (currentY > previousY) {
        // Scrolling down — collapse.
        setCollapsed(true);
      } else if (currentY < previousY) {
        // Scrolling up — reveal.
        setCollapsed(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      // Ignore clicks inside the header itself (logo, account switcher,
      // login/logout, etc.) — only clicks elsewhere on the page collapse it.
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm transition-transform duration-300 ease-in-out',
        collapsed ? '-translate-y-full' : 'translate-y-0'
      )}
    >
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
        <Wordmark appName={appName} />
      </div>

      <div className="flex items-center gap-3">
        {!logoSrc || logoError ? (
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {logoLetter}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- next/image is avoided here intentionally: it errors in the optimizer when /logo.png is absent locally; a plain img with onError gives the same silent fallback behaviour
          <img
            src={logoSrc}
            alt="App Logo"
            className="h-8 w-auto object-contain"
            onError={() => setLogoError(true)}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        {isAuthenticated && activeAccount && (
          <Popover open={accountSwitcherOpen} onOpenChange={setAccountSwitcherOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-border px-3 hover:bg-muted/50 transition-colors">
                <div className="text-left">
                  <AccountLabel type={getDisplayAccountType(activeAccount)} />
                  <p className="text-base font-bold text-foreground">
                    {formatBalance(activeAccount.balance)} {activeAccount.currency}
                  </p>
                </div>
                <svg
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    accountSwitcherOpen && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <div className="space-y-1">
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    onClick={() => {
                      onSwitchAccount(account.account_id);
                      setAccountSwitcherOpen(false);
                    }}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2.5 transition-colors',
                      account.account_id === activeAccount.account_id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <AccountLabel type={getDisplayAccountType(account)} />
                    <p className="text-base font-bold text-foreground">
                      {formatBalance(account.balance)} {account.currency}
                    </p>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        {isAuthenticated ? (
          <Button variant="destructive" onClick={onLogout}>
            Logout
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onLogin} disabled={isAuthenticating}>
              {isAuthenticating ? 'Logging in...' : 'Log in'}
            </Button>
            {onSignUp && (
              <Button size="sm" onClick={onSignUp} disabled={isAuthenticating}>
                Sign up
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
