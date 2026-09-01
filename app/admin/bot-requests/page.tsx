'use client';

import { useState } from 'react';

interface BotRequest {
  id: number;
  name: string;
  phone: string;
  strategy_details: string;
  amount_usd: string | null;
  status: 'pending_quote' | 'quoted' | 'paid';
  created_at: string;
}

export default function AdminBotRequestsPage() {
  const [password, setPassword] = useState('');
  const [requests, setRequests] = useState<BotRequest[] | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [loadError, setLoadError] = useState('');

  // Per-request price input and per-request submit status, keyed by request id.
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});
  const [quoteStatus, setQuoteStatus] = useState<Record<number, 'idle' | 'saving' | 'success' | 'error'>>({});
  const [quoteError, setQuoteError] = useState<Record<number, string>>({});

  async function loadRequests(e?: React.FormEvent) {
    e?.preventDefault();
    setLoadStatus('loading');
    setLoadError('');

    try {
      const res = await fetch('/api/admin/bot-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoadStatus('error');
        setLoadError(data.error || 'Something went wrong.');
        return;
      }

      setRequests(data.requests);
      setLoadStatus('idle');
    } catch {
      setLoadStatus('error');
      setLoadError('Network error. Please try again.');
    }
  }

  async function submitQuote(id: number) {
    const amountUsd = priceInputs[id];
    if (!amountUsd || Number(amountUsd) <= 0) {
      setQuoteStatus(prev => ({ ...prev, [id]: 'error' }));
      setQuoteError(prev => ({ ...prev, [id]: 'Enter a valid price.' }));
      return;
    }

    setQuoteStatus(prev => ({ ...prev, [id]: 'saving' }));
    setQuoteError(prev => ({ ...prev, [id]: '' }));

    try {
      const res = await fetch(`/api/admin/bot-requests/${id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id, amountUsd: Number(amountUsd) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setQuoteStatus(prev => ({ ...prev, [id]: 'error' }));
        setQuoteError(prev => ({ ...prev, [id]: data.error || 'Something went wrong.' }));
        return;
      }

      setQuoteStatus(prev => ({ ...prev, [id]: 'success' }));
      // Reflect the new price/status locally instead of re-fetching the whole list.
      setRequests(prev =>
        prev
          ? prev.map(r =>
              r.id === id ? { ...r, amount_usd: String(amountUsd), status: 'quoted' as const } : r
            )
          : prev
      );
    } catch {
      setQuoteStatus(prev => ({ ...prev, [id]: 'error' }));
      setQuoteError(prev => ({ ...prev, [id]: 'Network error. Please try again.' }));
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#181c25',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        padding: '60px 20px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ color: '#c9a84c', fontSize: '22px', margin: 0 }}>Custom Bot Requests</h1>

        <form onSubmit={loadRequests} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            Admin password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </label>
          <button
            type="submit"
            disabled={loadStatus === 'loading'}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #b8962e, #e8c840)',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loadStatus === 'loading' ? 'not-allowed' : 'pointer',
              opacity: loadStatus === 'loading' ? 0.6 : 1,
            }}
          >
            {loadStatus === 'loading' ? 'Loading…' : 'Load requests'}
          </button>
          {loadStatus === 'error' && (
            <p style={{ color: '#e57373', fontSize: '13px', margin: 0 }}>{loadError}</p>
          )}
        </form>

        {requests && requests.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>No pending requests.</p>
        )}

        {requests && requests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map(r => (
              <div
                key={r.id}
                style={{
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: '10px',
                  padding: '18px',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{r.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: r.status === 'quoted' ? '#4cc978' : '#c9a84c',
                    }}
                  >
                    {r.status === 'pending_quote' ? 'Awaiting price' : 'Quoted'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{r.phone}</span>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {r.strategy_details}
                </p>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  {new Date(r.created_at).toLocaleString()}
                </span>

                {r.status === 'quoted' ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#4cc978' }}>
                    Quoted at ${r.amount_usd} — notice sent, awaiting payment.
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '4px' }}>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Price (USD)"
                      value={priceInputs[r.id] || ''}
                      onChange={e => setPriceInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                      style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => submitQuote(r.id)}
                      disabled={quoteStatus[r.id] === 'saving'}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '7px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #b8962e, #e8c840)',
                        color: '#0a0a0a',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: quoteStatus[r.id] === 'saving' ? 'not-allowed' : 'pointer',
                        opacity: quoteStatus[r.id] === 'saving' ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {quoteStatus[r.id] === 'saving' ? 'Sending…' : 'Send quote'}
                    </button>
                  </div>
                )}
                {quoteStatus[r.id] === 'error' && (
                  <p style={{ color: '#e57373', fontSize: '12px', margin: 0 }}>{quoteError[r.id]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: '6px',
  padding: '10px 12px',
  borderRadius: '7px',
  border: '1px solid rgba(201,168,76,0.25)',
  background: 'rgba(255,255,255,0.03)',
  color: '#fff',
  fontSize: '14px',
  boxSizing: 'border-box',
};
