'use client';

import { useState } from 'react';

const APP_ID = '33C8pzDfszs5p4KQabqit';
const DERIV_OAUTH_URL = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=en&brand=deriv`;

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

const iframePages: Record<string, string> = {
  charts:      'https://epm-charts.onrender.com',
  dtrader:     'https://epm-dtrader.onrender.com',
  analysis:    'https://epm-analysis.onrender.com',
  botbuilder:  'https://epm-botbuilder.onrender.com',
};

function DashboardPage() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', gap: '24px', padding: '40px'
    }}>
      <img src="/logo.png" alt="ExecutivePrimeMarkets" style={{ height: '60px', width: 'auto' }} />
      <h1 style={{ color: '#c9a84c', fontSize: '28px', fontWeight: 700, margin: 0 }}>
        Welcome to Executive Prime Markets
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', textAlign: 'center', maxWidth: '480px', margin: 0 }}>
        Your all-in-one trading platform powered by Deriv. Use the sidebar to navigate to your tools.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
        {[
          { label: 'Charts', icon: '📊', page: 'charts' },
          { label: 'DTrader', icon: '💹', page: 'dtrader' },
          { label: 'Analysis Tool', icon: '🔍', page: 'analysis' },
          { label: 'Bot Builder', icon: '🤖', page: 'botbuilder' },
        ].map(card => (
          <div key={card.page} style={{
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '12px', padding: '24px 32px', cursor: 'pointer',
            textAlign: 'center', minWidth: '120px'
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
      color: '#fff', gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>🚧</div>
      <h2 style={{ color: '#c9a84c', margin: 0 }}>{label}</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Coming soon — check back shortly.</p>
    </div>
  );
}

export default function HomePage() {
  const [activePage, setActivePage] = useState('dashboard');

  const iframeSrc = iframePages[activePage];

  return (
    <main style={{
      margin: 0, padding: 0, width: '100vw', height: '100vh',
      background: '#0a0a0a', fontFamily: 'Inter, sans-serif',
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column'
    }}>

      {/* TOP BAR */}
      <nav style={{
        position: 'relative', zIndex: 100,
        height: '62px', background: 'rgba(10,10,10,0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.18)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', flexShrink: 0,
        backdropFilter: 'blur(12px)'
      }}>
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }} onClick={e => { e.preventDefault(); setActivePage('dashboard'); }}>
          <img src="/logo.png" alt="ExecutivePrimeMarkets"
            style={{ height: '34px', width: 'auto', display: 'block' }} />
        </a>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href={DERIV_OAUTH_URL} style={{
            padding: '8px 22px', borderRadius: '7px',
            border: '1px solid rgba(201,168,76,0.5)',
            color: '#c9a84c', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap'
          }}>Log In</a>
          <a href="https://deriv.com/signup/" target="_blank" rel="noreferrer" style={{
            padding: '8px 22px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #b8962e, #e8c840)',
            color: '#0a0a0a', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap'
          }}>Sign Up</a>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT SIDEBAR */}
        <aside style={{
          width: '200px', flexShrink: 0,
          background: '#0f0f0f',
          borderRight: '1px solid rgba(201,168,76,0.12)',
          display: 'flex', flexDirection: 'column',
          padding: '16px 8px', gap: '2px', zIndex: 50
        }}>
          {navLinks.map(link => (
            <a key={link.label} href="#" onClick={e => { e.preventDefault(); setActivePage(link.href); }} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              color: activePage === link.href ? '#c9a84c' : 'rgba(255,255,255,0.6)',
              fontSize: '13px', textDecoration: 'none',
              borderLeft: activePage === link.href ? '2px solid #c9a84c' : '2px solid transparent',
              background: activePage === link.href ? 'rgba(201,168,76,0.08)' : 'transparent',
            }}
            onMouseEnter={e => {
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
            }}>
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
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          {iframeSrc ? (
            <iframe
              key={activePage}
              src={iframeSrc}
              style={{
                width: '100%', height: '100%',
                border: 'none', flex: 1
              }}
              title={activePage}
              allow="fullscreen"
            />
          ) : activePage === 'dashboard' ? (
            <DashboardPage />
          ) : (
            <ComingSoonPage label={navLinks.find(l => l.href === activePage)?.label || activePage} />
          )}
        </div>
      </div>
    </main>
  );
}
