'use client';

import { useEffect, useState } from 'react';

interface BotProduct {
  id: number;
  name: string;
  description: string;
  market: string;
  risk_level: string;
  price_usd: string;
}

export function StorePage() {
  const [bots, setBots] = useState<BotProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/store/bots')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setBots(data.bots || []);
      })
      .catch(() => setError('Failed to load bots. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleBuy(botId: number) {
    setCheckingOutId(botId);
    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: 'bot', productId: botId }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.checkoutUrl;
    } catch {
      setError('Could not start checkout. Please try again.');
      setCheckingOutId(null);
    }
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        color: 'rgb(var(--foreground))',
        background: 'rgb(var(--background))',
        padding: '48px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: "'Georgia', 'Playfair Display', serif",
            fontWeight: 700,
            fontSize: 'clamp(22px, 5vw, 32px)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Bot <span style={{ color: '#e8c840' }}>Store</span>
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'rgb(var(--foreground) / 0.65)',
            marginTop: '10px',
            fontSize: '14px',
          }}
        >
          Premium bots built by EPM. Pay securely with crypto.
        </p>

        {loading && (
          <p style={{ textAlign: 'center', marginTop: '32px', color: 'rgb(var(--foreground) / 0.5)' }}>
            Loading bots…
          </p>
        )}
        {error && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '32px',
              color: '#e08787',
              background: 'rgba(224,135,135,0.08)',
              border: '1px solid rgba(224,135,135,0.25)',
              borderRadius: '8px',
              padding: '10px',
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
            marginTop: '32px',
          }}
        >
          {bots.map(bot => (
            <div
              key={bot.id}
              style={{
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <h3 style={{ margin: 0, color: '#c9a84c', fontSize: '15px' }}>{bot.name}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgb(var(--foreground) / 0.7)', lineHeight: 1.5 }}>
                {bot.description}
              </p>
              <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'rgb(var(--foreground) / 0.5)' }}>
                <span>{bot.market}</span>
                <span>·</span>
                <span>{bot.risk_level} risk</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontWeight: 700, color: 'rgb(var(--foreground))' }}>${bot.price_usd}</span>
                <button
                  onClick={() => handleBuy(bot.id)}
                  disabled={checkingOutId === bot.id}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #b8962e, #e8c840)',
                    color: '#0a0a0a',
                    opacity: checkingOutId === bot.id ? 0.6 : 1,
                  }}
                >
                  {checkingOutId === bot.id ? 'Redirecting…' : 'Buy with crypto'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
