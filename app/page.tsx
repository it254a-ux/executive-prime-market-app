'use client';

import { useState, useEffect, useRef } from 'react';
import { DerivWSProvider, useDerivWSContext, LiveBalance } from '@/components/custom/deriv-ws-provider';

const navLinks = [
  { label: 'Dashboard',         icon: '🏠', href: 'dashboard' },
  { label: 'Charts',            icon: '📊', href: 'charts' },
  { label: 'DTrader',           icon: '💹', href: 'dtrader' },
  { label: 'Analysis Tool',     icon: '🔍', href: 'analysis' },
  { label: 'Bot Builder',       icon: '🤖', href: 'botbuilder' },
  { label: 'Free Bots by EPM',  icon: '🎁', href: 'freebots' },
  { label: 'Copy Trading',      icon: '🔗', href: 'copytrading' },
  { label: 'Trading Tutorials', icon: '🎓', href: 'tutorials' },
];

const iframeBases: Record<string, string> = {
  charts:      'https://charts-accumulators-app.vercel.app',
  dtrader:     'https://rise-fall-epm-dtrader.vercel.app',
  analysis:    'https://digits-epm-analysis.vercel.app',
  copytrading: 'https://epm-copy-trading.vercel.app',
  botbuilder:  'https://epm-botbuilder-uo51.vercel.app',
};

// How long to wait, after a background iframe finishes loading, before
// swapping it in as the visible one. Gives the subapp's internal token /
// WebSocket-authorize flow a moment to run before it's shown. Tune this
// up if you still see the odd flash of a "logging in" state after switching,
// or down if switching feels sluggish.
const SWAP_GRACE_MS = 900;

// Prefer the live-subscribed balance when it's for the currently active
// account; otherwise fall back to the one-time snapshot from login/switch.
function resolveBalance(
  account: { account_id: string; balance: number | string; currency: string },
  liveBalance: LiveBalance | null
): { balance: number; currency: string } {
  if (liveBalance && liveBalance.loginid === account.account_id) {
    return { balance: liveBalance.balance, currency: liveBalance.currency };
  }
  return { balance: Number(account.balance), currency: account.currency };
}

