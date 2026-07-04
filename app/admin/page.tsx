'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [market, setMarket] = useState('');
  const [riskLevel, setRiskLevel] = useState('Low');
  const [xmlContent, setXmlContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setXmlContent(reader.result as string);
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/free-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          name,
          description,
          market,
          risk_level: riskLevel,
          xml_content: xmlContent,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      // Reset the bot fields but keep the password, so adding several bots
      // in a row doesn't require retyping it each time.
      setName('');
      setDescription('');
      setMarket('');
      setRiskLevel('Low');
      setXmlContent('');
      setFileName('');
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#181c25', color: '#fff',
      display: 'flex', justifyContent: 'center', padding: '60px 20px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <h1 style={{ color: '#c9a84c', fontSize: '22px', margin: 0 }}>Add a Free Bot</h1>

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

        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Bot name
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Description
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        </label>

        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Market (e.g. Volatility 75 Index)
          <input
            type="text"
            value={market}
            onChange={e => setMarket(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Risk level
          <select
            value={riskLevel}
            onChange={e => setRiskLevel(e.target.value)}
            style={inputStyle}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Bot XML file (exported from Bot Builder's Save button)
          <input
            type="file"
            accept=".xml"
            onChange={handleFileChange}
            required
            style={{ ...inputStyle, padding: '8px' }}
          />
          {fileName && (
            <span style={{ display: 'block', marginTop: '4px', color: '#4cc978', fontSize: '12px' }}>
              Loaded: {fileName}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={status === 'saving' || !xmlContent}
          style={{
            marginTop: '8px', padding: '12px', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #b8962e, #e8c840)', color: '#0a0a0a',
            fontWeight: 700, fontSize: '14px',
            cursor: status === 'saving' ? 'not-allowed' : 'pointer',
            opacity: status === 'saving' || !xmlContent ? 0.6 : 1,
          }}
        >
          {status === 'saving' ? 'Saving…' : 'Add Bot'}
        </button>

        {status === 'success' && (
          <p style={{ color: '#4cc978', fontSize: '13px', margin: 0 }}>
            Bot added successfully. It now appears on the Free Bots page.
          </p>
        )}
        {status === 'error' && (
          <p style={{ color: '#e57373', fontSize: '13px', margin: 0 }}>{errorMsg}</p>
        )}
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: '6px',
  padding: '10px 12px', borderRadius: '7px',
  border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(255,255,255,0.03)',
  color: '#fff', fontSize: '14px', boxSizing: 'border-box',
};
