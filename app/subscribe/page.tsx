'use client';

import { useState } from 'react';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<{code: string; wallet: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) throw new Error('Failed to generate payment code');
      
      const data = await res.json();
      setPaymentInfo(data);
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ marginBottom: 8 }}>🐋 WhaleScope Pro</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        Get instant email alerts when Congress members trade stocks.
      </p>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: 24, 
        borderRadius: 12,
        marginBottom: 24
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>$10/month in USDC</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#444' }}>
          <li>Real-time trade alerts via email</li>
          <li>Filter by politician or sector</li>
          <li>Cancel anytime</li>
        </ul>
      </div>

      {!paymentInfo ? (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '2px solid #ddd',
              borderRadius: 8,
              marginBottom: 12,
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              background: '#0066ff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Loading...' : 'Get Payment Link'}
          </button>
          {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
        </form>
      ) : (
        <div style={{ 
          background: '#e8f5e9', 
          padding: 24, 
          borderRadius: 12 
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2e7d32' }}>
            ✓ Payment Instructions
          </h3>
          <p style={{ margin: '0 0 16px 0' }}>
            Send <strong>$10 USDC</strong> (Solana) to:
          </p>
          <code style={{
            display: 'block',
            background: '#fff',
            padding: 12,
            borderRadius: 8,
            wordBreak: 'break-all',
            marginBottom: 16
          }}>
            {paymentInfo.wallet}
          </code>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Include this memo:</strong>
          </p>
          <code style={{
            display: 'block',
            background: '#fff',
            padding: 12,
            borderRadius: 8,
            fontSize: 20,
            textAlign: 'center',
            letterSpacing: 2
          }}>
            {paymentInfo.code}
          </code>
          <p style={{ margin: '16px 0 0 0', fontSize: 14, color: '#666' }}>
            Once payment is confirmed, you'll receive a welcome email within a few minutes.
          </p>
        </div>
      )}
      
      <p style={{ marginTop: 32, fontSize: 14, color: '#999', textAlign: 'center' }}>
        <a href="/" style={{ color: '#666' }}>← Back to WhaleScope</a>
      </p>
    </div>
  );
}
