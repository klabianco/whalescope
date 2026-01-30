'use client';

import { useState } from 'react';
import { trackEmailSignup } from '../lib/tracking';

interface EmailCaptureProps {
  source?: string;
  headline?: string;
  subtext?: string;
  buttonText?: string;
  compact?: boolean;
}

export function EmailCapture({ 
  source = 'homepage',
  headline = 'Get free weekly trade alerts',
  subtext = 'Congress trades + whale moves. Delivered to your inbox every week. No spam.',
  buttonText = 'Subscribe',
  compact = false,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/email-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      trackEmailSignup(source);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div style={{
        background: compact ? 'transparent' : 'linear-gradient(135deg, #0a1628 0%, #0f1f17 100%)',
        border: compact ? 'none' : '1px solid #1e3a2f',
        borderRadius: '16px',
        padding: compact ? '16px 0' : '32px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#22c55e', fontSize: compact ? '15px' : '16px', fontWeight: '600', margin: 0 }}>
          You&apos;re in! Check your inbox for a welcome email.
        </p>
        {!compact && (
          <p style={{ color: '#71717a', fontSize: '13px', marginTop: '8px' }}>
            Want real-time alerts? <a href="/pricing" style={{ color: '#4ade80', textDecoration: 'underline' }}>Upgrade to Pro</a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: compact ? 'transparent' : 'linear-gradient(135deg, #0a1628 0%, #0f1f17 100%)',
      border: compact ? 'none' : '1px solid #1e3a2f',
      borderRadius: '16px',
      padding: compact ? '16px 0' : '32px',
      textAlign: 'center',
    }}>
      {!compact && headline && (
        <>
          <h3 style={{ 
            color: '#fff', 
            fontSize: '22px', 
            fontWeight: '700', 
            marginBottom: '8px',
            letterSpacing: '-0.5px'
          }}>
            {headline}
          </h3>
          <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
            {subtext}
          </p>
        </>
      )}
      {compact && (
        <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px', textAlign: 'center' }}>
          Free weekly alerts -- whale moves + politician trades. No spam.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        gap: '8px',
        maxWidth: '420px',
        margin: '0 auto',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          style={{
            flex: '1 1 240px',
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '15px',
            outline: 'none',
            minWidth: '200px',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '12px 24px',
            background: status === 'loading' ? '#27272a' : '#22c55e',
            color: status === 'loading' ? '#71717a' : '#000',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Joining...' : buttonText}
        </button>
      </form>

      {status === 'error' && (
        <p style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>
          {errorMsg}
        </p>
      )}

      <p style={{ color: '#3f3f46', fontSize: '12px', marginTop: '12px' }}>
        Free forever. Unsubscribe anytime.
      </p>
    </div>
  );
}
