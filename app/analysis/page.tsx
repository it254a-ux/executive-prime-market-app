'use client';
import { useState } from 'react';

const MARKETS = [
  { label: 'EUR/USD', value: 'EUR/USD', type: 'Forex' },
  { label: 'GBP/USD', value: 'GBP/USD', type: 'Forex' },
  { label: 'USD/JPY', value: 'USD/JPY', type: 'Forex' },
  { label: 'BTC/USD', value: 'BTC/USD', type: 'Crypto' },
  { label: 'ETH/USD', value: 'ETH/USD', type: 'Crypto' },
  { label: 'Boom 1000', value: 'Boom 1000 Index', type: 'Synthetic' },
  { label: 'Crash 1000', value: 'Crash 1000 Index', type: 'Synthetic' },
  { label: 'Volatility 75', value: 'Volatility 75 Index', type: 'Synthetic' },
  { label: 'Volatility 100', value: 'Volatility 100 Index', type: 'Synthetic' },
];

type Analysis = {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  summary: string;
  reasons: string[];
};

export default function Page() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a professional market analyst. Analyze the ${selectedMarket.value} market right now and provide a trading signal.
Respond ONLY in this exact JSON format with no extra text:
{
  "signal": "BUY" or "SELL" or "HOLD",
  "confidence": a number between 50 and 95,
  "summary": "one sentence summary of market condition",
  "reasons": ["reason 1", "reason 2", "reason 3"]
}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: Analysis = JSON.parse(clean);
      setAnalysis(parsed);
    } catch {
      setAnalysis({
        signal: 'HOLD',
        confidence: 50,
        summary: 'Unable to fetch analysis. Please try again.',
        reasons: ['Network error', 'Please check your connection', 'Try again in a moment']
      });
    }
    setLoading(false);
  };

  const signalColor = analysis?.signal === 'BUY' ? '#00c853' : analysis?.signal === 'SELL' ? '#ff1744' : '#ffd600';
  const gold = '#c9a84c';

  return (
    <main style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', background: '#0a0a0a', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

      {/* AI Analysis Tool */}
      <div style={{ padding: '16px', background: '#111', borderBottom: '1px solid #222', flexShrink: 0 }}>
        <h2 style={{ color: gold, margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>
          📊 AI Market Analysis
        </h2>

        {/* Market Selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {MARKETS.map(m => (
            <button
              key={m.value}
              onClick={() => { setSelectedMarket(m); setAnalysis(null); }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: selectedMarket.value === m.value ? `1px solid ${gold}` : '1px solid #333',
                background: selectedMarket.value === m.value ? 'rgba(201,168,76,0.15)' : '#1a1a1a',
                color: selectedMarket.value === m.value ? gold : '#888',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: selectedMarket.value === m.value ? 700 : 400,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Analyse Button */}
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: loading ? '#333' : gold,
            color: loading ? '#888' : '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: analysis ? '16px' : '0',
          }}
        >
          {loading ? '⏳ Analysing...' : `🔍 Analyse ${selectedMarket.label}`}
        </button>

        {/* Results */}
        {analysis && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>

            {/* Signal Card */}
            <div style={{ background: '#1a1a1a', border: `1px solid ${signalColor}`, borderRadius: '10px', padding: '16px', minWidth: '120px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>SIGNAL</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: signalColor }}>{analysis.signal}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Confidence</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: signalColor }}>{analysis.confidence}%</div>
            </div>

            {/* Summary & Reasons */}
            <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '16px', minWidth: '200px' }}>
              <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '10px' }}>{analysis.summary}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analysis.reasons.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#aaa' }}>
                    <span style={{ color: signalColor, fontWeight: 700, flexShrink: 0 }}>▸</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Deriv iframe */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
