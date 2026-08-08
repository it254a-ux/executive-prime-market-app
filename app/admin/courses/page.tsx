'use client';

import { useState } from 'react';

export default function AdminCoursesPage() {
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [lessons, setLessons] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          title,
          level,
          lessons,
          description,
          url,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      // Reset the course fields but keep the password, so adding several
      // courses in a row doesn't require retyping it each time.
      setTitle('');
      setLevel('Beginner');
      setLessons('');
      setDescription('');
      setUrl('');
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
        <h1 style={{ color: '#c9a84c', fontSize: '22px', margin: 0 }}>Add a Trading Course</h1>

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
          Course title (e.g. Forex)
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Level
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            style={inputStyle}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </label>

        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Number of lessons
          <input
            type="number"
            min={1}
            value={lessons}
            onChange={e => setLessons(e.target.value)}
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
          Course URL (where "View Course" sends the visitor)
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            placeholder="https://traders-academy.deriv.com/trading-courses/..."
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={status === 'saving'}
          style={{
            marginTop: '8px', padding: '12px', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #b8962e, #e8c840)', color: '#0a0a0a',
            fontWeight: 700, fontSize: '14px',
            cursor: status === 'saving' ? 'not-allowed' : 'pointer',
            opacity: status === 'saving' ? 0.6 : 1,
          }}
        >
          {status === 'saving' ? 'Saving…' : 'Add Course'}
        </button>

        {status === 'success' && (
          <p style={{ color: '#4cc978', fontSize: '13px', margin: 0 }}>
            Course added successfully. It now appears on the Trading Tutorials page.
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
