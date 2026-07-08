'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
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
  { label: 'EPM Analyser Tool', icon: '📡', href: 'epmanalyser' },
  { label: 'Copy Trading',      icon: '🔗', href: 'copytrading' },
  { label: 'Trading Tutorials', icon: '🎓', href: 'tutorials' },
];

const iframeBases: Record<string, string> = {
  charts:      'https://charts-accumulators-app.vercel.app',
  dtrader:     'https://rise-fall-epm-dtrader.vercel.app',
  analysis:    'https://digits-epm-analysis.vercel.app',
  copytrading: 'https://epm-copy-trading.vercel.app',
  botbuilder:  'https://epm-botbuilder-uo51.vercel.app',
  epmanalyser: 'https://digits-epm-analysis.vercel.app/epm-analyser',
};

function resolveBalance(
  account: { account_id: string; balance: number | string; currency: string },
  liveBalance: LiveBalance | null
): { balance: number; currency: string } {
  if (liveBalance && liveBalance.loginid === account.account_id) {
    return { balance: liveBalance.balance, currency: liveBalance.currency };
  }
  return { balance: Number(account.balance), currency: account.currency };
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      style={{
        background: 'none',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '7px',
        padding: '7px 10px',
        cursor: 'pointer',
        color: '#c9a84c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(201,168,76,0.1)';
        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
      }}
    >
      {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}

function MobileSidebarAuth({ onClose }: { onClose: () => void }) {
  const { auth, liveBalance } = useDerivWSContext();
  const { authState, activeAccount, accounts, activeAccountId, login, signUp, logout, switchAccount } = auth;
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const btnBase: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    border: 'none', textAlign: 'center',
  };

  if (isAuthenticated && activeAccount) {
    const { balance, currency } = resolveBalance(activeAccount, liveBalance);
    return (
      <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', marginTop: '8px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={() => setSwitcherOpen(o => !o)}
          style={{ ...btnBase, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
              background: activeAccount.account_type === 'real' ? 'rgba(76,201,120,0.18)' : 'rgba(201,168,76,0.18)',
              color: activeAccount.account_type === 'real' ? '#4cc978' : '#c9a84c',
            }}>
              {activeAccount.account_type === 'real' ? 'REAL' : 'DEMO'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
            </span>
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: switcherOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>

        {switcherOpen && (
          <div style={{ background: '#13130f', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
            {accounts.map(acc => {
              const isActive = acc.account_id === activeAccountId;
              const { balance: b, currency: c } = resolveBalance(acc, liveBalance);
              return (
                <button key={acc.account_id}
                  onClick={async () => { setSwitcherOpen(false); if (!isActive) await switchAccount(acc.account_id); onClose(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '8px', padding: '10px 12px', background: isActive ? 'rgba(201,168,76,0.08)' : 'none',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: '#fff', fontSize: '12px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                      background: acc.account_type === 'real' ? 'rgba(76,201,120,0.18)' : 'rgba(201,168,76,0.18)',
                      color: acc.account_type === 'real' ? '#4cc978' : '#c9a84c',
                    }}>
                      {acc.account_type === 'real' ? 'REAL' : 'DEMO'}
                    </span>
                    {acc.account_id}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                    {b.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {c}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button onClick={() => { logout(); onClose(); }}
          style={{ ...btnBase, background: 'none', border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c' }}>
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', marginTop: '8px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

function AccountSwitcher() {
  const { auth, liveBalance } = useDerivWSContext();
  const { accounts, activeAccount, activeAccountId, switchAccount } = auth;
  const [open, setOpen] = useState(false);
  if (!activeAccount || accounts.length === 0) return null;
  const { balance: activeBalance, currency: activeCurrency } = resolveBalance(activeAccount, liveBalance);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '7px',
        border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.06)',
        color: '#fff', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
      }}>
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
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: '220px',
            background: '#13130f', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 260, overflow: 'hidden'
          }}>
            {accounts.map(acc => {
              const isActive = acc.account_id === activeAccountId;
              const { balance: accBalance, currency: accCurrency } = resolveBalance(acc, liveBalance);
              return (
                <button key={acc.account_id}
                  onClick={async () => { setOpen(false); if (!isActive) await switchAccount(acc.account_id); }}
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (isMobile) return null;
  if (isAuthenticated && activeAccount) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AccountSwitcher />
        <button onClick={logout} style={{
          padding: '7px 18px', borderRadius: '7px',
          border: '1px solid rgba(201,168,76,0.5)', background: 'none',
          color: '#c9a84c', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
        }}>Log Out</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button onClick={login} disabled={isAuthenticating} style={{
        padding: '7px 18px', borderRadius: '7px',
        border: '1px solid rgba(201,168,76,0.5)', background: 'none',
        color: '#c9a84c', fontSize: '13px', fontWeight: 600,
        cursor: isAuthenticating ? 'not-allowed' : 'pointer', opacity: isAuthenticating ? 0.6 : 1, whiteSpace: 'nowrap'
      }}>
        {isAuthenticating ? 'Logging in…' : 'Log In'}
      </button>
      <button onClick={signUp} disabled={isAuthenticating} style={{
        padding: '7px 18px', borderRadius: '7px',
        background: 'linear-gradient(135deg, #b8962e, #e8c840)', border: 'none',
        color: '#0a0a0a', fontSize: '13px', fontWeight: 700,
        cursor: isAuthenticating ? 'not-allowed' : 'pointer', opacity: isAuthenticating ? 0.6 : 1, whiteSpace: 'nowrap'
      }}>Sign Up</button>
    </div>
  );
}

function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const cards = [
    { label: 'Charts',            icon: '📊', page: 'charts' },
    { label: 'DTrader',           icon: '💹', page: 'dtrader' },
    { label: 'Analysis Tool',     icon: '🔍', page: 'analysis' },
    { label: 'Bot Builder',       icon: '🤖', page: 'botbuilder' },
    { label: 'Free Bots by EPM',  icon: '🎁', page: 'freebots' },
    { label: 'EPM Analyser Tool', icon: '📡', page: 'epmanalyser' },
    { label: 'Copy Trading',      icon: '🔗', page: 'copytrading' },
    { label: 'Trading Tutorials', icon: '🎓', page: 'tutorials' },
  ];
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', background: '#181c25', position: 'relative',
      overflow: 'auto', minHeight: '100%',
      padding: '40px 20px', boxSizing: 'border-box',
    }}>
      <HeroBackground />
      <div style={{
        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '20px', width: '100%', maxWidth: '800px',
      }}>
        <h1 style={{
          fontFamily: "'Georgia', 'Playfair Display', serif",
          fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center',
          letterSpacing: '0.04em', fontSize: 'clamp(26px, 6vw, 44px)',
        }}>
          Executive<span style={{ color: '#e8c840' }}>Prime</span>Markets
        </h1>
        <span style={{ display: 'block', width: '64px', height: '2px', background: 'linear-gradient(90deg, #c9a84c, #e8c840)', borderRadius: '2px' }} />
        <p style={{
          color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(13px, 3vw, 16px)',
          textAlign: 'center', maxWidth: '520px', margin: 0, lineHeight: 1.6,
        }}>
          Professional Trading Tools, Premium Bots, Market Intelligence &amp; Financial Growth.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '14px', width: '100%', marginTop: '12px',
        }}>
          {cards.map(card => (
            <div key={card.page} onClick={() => onNavigate(card.page)} style={{
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px', padding: '20px 12px', cursor: 'pointer', textAlign: 'center',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,168,76,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 20px rgba(201,168,76,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,168,76,0.08)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
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

function ComingSoonPage({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', gap: '16px', background: '#181c25', padding: '40px 20px', boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: '48px' }}>🚧</div>
      <h2 style={{ color: '#c9a84c', margin: 0, textAlign: 'center' }}>{label}</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center' }}>Coming soon — check back shortly.</p>
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
    setSidebarOpen(false);
    window.history.pushState(null, '', href === 'dashboard' ? '/' : `/${href}`);
  };

  const [loadedCombos, setLoadedCombos] = useState<Record<string, string>>({});
  const backgroundQueueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authState === 'authenticated') return;
    preloadedPages.forEach(page => {
      const base = iframeBases[page]; if (!base) return;
      const key = `${page}::public`;
      setLoadedCombos(prev => (prev[key] ? prev : { ...prev, [key]: base }));
    });
  }, [preloadedPages, authState]);

  useEffect(() => {
    if (authState !== 'authenticated' || !accessToken || !activeAccountId) return;
    const base = iframeBases[activePage]; if (!base) return;
    const key = `${activePage}::${activeAccountId}`;
    setLoadedCombos(prev => {
      if (prev[key]) return prev;
      const params = new URLSearchParams({ token: accessToken, acct: activeAccountId });
      return { ...prev, [key]: `${base}?${params.toString()}` };
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
              const params = new URLSearchParams({ token: accessToken, acct: acc.account_id });
              return { ...prev, [key]: `${base}?${params.toString()}` };
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

  const hasIframeBase = !!iframeBases[activePage];

  return (
    <main style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh',
      background: '#181c25', fontFamily: 'Inter, sans-serif',
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>

      {/* ── NAV: 3-column flex — LEFT / CENTER / RIGHT — nothing ever overlaps ── */}
      <nav style={{
        zIndex: 200, height: '62px', flexShrink: 0,
        background: 'rgba(24,28,37,0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.18)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px',
      }}>

        {/* LEFT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: '22px', height: '2px', background: '#c9a84c', borderRadius: '2px',
                transform: sidebarOpen ? (i === 0 ? 'rotate(45deg) translate(5px, 5px)' : i === 2 ? 'rotate(-45deg) translate(5px, -5px)' : 'scaleX(0)') : 'none',
                transition: 'all 0.2s',
              }} />
            ))}
          </button>
          <a href="/" onClick={e => { e.preventDefault(); handleNavClick('dashboard'); }}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="EPM logo" style={{ height: '46px', width: 'auto', display: 'block' }} />
          </a>
        </div>

        {/* CENTER — auto-shrinks on small screens, never overlaps the sides */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', minWidth: 0 }}>
          <span style={{
            fontFamily: "'Georgia', 'Playfair Display', serif",
            fontSize: 'clamp(13px, 3.5vw, 19px)',
            fontWeight: 700, letterSpacing: '0.05em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none',
          }}>
            <span style={{ color: '#ffffff' }}>Executive</span>
            <span style={{ color: '#e8c840' }}>Prime</span>
            <span style={{ color: '#ffffff' }}>Markets</span>
          </span>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <ThemeToggleButton />
          <AuthButtons />
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 90 }} />
        )}

        {/* SIDEBAR */}
        <aside style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '230px',
          background: '#181c25', borderRight: '1px solid rgba(201,168,76,0.12)',
          display: 'flex', flexDirection: 'column', padding: '16px 8px', gap: '2px',
          zIndex: 100, overflowY: 'auto',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}>
          {navLinks.map(link => (
            <a key={link.label} href="#"
              onClick={e => { e.preventDefault(); handleNavClick(link.href); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                color: activePage === link.href ? '#c9a84c' : 'rgba(255,255,255,0.6)',
                fontSize: '13px', textDecoration: 'none',
                borderLeft: activePage === link.href ? '2px solid #c9a84c' : '2px solid transparent',
                background: activePage === link.href ? 'rgba(201,168,76,0.08)' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { handleNavHover(link.href); if (activePage !== link.href) { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.borderLeftColor = '#c9a84c'; } }}
              onMouseLeave={e => { if (activePage !== link.href) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; } }}
            >
              <span style={{ fontSize: '16px' }}>{link.icon}</span>
              {link.label}
            </a>
          ))}
          <div style={{ flex: 1 }} />
          <MobileSidebarAuth onClose={() => setSidebarOpen(false)} />
          <div style={{ padding: '12px', fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '1.5px', borderTop: '1px solid rgba(201,168,76,0.1)', marginTop: '8px' }}>
            POWERED BY <span style={{ color: 'rgba(201,168,76,0.4)' }}>DERIV</span>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, position: 'relative', overflow: 'auto', display: 'flex', width: '100%' }}>
          {Array.from(preloadedPages).map(page => {
            const isActivePage = activePage === page;
            const activeKey = authState === 'authenticated' && activeAccountId ? `${page}::${activeAccountId}` : `${page}::public`;
            const pageKeys = Object.keys(loadedCombos).filter(k => k.startsWith(`${page}::`));
            return (
              <div key={page} style={{
                width: '100%', height: '100%',
                position: isActivePage ? 'static' : 'absolute', top: 0, left: 0,
                opacity: isActivePage ? 1 : 0, pointerEvents: isActivePage ? 'auto' : 'none',
                zIndex: isActivePage ? 1 : 0, flex: isActivePage ? 1 : undefined,
                transition: 'opacity 0.35s ease',
              }}>
                {pageKeys.map(key => {
                  const src = loadedCombos[key]; const isVisible = key === activeKey;
                  return (
                    <iframe key={key} src={src} title={key} allow="fullscreen" style={{
                      width: '100%', height: '100%', border: 'none',
                      position: 'absolute', top: 0, left: 0,
                      opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? 'auto' : 'none',
                      zIndex: isVisible ? 1 : 0, transition: 'opacity 0.3s ease',
                    }} />
                  );
                })}
              </div>
            );
          })}
          {!hasIframeBase && activePage === 'dashboard' && <DashboardPage onNavigate={handleNavClick} />}
          {!hasIframeBase && activePage === 'freebots'   && <FreeBotsPage />}
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
