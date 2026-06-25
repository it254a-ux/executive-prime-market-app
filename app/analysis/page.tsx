'use client';

export default function Page() {
  return (
    <main style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', background: '#0a0a0a', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <iframe
          src="https://app.deriv.com/dtrader"
          style={{ position: 'absolute', top: '-64px', left: '-56px', width: 'calc(100% + 56px)', height: 'calc(100% + 64px + 50px)', border: 'none' }}
          title="Analysis Tool"
          allow="fullscreen"
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '64px', background: '#0a0a0a', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: '#0a0a0a', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '58px', background: '#0a0a0a', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '12px', right: '16px', zIndex: 20 }}>
          <a href="https://app.deriv.com/dtrader" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'rgba(201,168,76,0.5)', textDecoration: 'none' }}>Open in new tab ↗</a>
        </div>
      </div>
    </main>
  );
}
