'use client';
import { useState } from 'react';

const APP_ID = '33C8pzDfszs5p4KQabqit';
const DERIV_OAUTH_URL = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=en&brand=deriv`;

const navLinks = [
  { label: 'Dashboard',         icon: '🏠', href: '/dashboard' },
  { label: 'Free Bots by EPM',  icon: '🎁', href: '/freebots' },
  { label: 'Dtrader / Circles', icon: '💹', href: '/dtrader' },
  { label: 'Analysis Tool',     icon: '🔍', href: '/analysis' },
  { label: 'Bot Builder',       icon: '🤖', href: '/botbuilder' },
  { label: 'Trading View',      icon: '📊', href: '/tradingview' },
  { label: 'Copy Trading',      icon: '🔗', href: '/copytrading' },
  { label: 'Trading Tutorials', icon: '🎓', href: '/tutorials' },
];

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', background: '#0a0a0a', fontFamily: 'Inter, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* TOP BAR */}
      <nav style={{ height: '62px', background: 'rgba(10,10,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.18)', display: 'flex', alignItems: 'center', padding: '0 24px', flexShrink: 0, backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logo.png" alt="EPM" style={{ height: '34px', width: 'auto', display: 'block' }} />
        </a>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href={DERIV_OAUTH_URL} style={{ padding: '8px 22px', borderRadius: '7px', border: '1px solid rgba(201,168,76,0.5)', color: '#c9a84c', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Log In</a>
          <a href="https://deriv.com/signup/" target="_blank" rel="noreferrer" style={{ padding: '8px 22px', borderRadius: '7px', background: 'linear-gradient(135deg, #b8962e, #e8c840)', color: '#0a0a0a', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>Sign Up</a>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <aside style={{ width: sidebarOpen ? '200px' : '52px', flexShrink: 0, background: '#0f0f0f', borderRight: '1px solid rgba(201,168,76,0.12)', display: 'flex', flexDirection: 'column', padding: '12px 6px', gap: '2px', zIndex: 50, transition: 'width 0.2s ease', overflow: 'hidden' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '14px', padding: '6px', marginBottom: '8px', textAlign: sidebarOpen ? 'right' : 'center' as any }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {navLinks.map(link => (
            <a key={link.label} href={link.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px', borderRadius: '8px', color: link.href === '/tradingview' ? '#c9a84c' : 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none', background: link.href === '/tradingview' ? 'rgba(201,168,76,0.1)' : 'transparent', borderLeft: link.href === '/tradingview' ? '2px solid #c9a84c' : '2px solid transparent', whiteSpace: 'nowrap', overflow: 'hidden' }}
            onMouseEnter={e => { if(link.href !== '/tradingview') { e.currentTarget.style.color='#c9a84c'; e.currentTarget.style.background='rgba(201,168,76,0.06)'; }}}
            onMouseLeave={e => { if(link.href !== '/tradingview') { e.currentTarget.style.color='rgba(255,255,255,0.6)'; e.currentTarget.style.background='transparent'; }}}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{link.icon}</span>
              {sidebarOpen && link.label}
            </a>
          ))}
          <div style={{ flex: 1 }} />
          {sidebarOpen && <div style={{ padding: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '1.5px', borderTop: '1px solid rgba(201,168,76,0.1)', marginTop: '8px' }}>POWERED BY <span style={{ color: 'rgba(201,168,76,0.4)' }}>DERIV</span></div>}
        </aside>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', background: '#0d0d0d', borderBottom: '1px solid rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', paddingLeft: '20px', zIndex: 5 }}>
            <span style={{ color: '#c9a84c', fontSize: '14px', fontWeight: 600 }}>📊 Trading View</span>
          </div>
          <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
            <iframe
              src="https://www.tradingview.com/chart/"
              style={{ position: 'absolute', top: '-64px', left: '-56px', width: 'calc(100% + 56px)', height: 'calc(100% + 64px + 50px)', border: 'none' }}
              title="Trading View"
              allow="fullscreen"
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '64px', background: '#0a0a0a', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: '#0a0a0a', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '58px', background: '#0f0f0f', zIndex: 10, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '50px', right: '16px', zIndex: 20 }}>
              <a href="https://www.tradingview.com/chart/" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'rgba(201,168,76,0.5)', textDecoration: 'none' }}>Open in new tab ↗</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
