'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { DerivWSProvider, useDerivWSContext, LiveBalanceMap } from '@/components/custom/deriv-ws-provider';
import { HeroBackground } from '@/components/custom/hero-background';
import { FreeBotsPage } from '@/components/custom/free-bots-page';

const navLinks = [
  { label: 'Dashboard',         icon: '🏠', href: 'dashboard' },
  { label: 'DTrader',           icon: '💹', href: 'dtrader' },
  { label: 'Smart Trading Terminal',   icon: '🤖', href: 'botbuilder' },
  { label: 'Free Bots by EPM',  icon: '🎁', href: 'freebots' },
  { label: 'EPM Analyser Tool', icon: '📡', href: 'epmanalyser' },
  { label: 'Trading Courses', icon: '🎓', href: 'tutorials' },
];

const iframeBases: Record<string, string> = {
  charts:      'https://charts-accumulators-app.vercel.app',
  dtrader:     'https://rise-fall-epm-dtrader.vercel.app',
  analysis:    'https://digits-epm-analysis.vercel.app',
  botbuilder:  'https://epm-botbuilder-uo51.vercel.app',
  epmanalyser: 'https://digits-epm-analysis.vercel.app/epm-analyser',
  tutorials:   'https://epm-botbuilder-uo51.vercel.app',
};

// Some embedded apps use a URL hash to pick an initial internal tab on load
// (epm-botbuilder reads location.hash against ['dashboard','bot_builder',
// 'chart','tutorial','ai_bot_builder']). This must always be appended AFTER
// any query string we build below — a fragment can never precede a query
// string in a valid URL, so `#hash?query` would silently break both the
// auth params and the hash-based tab detection.
const iframeHashes: Record<string, string> = {
  tutorials: 'tutorial',
};

// The Trading Courses page ('tutorials') embeds the exact same
// epm-botbuilder deployment as the Smart Trading Terminal ('botbuilder'),
// just jumped straight to its Tutorials tab via the hash above. Without a
// signal, epm-botbuilder can't tell the two embeds apart, so its tab bar
// and Run panel would render on both. This flag is read by epm-botbuilder's
// main.tsx (?embed=tutorial-only) to hide its own tab bar + Run panel only
// for this embed — 'botbuilder' never gets this param, so it always renders
// its full UI untouched.
const TUTORIAL_ONLY_EMBED_PARAM = { embed: 'tutorial-only' } as const;

// Builds the final iframe src for a given page: base URL, plus an optional
// query string, plus the page's hash suffix (if any) — always in that order,
// per the comment above. Centralizing this in one place means the
// tutorial-only flag only has to be applied once, not duplicated across the
// three separate places (public preload, active authenticated page,
// background preload queue) that each build one of these URLs.
function buildIframeSrc(page: string, base: string, extraParams?: Record<string, string>): string {
  const hashSuffix = iframeHashes[page] ? `#${iframeHashes[page]}` : '';
  const queryParams: Record<string, string> = { ...extraParams };
  if (page === 'tutorials') {
    Object.assign(queryParams, TUTORIAL_ONLY_EMBED_PARAM);
  }
  const queryString = Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : '';
  return `${base}${queryString}${hashSuffix}`;
}

// Theme sync protocol used to keep every embedded iframe app's theme in
// lockstep with this outer shell's theme (next-themes state does not cross
// iframe/origin boundaries on its own).
const THEME_REQUEST_MSG = 'epm-theme-request';
const THEME_UPDATE_MSG = 'epm-theme-update';

function resolveBalance(
  account: { account_id: string; balance: number | string; currency: string },
  liveBalances: LiveBalanceMap
): { balance: number; currency: string } {
  const live = liveBalances[account.account_id];
  if (live) {
    return { balance: live.balance, currency: live.currency };
  }
  return { balance: Number(account.balance), currency: account.currency };
}

/** Global keyframes for the live-balance pulse dot and flash-on-change effect.
 *  Injected once via a <style> tag (see HomePageInner) so no separate CSS
 *  file needs to be touched. */