function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', gap: '24px', padding: '40px',
      background: '#181c25'
    }}>
      <img src="/logo.png" alt="ExecutivePrimeMarkets" style={{ height: '100px', width: 'auto' }} />
      <h1 style={{ color: '#c9a84c', fontSize: '28px', fontWeight: 700, margin: 0, textAlign: 'center' }}>
        Welcome to Executive Prime Markets
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', textAlign: 'center', maxWidth: '480px', margin: 0 }}>
        Your all-in-one trading platform powered by Deriv. Use the menu to navigate to your tools.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
        {[
          { label: 'Charts',      icon: '📊', page: 'charts' },
          { label: 'DTrader',     icon: '💹', page: 'dtrader' },
          { label: 'Analysis',    icon: '🔍', page: 'analysis' },
          { label: 'Bot Builder', icon: '🤖', page: 'botbuilder' },
        ].map(card => (
          <div key={card.page} onClick={() => onNavigate(card.page)} style={{
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '12px', padding: '24px 28px', cursor: 'pointer',
            textAlign: 'center', minWidth: '100px'
          }}>
            <div style={{ fontSize: '32px' }}>{card.icon}</div>
            <div style={{ color: '#c9a84c', fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComingSoonPage({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', gap: '16px',
      background: '#181c25'
    }}>
      <div style={{ fontSize: '48px' }}>🚧</div>
      <h2 style={{ color: '#c9a84c', margin: 0 }}>{label}</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Coming soon — check back shortly.</p>
    </div>
  );
}

function AccountSwitcher() {
  const { auth, liveBalance } = useDerivWSContext();
  const { accounts, activeAccount, activeAccountId, switchAccount } = auth;
  const [open, setOpen] = useState(false);

  if (!activeAccount || accounts.length === 0) return null;

  const { balance: activeBalance, currency: activeCurrency } = resolveBalance(activeAccount, liveBalance);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 12px', borderRadius: '7px',
          border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.06)',
          color: '#fff', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
        }}
      >
        <span style={{
          padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
          background: activeAccount.account_type === 'real' ? 'rgba(76,201,120,0.18)' : 'rgba(201,168,76,0.18)',
          color: activeAccount.account_type === 'real' ? '#4cc978' : '#c9a84c',
        }}>
          {activeAccount.account_type === 'real' ? 'REAL' : 'DEMO'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>
          {activeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrency}
        </span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 250 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            minWidth: '220px', background: '#13130f',
            border: '1px solid rgba(201,168,76,0.25)', borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 260, overflow: 'hidden'
          }}>
            {accounts.map(acc => {
              const isActive = acc.account_id === activeAccountId;
              const { balance: accBalance, currency: accCurrency } = resolveBalance(acc, liveBalance);
              return (
                <button
                  key={acc.account_id}
                  onClick={async () => {
                    setOpen(false);
                    if (!isActive) await switchAccount(acc.account_id);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '10px', padding: '10px 14px', background: isActive ? 'rgba(201,168,76,0.08)' : 'none',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: '#fff', fontSize: '13px', cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                      background: acc.account_type === 'real' ? 'rgba(76,201,120,0.18)' : 'rgba(201,168,76,0.18)',
                      color: acc.account_type === 'real' ? '#4cc978' : '#c9a84c',
                    }}>
                      {acc.account_type === 'real' ? 'REAL' : 'DEMO'}
                    </span>
                    {acc.account_id}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {accBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {accCurrency}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function AuthButtons() {
  const { auth } = useDerivWSContext();
  const { authState, activeAccount, login, signUp, logout } = auth;
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  if (isAuthenticated && activeAccount) {
    return (
      <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '10px' }}>
        <AccountSwitcher />
        <button
          onClick={logout}
          style={{
            padding: '7px 18px', borderRadius: '7px',
            border: '1px solid rgba(201,168,76,0.5)', background: 'none',
            color: '#c9a84c', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={login}
        disabled={isAuthenticating}
        style={{
          padding: '7px 18px', borderRadius: '7px',
          border: '1px solid rgba(201,168,76,0.5)', background: 'none',
          color: '#c9a84c', fontSize: '13px', fontWeight: 600,
          cursor: isAuthenticating ? 'not-allowed' : 'pointer',
          opacity: isAuthenticating ? 0.6 : 1,
          whiteSpace: 'nowrap'
        }}
      >
        {isAuthenticating ? 'Logging in…' : 'Log In'}
      </button>
      <button
        onClick={signUp}
        disabled={isAuthenticating}
        style={{
          padding: '7px 18px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #b8962e, #e8c840)', border: 'none',
          color: '#0a0a0a', fontSize: '13px', fontWeight: 700,
          cursor: isAuthenticating ? 'not-allowed' : 'pointer',
          opacity: isAuthenticating ? 0.6 : 1,
          whiteSpace: 'nowrap'
        }}
      >
        Sign Up
      </button>
    </div>
  );
}

// Each preloaded page gets two "slots" (A and B). Only one is ever visible —
// the other loads silently in the background. When switching accounts, the
// new token/acct URL is staged into whichever slot isn't currently showing;
// once that background iframe finishes loading (+ a short grace period for
// its internal auth flow to run), it becomes the visible slot. The user
// never sees a blank iframe or reload — just a clean swap.
interface PageSlots {
  active: 'A' | 'B';
  srcA: string | null;
  srcB: string | null;
}

function HomePageInner() {
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace('/', '').trim();
      return path || 'dashboard';
    }
    return 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { auth } = useDerivWSContext();
  const { authState, accessToken, activeAccountId } = auth;

  // Tracks which subpages have started loading in the background (hover-preload).
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
    setPreloadedPages(prev => {
      if (prev.has(href)) return prev;
      const next = new Set(prev);
      next.add(href);
      return next;
    });
  };

  // Warm up all subpages in the background shortly after the app loads,
  // staggered so they don't all hit the network at once.
  useEffect(() => {
    const pages = Object.keys(iframeBases);
    pages.forEach((page, i) => {
      setTimeout(() => {
        setPreloadedPages(prev => {
          if (prev.has(page)) return prev;
          const next = new Set(prev);
          next.add(page);
          return next;
        });
      }, 800 + i * 600); // stagger by 600ms per page, starting after 800ms
    });
  }, []);

  const getIframeSrc = (page: string): string | null => {
    const base = iframeBases[page];
    if (!base) return null;
    if (authState === 'authenticated' && accessToken) {
      const params = new URLSearchParams({ token: accessToken });
      if (activeAccountId) params.set('acct', activeAccountId);
      return `${base}?${params.toString()}`;
    }
    return base;
  };

  const iframeSrcForFallback = getIframeSrc(activePage);

  const handleNavClick = (href: string) => {
    handleNavHover(href);
    setActivePage(href);
    setSidebarOpen(false);
    const newUrl = href === 'dashboard' ? '/' : `/${href}`;
    window.history.pushState(null, '', newUrl);
  };

  // Two-slot state per page: which slot is visible, and each slot's src.
  const [pageSlots, setPageSlots] = useState<Record<string, PageSlots>>({});
  const swapTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Whenever the target src for a page changes (login, logout, or account
  // switch), stage it into whichever slot isn't currently visible. If it's
  // already showing, or already staged and loading, do nothing.
  useEffect(() => {
    preloadedPages.forEach(page => {
      const target = getIframeSrc(page);
      if (!target) return;
      setPageSlots(prev => {
        const existing = prev[page];
        if (!existing) {
          return { ...prev, [page]: { active: 'A', srcA: target, srcB: null } };
        }
        const activeSrc = existing.active === 'A' ? existing.srcA : existing.srcB;
        const inactiveSrc = existing.active === 'A' ? existing.srcB : existing.srcA;
        if (activeSrc === target || inactiveSrc === target) return prev;
        const updated: PageSlots = existing.active === 'A'
          ? { ...existing, srcB: target }
          : { ...existing, srcA: target };
        return { ...prev, [page]: updated };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, accessToken, activeAccountId, preloadedPages]);

  // Called when a background (non-visible) slot finishes loading. After a
  // short grace period — enough time for that subapp's own token/WS-auth
  // flow to run — flip it to become the visible slot.
  const scheduleSwap = (page: string, slot: 'A' | 'B') => {
    if (swapTimeoutsRef.current[page]) clearTimeout(swapTimeoutsRef.current[page]);
    swapTimeoutsRef.current[page] = setTimeout(() => {
      setPageSlots(prev => {
        const existing = prev[page];
        if (!existing || existing.active === slot) return prev;
        return { ...existing, active: slot };
      });
    }, SWAP_GRACE_MS);
  };

  return (
    <main style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh',
      background: '#181c25', fontFamily: 'Inter, sans-serif',
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column'
    }}>

      {/* TOP BAR */}
      <nav style={{
        position: 'relative', zIndex: 200,
        height: '62px', background: 'rgba(24,28,37,0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.18)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', flexShrink: 0,
        backdropFilter: 'blur(12px)', gap: '12px'
      }}>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px', display: 'flex', flexDirection: 'column',
            gap: '5px', flexShrink: 0
          }}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: 'block', width: '22px', height: '2px',
              background: '#c9a84c',
              borderRadius: '2px',
              transform: sidebarOpen
                ? (i === 0 ? 'rotate(45deg) translate(5px, 5px)' : i === 2 ? 'rotate(-45deg) translate(5px, -5px)' : 'scaleX(0)')
                : 'none',
              transition: 'all 0.2s'
            }} />
          ))}
        </button>

        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}
          onClick={e => { e.preventDefault(); handleNavClick('dashboard'); }}>
          <img src="/logo.png" alt="ExecutivePrimeMarkets"
            style={{ height: '55px', width: 'auto', display: 'block' }} />
        </a>

        <div style={{ flex: 1 }} />

        <AuthButtons />
      </nav>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 90
            }}
          />
        )}

        {/* SLIDING SIDEBAR */}
        <aside style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: '210px',
          background: '#181c25',
          borderRight: '1px solid rgba(201,168,76,0.12)',
          display: 'flex', flexDirection: 'column',
          padding: '16px 8px', gap: '2px',
          zIndex: 100,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}>
          {navLinks.map(link => (
            <a
              key={link.label}
              href="#"
              onClick={e => { e.preventDefault(); handleNavClick(link.href); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                color: activePage === link.href ? '#c9a84c' : 'rgba(255,255,255,0.6)',
                fontSize: '13px', textDecoration: 'none',
                borderLeft: activePage === link.href ? '2px solid #c9a84c' : '2px solid transparent',
                background: activePage === link.href ? 'rgba(201,168,76,0.08)' : 'transparent',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                handleNavHover(link.href);
                if (activePage !== link.href) {
                  e.currentTarget.style.color = '#c9a84c';
                  e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
                  e.currentTarget.style.borderLeftColor = '#c9a84c';
                }
              }}
              onMouseLeave={e => {
                if (activePage !== link.href) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{link.icon}</span>
              {link.label}
            </a>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{
            padding: '12px', fontSize: '10px',
            color: 'rgba(255,255,255,0.18)', letterSpacing: '1.5px',
            borderTop: '1px solid rgba(201,168,76,0.1)', marginTop: '8px'
          }}>
            POWERED BY <span style={{ color: 'rgba(201,168,76,0.4)' }}>DERIV</span>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, position: 'relative', overflow: 'auto', display: 'flex', width: '100%' }}>
          {Array.from(preloadedPages).map(page => {
            const slotState = pageSlots[page];
            if (!slotState) return null;
            const isActivePage = activePage === page;
            return (
              <div
                key={page}
                style={{
                  width: '100%', height: '100%',
                  position: isActivePage ? 'static' : 'absolute',
                  top: 0, left: 0,
                  opacity: isActivePage ? 1 : 0,
                  pointerEvents: isActivePage ? 'auto' : 'none',
                  zIndex: isActivePage ? 1 : 0,
                  flex: isActivePage ? 1 : undefined,
                }}
              >
                {(['A', 'B'] as const).map(slot => {
                  const src = slot === 'A' ? slotState.srcA : slotState.srcB;
                  if (!src) return null;
                  const isSlotVisible = slotState.active === slot;
                  return (
                    <iframe
                      key={`${page}-${slot}-${src}`}
                      src={src}
                      onLoad={() => {
                        if (slotState.active !== slot) scheduleSwap(page, slot);
                      }}
                      style={{
                        width: '100%', height: '100%', border: 'none',
                        position: 'absolute', top: 0, left: 0,
                        opacity: isSlotVisible ? 1 : 0,
                        pointerEvents: isSlotVisible ? 'auto' : 'none',
                        zIndex: isSlotVisible ? 1 : 0,
                      }}
                      title={`${page}-${slot}`}
                      allow="fullscreen"
                    />
                  );
                })}
              </div>
            );
          })}
          {!iframeSrcForFallback && activePage === 'dashboard' && (
            <DashboardPage onNavigate={handleNavClick} />
          )}
          {!iframeSrcForFallback && activePage !== 'dashboard' && (
            <ComingSoonPage label={navLinks.find(l => l.href === activePage)?.label || activePage} />
          )}
        </div>
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
