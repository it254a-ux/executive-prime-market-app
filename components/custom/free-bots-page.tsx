'use client';

import { useEffect, useState } from 'react';
import { HeroBackground } from '@/components/custom/hero-background';

interface FreeBot {
  id: number;
  name: string;
  description: string;
  market: string;
  risk_level: string;
  created_at: string;
}

export function FreeBotsPage() {
  const [bots, setBots] = useState<FreeBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/free-bots')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setBots(data.bots);
        }
      })
      .catch(() => setError('Failed to load bots. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  const handleImport = async (bot: FreeBot) => {
    setImportingId(bot.id);
    try {
      const res = await fetch(`/api/free-bots/${bot.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Trigger a local download of the bot's XML — the user then drags
      // this file onto the Bot Builder tab (or uses its Import button),
      // since Deriv's Bot Builder can't be loaded into directly from here.
      const blob = new Blob([data.xml_content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bot.name.replace(/\s+/g, '_')}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download this bot. Please try again.');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="page-fade-in" style={{
      flex: 1, position: 'relative', overflowX: 'hidden',
      background: '#181c25', width: '100%',
    }}>
      <HeroBackground />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', color: '#fff', gap: '24px',
        padding: '40px 24px', overflowY: 'auto', width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '640px' }}>
          <h1 style={{ color: '#c9a84c', fontSize: '28px', margin: 0 }}>Free Bots by EPM</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '10px' }}>
            Ready-made strategies. Click Import to download, then drag the file onto the Bot Builder tab to load it.
          </p>
        </div>

        {loading && (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading bots…</p>
        )}

        {error && (
          <p style={{ color: '#e57373' }}>{error}</p>
        )}

        {!loading && !error && bots.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>No bots available yet — check back soon.</p>
        )}

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '16px',
          justifyContent: 'center', maxWidth: '900px', width: '100%',
        }}>
          {bots.map(bot => (
            <div
              key={bot.id}
              style={{
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '12px', padding: '20px',
                width: '260px', display: 'flex', flexDirection: 'column', gap: '10px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{bot.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, flex: 1 }}>
                {bot.description}
              </p>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(201,168,76,0.15)', color: '#c9a84c',
                }}>
                  {bot.market}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(76,201,120,0.15)', color: '#4cc978',
                }}>
                  {bot.risk_level} risk
                </span>
              </div>
              <button
                onClick={() => handleImport(bot)}
                disabled={importingId === bot.id}
                style={{
                  marginTop: '8px', padding: '9px', borderRadius: '7px',
                  border: 'none', background: 'linear-gradient(135deg, #b8962e, #e8c840)',
                  color: '#0a0a0a', fontWeight: 700, fontSize: '13px',
                  cursor: importingId === bot.id ? 'not-allowed' : 'pointer',
                  opacity: importingId === bot.id ? 0.6 : 1,
                }}
              >
                {importingId === bot.id ? 'Preparing…' : 'Import'}
              </button>
            </div>
          ))}
        </div>
      </div>

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