const LIVE_STYLE_ID = 'epm-live-balance-styles';
function LiveStyles() {
  return (
    <style id={LIVE_STYLE_ID}>{`
      @keyframes epm-live-pulse {
        0% { box-shadow: 0 0 0 0 rgba(76,201,120,0.55); }
        70% { box-shadow: 0 0 0 6px rgba(76,201,120,0); }
        100% { box-shadow: 0 0 0 0 rgba(76,201,120,0); }
      }
    `}</style>
  );
}

/** Small pulsing dot + "LIVE" label shown next to a balance that is backed
 *  by the real-time `balance`/`account:'all'` subscription (as opposed to
 *  the one-time login snapshot). */
function LiveBadge({ live, size = 5 }: { live: boolean; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          background: live ? '#4cc978' : 'rgb(var(--foreground) / 0.25)',
          animation: live ? 'epm-live-pulse 1.8s infinite' : 'none',
        }}
      />
      {live && (
        <span style={{ fontSize: '5px', fontWeight: 700, letterSpacing: '0.06em', color: '#4cc978' }}>LIVE</span>
      )}
    </span>
  );
}

/** Tracks the previous value and returns 'up' | 'down' for a short window
 *  right after the value changes, then clears back to null. Used to flash
 *  a balance green (profit/credit) or red (loss/debit) the instant a live
 *  update moves it — so a win/loss is visible immediately, not just implied
 *  by the number itself changing quietly. */
function useBalanceFlash(value: number): 'up' | 'down' | null {
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevRef.current !== null && value !== prevRef.current) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setFlash(null), 1300);
    }
    prevRef.current = value;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  return flash;
}

/**
 * Sidebar account switcher. Shows Real/Demo + account ID only — no balance.
 * Balance is intentionally NOT shown here: the embedded trading apps
 * (DTrader etc.) already display the authoritative, correct live balance,
 * and keeping a second independent balance source in the sidebar risked
 * drifting out of sync with what a trade actually did to the account.
 * scoped to the sidebar switcher only.
 */
