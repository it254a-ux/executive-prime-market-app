'use client';

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

export default function HomePage() {
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
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
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
            <a key={link.label} href={link.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)', fontSize: '13px',
              textDecoration: 'none', borderLeft: '2px solid transparent'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#c9a84c';
              e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
              e.currentTarget.style.borderLeftColor = '#c9a84c';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderLeftColor = 'transparent';
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

        {/* BOT BUILDER IFRAME */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <iframe
            src="https://app.deriv.com/bot"
            style={{
              position: 'absolute',
              top: '-64px', left: '-56px',
              width: 'calc(100% + 56px)',
              height: 'calc(100% + 64px + 50px)',
              border: 'none'
            }}
            title="Bot Builder"
            allow="fullscreen"
          />
          {/* Hide Deriv top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '64px', background: '#0a0a0a', zIndex: 10, pointerEvents: 'none' }} />
          {/* Hide Deriv bottom bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: '#0a0a0a', zIndex: 10, pointerEvents: 'none' }} />
          {/* Hide Deriv left sidebar */}
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '58px', background: '#0f0f0f', zIndex: 10, pointerEvents: 'none' }} />
        </div>
      </div>
    </main>
  );
}
