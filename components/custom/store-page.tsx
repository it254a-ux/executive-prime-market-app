'use client';

import { useState } from 'react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(201,168,76,0.25)',
  background: 'rgb(var(--background))',
  color: 'rgb(var(--foreground))',
  fontSize: '13px',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgb(var(--foreground) / 0.75)',
  marginBottom: '4px',
  display: 'block',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(201,168,76,0.06)',
  border: '1px solid rgba(201,168,76,0.2)',
  borderRadius: '14px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #b8962e, #e8c840)',
  color: '#0a0a0a',
};

function CustomBotRequestForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [strategyDetails, setStrategyDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !strategyDetails.trim()) {
      setError('Please fill in your name, phone, and strategy details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests/bot-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, strategyDetails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      // No payment here — we set the price and send a WhatsApp/SMS notice
      // with the payment link once the request has been reviewed.
      setSubmitted(true);
    } catch {
      setError('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={cardStyle}>
        <h2 style={{ margin: 0, color: '#c9a84c', fontSize: '17px' }}>Request received</h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgb(var(--foreground) / 0.75)', lineHeight: 1.5 }}>
          We're reviewing your strategy. You'll get a WhatsApp/SMS message with a price and a payment
          link once it's ready.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div>
        <h2 style={{ margin: 0, color: '#c9a84c', fontSize: '17px' }}>Order a Custom Bot</h2>
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgb(var(--foreground) / 0.65)', lineHeight: 1.5 }}>
          Tell us your strategy and everything you want the bot to do. We'll review it and send you
          a price on WhatsApp/SMS along with a link to pay and confirm.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Your name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div>
          <label style={labelStyle}>Phone (for WhatsApp/SMS updates)</label>
          <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2547XXXXXXXX" />
        </div>
        <div>
          <label style={labelStyle}>Strategy & details</label>
          <textarea
            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
            value={strategyDetails}
            onChange={e => setStrategyDetails(e.target.value)}
            placeholder="Describe the strategy, market, entry/exit rules, risk level, and anything else the bot should do..."
          />
        </div>
        {error && (
          <p style={{ margin: 0, fontSize: '12px', color: '#e08787', background: 'rgba(224,135,135,0.08)', border: '1px solid rgba(224,135,135,0.25)', borderRadius: '6px', padding: '8px 10px' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </div>
  );
}

function AccountManagementForm() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !contact.trim() || !details.trim()) {
      setError('Please fill in your name, contact, and details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests/account-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch {
      setError('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={cardStyle}>
        <h2 style={{ margin: 0, color: '#c9a84c', fontSize: '17px' }}>Request received</h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgb(var(--foreground) / 0.75)', lineHeight: 1.5 }}>
          We'll reach out on the contact you gave us. Payment is arranged after the service is delivered.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div>
        <h2 style={{ margin: 0, color: '#c9a84c', fontSize: '17px' }}>Account Management & Other Services</h2>
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgb(var(--foreground) / 0.65)', lineHeight: 1.5 }}>
          Tell us what you need. No payment now — this is billed after the service is done.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Your name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div>
          <label style={labelStyle}>Contact (email, phone, or WhatsApp)</label>
          <input style={inputStyle} value={contact} onChange={e => setContact(e.target.value)} placeholder="jane@example.com" />
        </div>
        <div>
          <label style={labelStyle}>What do you need?</label>
          <textarea
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Account management, or describe the other service you need..."
          />
        </div>
        {error && (
          <p style={{ margin: 0, fontSize: '12px', color: '#e08787', background: 'rgba(224,135,135,0.08)', border: '1px solid rgba(224,135,135,0.25)', borderRadius: '6px', padding: '8px 10px' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </div>
  );
}

export function StorePage() {
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
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: "'Georgia', 'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(22px, 5vw, 32px)', margin: 0 }}>
            Premium <span style={{ color: '#e8c840' }}>Services</span>
          </h1>
        </div>
        <CustomBotRequestForm />
        <AccountManagementForm />
      </div>
    </div>
  );
}
