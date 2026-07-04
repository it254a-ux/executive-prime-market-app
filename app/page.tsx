'use client';

import { useState, useEffect, useRef } from 'react';
import { DerivWSProvider, useDerivWSContext, LiveBalance } from '@/components/custom/deriv-ws-provider';
import { HeroBackground } from '@/components/custom/hero-background';
import { FreeBotsPage } from '@/components/custom/free-bots-page';

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
  const cards = [
    { label: 'Charts',            icon: '📊', page: 'charts' },
    { label: 'DTrader',           icon: '💹', page: 'dtrader' },
    { label: 'Analysis Tool',     icon: '🔍', page: 'analysis' },
    { label: 'Bot Builder',       icon: '🤖', page: 'botbuilder' },
    { label: 'Free Bots by EPM',  icon: '🎁', page: 'freebots' },
    { label: 'Copy Trading',      icon: '🔗', page: 'copytrading' },
    { label: 'Trading Tutorials', icon: '🎓', page: 'tutorials' },
  ];

  return (
    <div className="page-fade-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', gap: '24px', padding: '40px',
      background: '#181c25',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <HeroBackground />
      <div className="hero-content" style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '20px',
      }}>
        <h1 className="hero-wordmark">
          Executive<span className="hero-gold">Prime</span>Markets
        </h1>

        <span className="hero-underline" />

        <p className="hero-sub" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', textAlign: 'center', maxWidth: '520px', margin: 0 }}>
          Professional Trading Tools, Premium Bots, Market Intelligence &amp; Financial Growth.
        </p>

        <div style={{
          display: 'flex', gap: '16px', flexWrap: 'wrap',
          justifyContent: 'center', marginTop: '20px', maxWidth: '760px',
        }}>
          {cards.map((card, i) => (
            <div
              key={card.page}
              onClick={() => onNavigate(card.page)}
              className="hero-card"
              style={{
                background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '12px', padding: '20px 24px', cursor: 'pointer',
                textAlign: 'center', minWidth: '110px',
                animationDelay: `${1.9 + i * 0.1}s`,
              }}
            >
              <div style={{ fontSize: '28px' }}>{card.icon}</div>
              <div style={{ color: '#c9a84c', fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page-fade-in {
          opacity: 0;
          animation: pageFadeIn 0.4s ease forwards;
        }
        .hero-wordmark {
          font-family: 'Georgia', 'Playfair Display', serif;
          font-size: 44px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          text-align: center;
          opacity: 0;
          letter-spacing: 0.18em;
          animation: settleText 0.9s ease-out 1.3s forwards;
        }
        .hero-gold {
          color: #e8c840;
        }
        .hero-underline {
          display: block;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #c9a84c, #e8c840);
          animation: drawLine 0.7s ease-out 1.6s forwards;
        }
        .hero-sub {
          opacity: 0;
          transform: translateY(14px);
          animation: fadeUp 0.8s ease-out 1.75s forwards;
        }
        .hero-card {
          opacity: 0;
          transform: translateY(12px) scale(0.94);
          box-shadow: 0 0 0 rgba(201,168,76,0);
          animation: cardReveal 0.7s ease-out forwards;
        }

        @keyframes pageFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { width: 0; }
          to   { width: 64px; }
        }
        @keyframes settleText {
          from { opacity: 0; letter-spacing: 0.18em; }
          to   { opacity: 1; letter-spacing: 0.01em; }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(12px) scale(0.94); box-shadow: 0 0 0 rgba(201,168,76,0); }
          to   { opacity: 1; transform: translateY(0) scale(1); box-shadow: 0 10px 24px rgba(201,168,76,0.12); }
        }

        @media (max-width: 640px) {
          .hero-wordmark { font-size: 30px; }
        }
      `}</style>
    </div>
  );
}

function ComingSoonPage({ label }: { label: string }) {
  return (
    <div className="page-fade-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', gap: '16px',
      background: '#181c25'
    }}>
      <div style={{ fontSize: '48px' }}>🚧</div>
      <h2 style={{ color: '#c9a84c', margin: 0 }}>{label}</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Coming soon — check back shortly.</p>
      <style jsx>{`
        .page-fade-in {
          opacity: 0;
          animation: pageFadeIn 0.4s ease forwards;
        }
        @keyframes pageFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
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
  const { authState, accessToken, activeAccountId, accounts } = auth;

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

  // Warm up other subpages in the background — but only after giving the
  // page you're actually on a real head start. Heavy apps (like Bot
  // Builder's bundle) need the network/CPU to themselves for the first
  // few seconds; starting other apps too early competes for that and
  // makes the page you're looking at feel slower, not faster.
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
      }, 4000 + i * 1200); // 4s head start, then one new page every 1.2s
    });
  }, []);

  const handleNavClick = (href: string) => {
    handleNavHover(href);
    setActivePage(href);
    setSidebarOpen(false);
    const newUrl = href === 'dashboard' ? '/' : `/${href}`;
    window.history.pushState(null, '', newUrl);
  };

  // Fully-preloaded, per-account iframe map: key = `${page}::${accountId}`
  // (or `${page}::public` before login). Every account this user has gets
  // its own permanently-mounted, hidden iframe for every preloaded page —
  // so switching REAL/DEMO, or navigating between pages, is a pure
  // visibility toggle once warmed. To avoid every account for every page
  // booting at once (which starved the page you're actually looking at),
  // loading is split into two tiers:
  //   1. Fast path — the page/account you're on right now loads immediately,
  //      unthrottled, so refreshing never feels slow.
  //   2. Background queue — everything else (other accounts on this page,
  //      other pages entirely) trickles in one at a time, active-page-first,
  //      so it never competes with what's on screen.
  const [loadedCombos, setLoadedCombos] = useState<Record<string, string>>({});
  const backgroundQueueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tier 1a — public (logged-out) pages are lightweight (login screen only),
  // load them immediately, no throttling needed.
  useEffect(() => {
    if (authState === 'authenticated') return;
    preloadedPages.forEach(page => {
      const base = iframeBases[page];
      if (!base) return;
      const key = `${page}::public`;
      setLoadedCombos(prev => (prev[key] ? prev : { ...prev, [key]: base }));
    });
  }, [preloadedPages, authState]);

  // Tier 1b — fast path: once authenticated, the page/account combo you're
  // actually looking at loads immediately, bypassing the background queue.
  useEffect(() => {
    if (authState !== 'authenticated' || !accessToken || !activeAccountId) return;
    const base = iframeBases[activePage];
    if (!base) return;
    const key = `${activePage}::${activeAccountId}`;
    setLoadedCombos(prev => {
      if (prev[key]) return prev;
      const params = new URLSearchParams({ token: accessToken, acct: activeAccountId });
      return { ...prev, [key]: `${base}?${params.toString()}` };
    });
  }, [activePage, authState, accessToken, activeAccountId]);

  // Tier 2 — background queue: fill in every other missing combo, one at a
  // time, active-page-first, so a page full of accounts never all boot
  // together and starve the app you're actually using.
  useEffect(() => {
    if (backgroundQueueTimerRef.current) {
      clearInterval(backgroundQueueTimerRef.current);
      backgroundQueueTimerRef.current = null;
    }
    if (authState !== 'authenticated' || !accessToken || accounts.length === 0) return;

    backgroundQueueTimerRef.current = setInterval(() => {
      setLoadedCombos(prev => {
        const pages = Array.from(preloadedPages);
        const ordered = [activePage, ...pages.filter(p => p !== activePage)];
        for (const page of ordered) {
          const base = iframeBases[page];
          if (!base) continue;
          for (const acc of accounts) {
            const key = `${page}::${acc.account_id}`;
            if (!prev[key]) {
              const params = new URLSearchParams({ token: accessToken, acct: acc.account_id });
              return { ...prev, [key]: `${base}?${params.toString()}` };
            }
          }
        }
        return prev;
      });
    }, 1400); // one new background combo every 1.4s — increase if apps still feel starved on refresh

    return () => {
      if (backgroundQueueTimerRef.current) {
        clearInterval(backgroundQueueTimerRef.current);
        backgroundQueueTimerRef.current = null;
      }
    };
  }, [authState, accessToken, accounts, preloadedPages, activePage]);

  // On logout, drop the authenticated per-account iframes (stale tokens,
  // freed resources) but keep the public/logged-out ones around.
  useEffect(() => {
    if (authState === 'authenticated') return;
    setLoadedCombos(prev => {
      let changed = false;
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([key, src]) => {
        if (key.endsWith('::public')) {
          next[key] = src;
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [authState]);

  const hasIframeBase = !!iframeBases[activePage];

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
            const isActivePage = activePage === page;
            const activeKey = authState === 'authenticated' && activeAccountId
              ? `${page}::${activeAccountId}`
              : `${page}::public`;
            const pageKeys = Object.keys(loadedCombos).filter(k => k.startsWith(`${page}::`));

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
                  transition: 'opacity 0.35s ease',
                }}
              >
                {pageKeys.map(key => {
                  const src = loadedCombos[key];
                  const isVisible = key === activeKey;
                  return (
                    <iframe
                      key={key}
                      src={src}
                      style={{
                        width: '100%', height: '100%', border: 'none',
                        position: 'absolute', top: 0, left: 0,
                        opacity: isVisible ? 1 : 0,
                        pointerEvents: isVisible ? 'auto' : 'none',
                        zIndex: isVisible ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                      }}
                      title={key}
                      allow="fullscreen"
                    />
                  );
                })}
              </div>
            );
          })}
          {!hasIframeBase && activePage === 'dashboard' && (
            <DashboardPage onNavigate={handleNavClick} />
          )}
          {!hasIframeBase && activePage === 'freebots' && (
            <FreeBotsPage />
          )}
          {!hasIframeBase && activePage !== 'dashboard' && activePage !== 'freebots' && (
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
