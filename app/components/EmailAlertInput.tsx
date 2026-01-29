'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface EmailAlertInputProps {
  existingEmail?: string | null;
}

export function EmailAlertInput({ existingEmail }: EmailAlertInputProps) {
  const { publicKey } = useWallet();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (existingEmail) {
      setEmail(existingEmail);
    }
  }, [existingEmail]);

  async function handleSave() {
    if (!publicKey || !email) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          email,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: data.emailSent
            ? 'Welcome email sent! Check your inbox. 🎉'
            : 'Email saved! Welcome email will arrive shortly.',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to save email. Please try again.',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.',
      });
    }

    setSaving(false);
  }

  return (
    <div style={{
      background: '#111118',
      borderRadius: '8px',
      padding: '16px',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
          📧 Email Alerts
        </div>
        <div style={{ color: '#71717a', fontSize: '12px' }}>
          Get trade alerts delivered to your inbox
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !email}
          style={{
            padding: '8px 16px',
            background: saving || !email ? '#27272a' : 'rgba(34, 197, 94, 0.15)',
            color: saving || !email ? '#71717a' : '#4ade80',
            border: `1px solid ${saving || !email ? '#3f3f46' : 'rgba(34, 197, 94, 0.3)'}`,
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: saving || !email ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? 'Saving...' : existingEmail ? 'Update' : 'Save'}
        </button>
      </div>

      {message && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          color: message.type === 'success' ? '#4ade80' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
