'use client';
import { useState } from 'react';

const APP_ID = '33C8pzDfszs5p4KQabqit';
const DERIV_OAUTH_URL = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=en&brand=deriv`;

const tools = [
  { label: 'Dashboard',         icon: '🏠', type: 'dashboard' },
  { label: 'Accumulator',       icon: '📈', type: 'internal' },
  { label: 'DTrader',           icon: '💹', type: 'embed', href: 'https://app.deriv.com/dtrader' },
  { label: 'Bot Builder',       icon: '🤖', type: 'embed', href: 'https://app.deriv.com/bot' },
  { label: 'Charts',            icon: '📊', type: 'embed', href: 'https://app.deriv.com/dtrader' },
  { label: 'Analysis Tool',     icon: '🔍', type: 'embed', href: 'https://app.deriv.com/dtrader' },
  { label: 'Free Bots',         icon: '🎁', type: 'embed', href: 'https://app.deriv.com/bot' },
  { label: 'Copy Trading',      icon: '🔗', type: 'embed', href: 'https://app.deriv.com/copy-trading' },
  { label: 'Trading Tutorials', icon: '🎓', type: 'embed', href: 'https://academy.deriv.com' },
];

const quickStats = [
  { label: 'Total Balance',  value: '—', sub: 'Log in to view', color: '#c9a84c' },
  { label: 'Open Positions', value: '—', sub: 'Log in to view', color: '#4caf50' },
  { label: "Today's P&L",   value: '—', sub: 'Log in to view', color: '#2196f3' },
  { label: 'Total Trades',   value: '—', sub: 'Log in to view', color: '#9c27b0' },
];

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111', border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: '16px', padding: '40px 36px', width: '100%', maxWidth: '380px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', textAlign: 'center'
      }}>
        <img src="/logo.png" alt="EPM" style={{ width: '140px', height: 'auto', marginBottom: '8px' }} />
        <p style={{ color: 'rgba(201,168,76,0.7)', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '28px' }}>
          Trade Smart. Grow Confidently.
        </p>

        <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', margin: '0 auto 28px' }} />

        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
          Log in with your Deriv account to access your balance, trades, and all trading tools.
        </p>

        <a href={DERIV_OAUTH_URL} style={{
          display: 'block', width: '100%', padding: '14px',
          background: 'linear-gradient(135deg, #b8962e, #e8c840, #b8962e)',
          color: '#0a0a0a', fontWeight: 700, fontSize: '14px',
          borderRadius: '8px', textDecoration: 'none', marginBottom: '12px',
          letterSpacing: '0.5px', boxSizing: 'border-box'
        }}>
          Log In with Deriv
        </a>

        <a href="https://deriv.com/signup/" target="_blank" rel="noreferrer" style={{
          display: 'block', width: '100%', padding: '13px',
          background: 'transparent', border: '1px solid rgba(201,168,76,0.35)',
          color: '#c9a84c', fontWeight: 600, fontSize: '14px',
          borderRadius: '8px', textDecoration: 'none', marginBottom: '20px',
          letterSpacing: '0.5px', boxSizing: 'border-box'
        }}>
          Create Free Account
        </a>

        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
          fontSize: '12px', cursor: 'pointer'
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [active, setActive] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const activeTool = tools.find(t => t.label === active);

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <main style={{ height: '100vh', background: '#0a0a0a', display: 'flex', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{
          width: sidebarOpen ? '230px' : '64px',
          minHeight: '100vh', background: '#0f0f0f',
          borderRight: '1px solid rgba(201,168,76,0.12)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          transition: 'width 0.2s ease', overflow: 'hidden'
        }}>
          <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {sidebarOpen && <img src="/logo.png" alt="EPM" style={{ width: '120px', height: 'auto' }} />}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '16px', padding: '4px', marginLeft: sidebarOpen ? '0' : 'auto', marginRight: sidebarOpen ? '0' : 'auto' }}>
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
            {tools.map(item => (
              <button key={item.label} onClick={() => setActive(item.label)} title={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
                  border: 'none', cursor: 'pointer', fontSize: '13.5px', textAlign: 'left',
                  background: active === item.label ? 'rgba(201,168,76,0.13)' : 'transparent',
                  color: active === item.label ? '#c9a84c' : 'rgba(255,255,255,0.55)',
                  borderLeft: active === item.label ? '2px solid #c9a84c' : '2px solid transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden'
                }}>
                <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && item.label}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(201,168,76,0.1)', fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '1.5px' }}>
              POWERED BY <span style={{ color: 'rgba(201,168,76,0.4)' }}>DERIV</span>
            </div>
          )}
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* TOP BAR */}
          <div style={{ height: '54px', background: '#0d0d0d', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ color: '#c9a84c', fontWeight: 600, fontSize: '15px' }}>
              {activeTool?.icon}&nbsp;&nbsp;{active}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="/" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Home</a>
              <button onClick={() => setShowLogin(true)} style={{
                background: 'linear-gradient(135deg, #b8962e, #e8c840)',
                color: '#0a0a0a', border: 'none', borderRadius: '6px',
                padding: '7px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
              }}>
                Log In
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, overflow: 'hidden' }}>

            {/* DASHBOARD HOME */}
            {activeTool?.type === 'dashboard' && (
              <div style={{ padding: '32px 36px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
                <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                  Welcome to <span style={{ color: '#c9a84c' }}>ExecutivePrimeMarkets</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '28px' }}>Trade Smart. Grow Confidently.</p>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                  {quickStats.map(stat => (
                    <div key={stat.label} style={{ background: '#111', border: `1px solid ${stat.color}22`, borderRadius: '12px', padding: '20px', borderTop: `2px solid ${stat.color}` }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>{stat.label}</div>
                      <div style={{ color: stat.color, fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{stat.value}</div>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tools grid */}
                <h2 style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>Trading Tools</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                  {tools.filter(t => t.type !== 'dashboard').map(tool => (
                    <button key={tool.label} onClick={() => setActive(tool.label)}
                      style={{ background: '#111', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '12px', padding: '20px 16px', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.45)'; (e.currentTarget as HTMLButtonElement).style.background = '#161616'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.12)'; (e.currentTarget as HTMLButtonElement).style.background = '#111'; }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{tool.icon}</div>
                      <div style={{ color: '#c9a84c', fontSize: '13px', fontWeight: 600 }}>{tool.label}</div>
                    </button>
                  ))}
                </div>

                {/* Login CTA */}
                <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Connect your Deriv account</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Log in to see your balance, open positions and trade history</div>
                  </div>
                  <button onClick={() => setShowLogin(true)} style={{
                    background: 'linear-gradient(135deg, #b8962e, #e8c840)',
                    color: '#0a0a0a', border: 'none', borderRadius: '8px',
                    padding: '10px 24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                  }}>
                    Log In / Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* ACCUMULATOR */}
            {activeTool?.type === 'internal' && (
              <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} title="Accumulator" />
            )}

            {/* EMBEDDED TOOLS */}
            {activeTool?.type === 'embed' && activeTool.href && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <iframe key={active} src={activeTool.href} style={{ flex: 1, border: 'none', width: '100%' }} title={active} allow="fullscreen" />
                <div style={{ padding: '8px 16px', background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>If the page doesn't load —</span>
                  <a href={activeTool.href} target="_blank" rel="noreferrer" style={{ color: '#c9a84c', fontSize: '11px', textDecoration: 'none' }}>Open {active} in new tab ↗</a>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