function SidebarAuth({ onClose }: { onClose: () => void }) {
  const { auth } = useDerivWSContext();
  const { authState, activeAccount, accounts, activeAccountId, login, signUp, logout, switchAccount, error } = auth;
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const btnBase: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', textAlign: 'center',
  };
  if (isAuthenticated && activeAccount) {
    return (
      <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', marginTop: '8px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button onClick={() => setSwitcherOpen(o => !o)}
          style={{
            ...btnBase,
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.25)', color: 'rgb(var(--foreground))', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '5px', fontWeight: 700, background: activeAccount.account_type === 'real' ? 'rgba(76,201,120,0.18)' : 'rgba(201,168,76,0.18)', color: activeAccount.account_type === 'real' ? '#4cc978' : '#c9a84c' }}>
              {activeAccount.account_type === 'real' ? 'REAL' : 'DEMO'}
            </span>
            <span style={{ color: 'rgb(var(--foreground) / 0.7)', fontSize: '6px' }}>{activeAccount.account_id}</span>
          </span>
          <span style={{ fontSize: '5px', color: 'rgb(var(--foreground) / 0.4)', transition: 'transform 0.2s', transform: switcherOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>
        {switcherOpen && (
          <div style={{ background: 'rgb(var(--popover))', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
            {accounts.map(acc => {
              const isActive = acc.account_id === activeAccountId;
              return (
                <button key={acc.account_id}
                  onClick={async () => { setSwitcherOpen(false); if (!isActive) await switchAccount(acc.account_id); onClose(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 12px', background: isActive ? 'rgba(201,168,76,0.08)' : 'none', border: 'none', borderBottom: '1px solid rgb(var(--foreground) / 0.05)', color: 'rgb(var(--foreground))', fontSize: '6px', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '4.5px', fontWeight: 700, background: acc.account_type === 'real' ? 'rgba(76,201,120,0.18)' : 'rgba(201,168,76,0.18)', color: acc.account_type === 'real' ? '#4cc978' : '#c9a84c' }}>
                      {acc.account_type === 'real' ? 'REAL' : 'DEMO'}
                    </span>
                    {acc.account_id}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <button onClick={() => { logout(); onClose(); }}
          style={{ ...btnBase, background: 'none', border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c' }}>Log Out</button>
      </div>
    );
  }
  return (
    <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', marginTop: '8px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {error && (
        <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.4, color: '#e08787', background: 'rgba(224,135,135,0.08)', border: '1px solid rgba(224,135,135,0.25)', borderRadius: '6px', padding: '8px 10px' }}>
          Sign-in failed: {error}. Please try again.
        </p>
      )}
      <button onClick={() => { login(); onClose(); }} disabled={isAuthenticating}
        style={{ ...btnBase, background: 'none', border: '1px solid rgba(201,168,76,0.5)', color: '#c9a84c', opacity: isAuthenticating ? 0.6 : 1 }}>
        {isAuthenticating ? 'Logging in…' : 'Log In'}
      </button>
      <button onClick={() => { signUp(); onClose(); }} disabled={isAuthenticating}
        style={{ ...btnBase, background: 'linear-gradient(135deg, #b8962e, #e8c840)', color: '#0a0a0a', opacity: isAuthenticating ? 0.6 : 1 }}>
        Sign Up
      </button>
    </div>
  );
}

function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const cards = [
    { label: 'DTrader',           icon: '💹', page: 'dtrader' },
    { label: 'Smart Trading Terminal',   icon: '🤖', page: 'botbuilder' },
    { label: 'Free Bots by EPM',  icon: '🎁', page: 'freebots' },
    { label: 'EPM Analyser Tool', icon: '📡', page: 'epmanalyser' },
    { label: 'Trading Courses', icon: '🎓', page: 'tutorials' },
  ];
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'rgb(var(--foreground))',
      background: 'rgb(var(--background))',
      position: 'relative',
      overflowX: 'hidden',
      paddingTop: 'clamp(32px, 8vh, 80px)',
      paddingBottom: '80px',
      paddingLeft: '20px',
      paddingRight: '20px',
      boxSizing: 'border-box',
    }}>
      <HeroBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '800px' }}>
        <h1 style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontWeight: 700, color: 'rgb(var(--foreground))', margin: 0, textAlign: 'center', letterSpacing: '0.04em', fontSize: 'clamp(26px, 6vw, 44px)' }}>
          Executive<span style={{ color: '#e8c840' }}>Prime</span>Markets
        </h1>
        <span style={{ display: 'block', width: '64px', height: '2px', background: 'linear-gradient(90deg, #c9a84c, #e8c840)', borderRadius: '2px' }} />
        <p style={{ color: 'rgb(var(--foreground) / 0.75)', fontSize: 'clamp(13px, 3vw, 16px)', textAlign: 'center', maxWidth: '520px', margin: 0, lineHeight: 1.6 }}>
          Professional Trading Tools, Premium Bots, Market Intelligence &amp; Financial Growth.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '14px',
          width: '100%',
          marginTop: '12px',
        }}>
          {cards.map(card => (
            <div
              key={card.page}
              onClick={() => onNavigate(card.page)}
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '12px',
                padding: '20px 12px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px' }}>{card.icon}</div>
              <div style={{ color: '#c9a84c', fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AccountLike {
  account_id: string;
  balance: number | string;
  currency: string;
  account_type: string;
}

/** One row in the My Accounts list. Pulled into its own component (rather
 *  than inline in a .map) because it calls useBalanceFlash, and hooks can't
 *  run inside an array callback. */
function AccountRow({
  acc,
  kind,
  isActive,
  liveBalances,
}: {
  acc: AccountLike;
  kind: 'real' | 'demo';
  isActive: boolean;
  liveBalances: LiveBalanceMap;
}) {
  const { balance, currency } = resolveBalance(acc, liveBalances);
  const isLive = Boolean(liveBalances[acc.account_id]);
  const flash = useBalanceFlash(balance);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: '10px',
        background: flash === 'up' ? 'rgba(76,201,120,0.18)' : flash === 'down' ? 'rgba(224,135,135,0.18)' : (isActive ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.04)'),
        border: isActive ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(201,168,76,0.15)',
        transition: 'background 0.6s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span style={{
          padding: '3px 8px', borderRadius: '4px', fontSize: '5px', fontWeight: 700, flexShrink: 0,
          background: kind === 'real' ? 'rgba(76,201,120,0.18)' : 'rgba(201,168,76,0.18)',
          color: kind === 'real' ? '#4cc978' : '#c9a84c',
        }}>
          {kind === 'real' ? 'REAL' : 'DEMO'}
        </span>
        <span style={{ color: 'rgb(var(--foreground) / 0.85)', fontSize: '6.5px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {acc.account_id}
        </span>
        {isActive && (
          <span style={{ color: 'rgb(var(--foreground) / 0.35)', fontSize: '5.5px', flexShrink: 0 }}>
            (active)
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <LiveBadge live={isLive} />
        <span style={{ color: 'rgb(var(--foreground))', fontSize: '7.5px', fontWeight: 700 }}>
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
        </span>
      </div>
    </div>
  );
}

function AccountsPage() {
  const { auth, liveBalances, isConnected } = useDerivWSContext();
  const { authState, accounts, activeAccountId, login } = auth;

  if (authState !== 'authenticated') {
    return (
      <div style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--foreground))', gap: '16px', background: 'rgb(var(--background))', padding: '40px 20px', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '48px' }}>💼</div>
        <h2 style={{ color: '#c9a84c', margin: 0, textAlign: 'center' }}>My Accounts</h2>
        <p style={{ color: 'rgb(var(--foreground) / 0.4)', margin: 0, textAlign: 'center', maxWidth: '360px' }}>
          Log in to view every demo and real account under your login, with live balances.
        </p>
        <button
          onClick={() => login()}
          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(201,168,76,0.5)', background: 'none', color: '#c9a84c' }}
        >
          Log In
        </button>
      </div>
    );
  }

  const realAccounts = accounts.filter(acc => acc.account_type === 'real');
  const demoAccounts = accounts.filter(acc => acc.account_type === 'demo');

  const renderGroup = (label: string, list: typeof accounts, kind: 'real' | 'demo') => {
    if (list.length === 0) return null;
    return (
      <div style={{ width: '100%', marginBottom: '24px' }}>
        <h3 style={{ color: 'rgb(var(--foreground) / 0.55)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px 4px' }}>
          {label}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {list.map(acc => {
            const isActive = acc.account_id === activeAccountId;
            return (
              <AccountRow
                key={acc.account_id}
                acc={acc}
                kind={kind}
                isActive={isActive}
                liveBalances={liveBalances}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
      color: 'rgb(var(--foreground))', background: 'rgb(var(--background))',
      padding: 'clamp(24px, 6vh, 60px) 20px 60px', boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <h1 style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontWeight: 700, color: 'rgb(var(--foreground))', margin: '0 0 4px', fontSize: 'clamp(22px, 5vw, 30px)' }}>
          My <span style={{ color: '#e8c840' }}>Accounts</span>
        </h1>
        <p style={{ color: 'rgb(var(--foreground) / 0.5)', fontSize: '13px', margin: '0 0 4px' }}>
          Every demo and real account under your login, updating live.
        </p>
        <p style={{ color: 'rgb(var(--foreground) / 0.35)', fontSize: '11px', margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#4cc978' : '#e08787', animation: isConnected ? 'epm-live-pulse 1.8s infinite' : 'none' }} />
          {isConnected ? 'Connected — balances stream in real time' : 'Reconnecting…'}
        </p>
        {realAccounts.length === 0 && demoAccounts.length === 0 ? (
          <p style={{ color: 'rgb(var(--foreground) / 0.4)', fontSize: '13px' }}>No accounts found for this login.</p>
        ) : (
          <>
            {renderGroup('Real Accounts', realAccounts, 'real')}
            {renderGroup('Demo Accounts', demoAccounts, 'demo')}
          </>
        )}
      </div>
    </div>
  );
}

function ComingSoonPage({ label }: { label: string }) {
  return (
    <div style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--foreground))', gap: '16px', background: 'rgb(var(--background))', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '48px' }}>🚧</div>
      <h2 style={{ color: '#c9a84c', margin: 0, textAlign: 'center' }}>{label}</h2>
      <p style={{ color: 'rgb(var(--foreground) / 0.4)', margin: 0, textAlign: 'center' }}>Coming soon — check back shortly.</p>
    </div>
  );
}

function HomePageInner() {
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace('/', '').trim();
      return path || 'dashboard';
    }
    return 'dashboard';
  });
  const { auth } = useDerivWSContext();
  const { authState, accessToken, activeAccountId, accounts } = auth;

  // Outer shell theme — this is the single source of truth that gets pushed
  // down to every embedded iframe app via postMessage, since next-themes
  // state does not cross iframe/origin boundaries on its own.
  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => setThemeMounted(true), []);

  // Sidebar is now a floating panel: closed by default (just the menu
  // button shows), opened by clicking the menu button, closed via the X
  // inside the panel, the backdrop, or the Escape key. It overlays the
  // page instead of pushing/compressing the content.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const [preloadedPages, setPreloadedPages] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace('/', '').trim() || 'dashboard';
      if (iframeBases[path]) initial.add(path);
    }
    return initial;
  });

  const handleNavHover = (href: string) => {
    if (!iframeBases[href]) return;
    setPreloadedPages(prev => { if (prev.has(href)) return prev; const next = new Set(prev); next.add(href); return next; });
  };

  useEffect(() => {
    Object.keys(iframeBases).forEach((page, i) => {
      setTimeout(() => {
        setPreloadedPages(prev => { if (prev.has(page)) return prev; const next = new Set(prev); next.add(page); return next; });
      }, 4000 + i * 1200);
    });
  }, []);

  const handleNavClick = (href: string) => {
    handleNavHover(href);
    setActivePage(href);
    window.history.pushState(null, '', href === 'dashboard' ? '/' : `/${href}`);
    setSidebarOpen(false);
  };

  const [loadedCombos, setLoadedCombos] = useState<Record<string, string>>({});
  const backgroundQueueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs to every currently-mounted iframe, keyed by the same combo key used
  // in loadedCombos, so we can postMessage theme updates directly to them.
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  // Every distinct origin we might embed — used to validate incoming
  // postMessage requests so we only ever reply to our own iframes.
  const allowedOrigins = useMemo(
    () => Array.from(new Set(Object.values(iframeBases).map(base => new URL(base).origin))),
    []
  );

  useEffect(() => {
    if (authState === 'authenticated') return;
    preloadedPages.forEach(page => {
      const base = iframeBases[page]; if (!base) return;
      const key = `${page}::public`;
      const src = buildIframeSrc(page, base);
      setLoadedCombos(prev => (prev[key] ? prev : { ...prev, [key]: src }));
    });
  }, [preloadedPages, authState]);

  useEffect(() => {
    if (authState !== 'authenticated' || !accessToken || !activeAccountId) return;
    const base = iframeBases[activePage]; if (!base) return;
    const key = `${activePage}::${activeAccountId}`;
    setLoadedCombos(prev => {
      if (prev[key]) return prev;
      const src = buildIframeSrc(activePage, base, { token: accessToken, acct: activeAccountId });
      return { ...prev, [key]: src };
    });
  }, [activePage, authState, accessToken, activeAccountId]);

  useEffect(() => {
    if (backgroundQueueTimerRef.current) { clearInterval(backgroundQueueTimerRef.current); backgroundQueueTimerRef.current = null; }
    if (authState !== 'authenticated' || !accessToken || accounts.length === 0) return;
    backgroundQueueTimerRef.current = setInterval(() => {
      setLoadedCombos(prev => {
        const ordered = [activePage, ...Array.from(preloadedPages).filter(p => p !== activePage)];
        for (const page of ordered) {
          const base = iframeBases[page]; if (!base) continue;
          for (const acc of accounts) {
            const key = `${page}::${acc.account_id}`;
            if (!prev[key]) {
              const src = buildIframeSrc(page, base, { token: accessToken, acct: acc.account_id });
              return { ...prev, [key]: src };
            }
          }
        }
        return prev;
      });
    }, 1400);
    return () => { if (backgroundQueueTimerRef.current) { clearInterval(backgroundQueueTimerRef.current); backgroundQueueTimerRef.current = null; } };
  }, [authState, accessToken, accounts, preloadedPages, activePage]);

  useEffect(() => {
    if (authState === 'authenticated') return;
    setLoadedCombos(prev => {
      let changed = false; const next: Record<string, string> = {};
      Object.entries(prev).forEach(([key, src]) => { if (key.endsWith('::public')) { next[key] = src; } else { changed = true; } });
      return changed ? next : prev;
    });
  }, [authState]);

  // Reply to "what's the current theme?" requests from any embedded iframe,
  // but only if the request came from one of our own known iframe origins.
  useEffect(() => {
    if (!themeMounted) return;
    function handleThemeRequest(event: MessageEvent) {
      if (!allowedOrigins.includes(event.origin)) return;
      if (event.data?.type !== THEME_REQUEST_MSG) return;
      const win = event.source as Window | null;
      win?.postMessage({ type: THEME_UPDATE_MSG, theme: theme === 'dark' ? 'dark' : 'light' }, event.origin);
    }
    window.addEventListener('message', handleThemeRequest);
    return () => window.removeEventListener('message', handleThemeRequest);
  }, [theme, themeMounted, allowedOrigins]);

  // Whenever the outer theme changes, immediately push it to every
  // currently-loaded iframe so they update live (not just on next reload).
  useEffect(() => {
    if (!themeMounted) return;
    Object.entries(iframeRefs.current).forEach(([key, el]) => {
      if (!el) return;
      const src = loadedCombos[key];
      if (!src) return;
      try {
        const origin = new URL(src).origin;
        el.contentWindow?.postMessage({ type: THEME_UPDATE_MSG, theme: theme === 'dark' ? 'dark' : 'light' }, origin);
      } catch {
        // ignore malformed src
      }
    });
  }, [theme, themeMounted, loadedCombos]);

  const hasIframeBase = !!iframeBases[activePage];

  return (
    <main style={{ margin: 0, padding: 0, width: '100vw', height: '100dvh', background: 'rgb(var(--background))', fontFamily: 'Inter, sans-serif', overflow: 'visible', position: 'relative' }}>
      <LiveStyles />

      {/* Small fixed menu button — always visible, does not affect layout.
          Opens the floating sidebar panel. */}
      {!sidebarOpen && (
        <div
          style={{
            position: 'fixed', top: '14px', left: '14px', zIndex: 150,
            display: 'flex', alignItems: 'stretch',
            background: 'rgb(var(--background))', border: '1px solid rgba(201,168,76,0.25)',
            borderRadius: '10px', overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Menu size={15} color="#c9a84c" strokeWidth={2} />
          </button>
          {themeMounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              style={{ background: 'none', border: 'none', borderLeft: '1px solid rgba(201,168,76,0.25)', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? <Sun size={14} color="#c9a84c" strokeWidth={2} /> : <Moon size={14} color="#c9a84c" strokeWidth={2} />}
            </button>
          )}
        </div>
      )}

      {/* Backdrop — click to close, sits behind the panel but above the page content. */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 140, transition: 'opacity 0.2s ease' }}
        />
      )}

      {/* Floating sidebar panel — overlays the page rather than pushing/compressing it. */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, height: '100%', width: '200px',
          background: 'rgb(var(--background))', borderRight: '1px solid rgba(201,168,76,0.12)',
          display: 'flex', flexDirection: 'column', padding: '12px 10px 10px', gap: '1px',
          zIndex: 150, overflowY: 'auto', boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s ease',
        }}
      >
        {/* Header: close button sits in its own absolutely-positioned top-right
            corner, fully independent of the logo/wordmark below it, so long
            wordmark text can never visually collide with it regardless of
            sidebar width (this was the cause of the earlier overlap bug). */}
        <div style={{ position: 'relative', marginBottom: '14px', paddingTop: '2px' }}>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--foreground) / 0.6)', zIndex: 1 }}
          >
            <X size={20} strokeWidth={2} />
          </button>
          <a
            href="/"
            onClick={e => { e.preventDefault(); handleNavClick('dashboard'); }}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingRight: '24px', paddingTop: '2px' }}
          >
            <img src="/logo.png" alt="EPM logo" style={{ height: '40px', width: 'auto', display: 'block', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.01em', whiteSpace: 'nowrap', userSelect: 'none', textAlign: 'center' }}>
              <span style={{ color: 'rgb(var(--foreground))' }}>Executive</span>
              <span style={{ color: '#e8c840' }}>Prime</span>
              <span style={{ color: 'rgb(var(--foreground))' }}>Markets</span>
            </span>
          </a>
        </div>

        {navLinks.map(link => (
          <a key={link.label} href="#" onClick={e => { e.preventDefault(); handleNavClick(link.href); }}
            title={link.label}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', justifyContent: 'flex-start', borderRadius: '7px', color: activePage === link.href ? '#c9a84c' : 'rgb(var(--foreground) / 0.6)', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', borderLeft: activePage === link.href ? '2px solid #c9a84c' : '2px solid transparent', background: activePage === link.href ? 'rgba(201,168,76,0.08)' : 'transparent', transition: 'all 0.15s' }}
            onMouseEnter={e => { handleNavHover(link.href); if (activePage !== link.href) { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.borderLeftColor = '#c9a84c'; } }}
            onMouseLeave={e => { if (activePage !== link.href) { e.currentTarget.style.color = 'rgb(var(--foreground) / 0.6)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; } }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{link.icon}</span>
            {link.label}
          </a>
        ))}
        <div style={{ flex: 1 }} />

        {/* Theme toggle — same control as the floating top-left button, mirrored
            here inside the sidebar, directly above the balance/Log Out block. */}
        {themeMounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 10px', borderRadius: '7px',
              border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.05)',
              color: 'rgb(var(--foreground) / 0.75)', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', marginTop: '6px',
            }}
          >
            {theme === 'dark' ? <Sun size={14} color="#c9a84c" strokeWidth={2} /> : <Moon size={14} color="#c9a84c" strokeWidth={2} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        )}

        <SidebarAuth onClose={() => setSidebarOpen(false)} />
        <div style={{ padding: '10px', fontSize: '9px', color: 'rgb(var(--foreground) / 0.18)', letterSpacing: '1.2px', borderTop: '1px solid rgba(201,168,76,0.1)', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          POWERED BY <span style={{ color: 'rgba(201,168,76,0.4)' }}>DERIV</span>
        </div>
      </aside>

      {/* Main content area — full width always, since the sidebar no longer
          takes up layout space (it floats on top instead). */}
      <div style={{ width: '100%', height: '100%', position: 'relative', overflowX: 'hidden', overflowY: 'auto', display: 'flex' }}>
        {Array.from(preloadedPages).map(page => {
          const isActivePage = activePage === page;
          const activeKey = authState === 'authenticated' && activeAccountId ? `${page}::${activeAccountId}` : `${page}::public`;
          const pageKeys = Object.keys(loadedCombos).filter(k => k.startsWith(`${page}::`));
          return (
            <div key={page} style={{ width: '100%', height: '100%', position: isActivePage ? 'static' : 'absolute', top: 0, left: 0, opacity: isActivePage ? 1 : 0, pointerEvents: isActivePage ? 'auto' : 'none', zIndex: isActivePage ? 1 : 0, flex: isActivePage ? 1 : undefined, transition: 'opacity 0.35s ease' }}>
              {pageKeys.map(key => {
                const src = loadedCombos[key]; const isVisible = key === activeKey;
                return (
                  <iframe
                    key={key}
                    ref={el => { iframeRefs.current[key] = el; }}
                    src={src}
                    title={key}
                    allow="fullscreen"
                    style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0, opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? 'auto' : 'none', zIndex: isVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}
                  />
                );
              })}
            </div>
          );
        })}
        {!hasIframeBase && activePage === 'dashboard' && <DashboardPage onNavigate={handleNavClick} />}
        {!hasIframeBase && activePage === 'accounts'   && <AccountsPage />}
        {!hasIframeBase && activePage === 'freebots'   && <FreeBotsPage />}
        {!hasIframeBase && activePage !== 'dashboard' && activePage !== 'accounts' && activePage !== 'freebots' && (
          <ComingSoonPage label={navLinks.find(l => l.href === activePage)?.label || activePage} />
        )}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <DerivWSProvider>
      <HomePageInner />
    </DerivWSProvider>
  );
}
