'use client';

import { useState } from 'react';

const WALLET = 'hyTku9MYUuBtCWPxqmeyWcBvYuUbVKfXtafjBr7eAh3';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setShowPayment(true);
    }
  };

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
      color: '#fff',
      minHeight: '100vh',
      background: '#0a0a0a'
    }}>
      <h1 style={{ marginBottom: 8 }}>🐋 WhaleScope Pro</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>
        Get instant email alerts when Congress members trade stocks.
      </p>
      
      <div style={{ 
        background: '#161618', 
        padding: 24, 
        borderRadius: 12,
        marginBottom: 24,
        border: '1px solid #222'
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>$10/month in USDC</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#aaa' }}>
          <li>Real-time trade alerts via email</li>
          <li>Filter by politician or sector</li>
          <li>Cancel anytime</li>
        </ul>
      </div>

      {!showPayment ? (
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
              border: '2px solid #333',
              borderRadius: 8,
              marginBottom: 12,
              boxSizing: 'border-box',
              background: '#111',
              color: '#fff'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              background: '#4ade80',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Get Payment Link
          </button>
        </form>
      ) : (
        <div style={{ 
          background: '#0d2818', 
          padding: 24, 
          borderRadius: 12,
          border: '1px solid #1a4d2e'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#4ade80' }}>
            ✓ Payment Instructions
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#ccc' }}>
            Send <strong>$10 USDC</strong> on Solana to:
          </p>
          <div style={{
            background: '#111',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: 14
          }}>
            {WALLET}
          </div>
          <p style={{ margin: '0 0 8px 0', color: '#ccc' }}>
            <strong>Important:</strong> Include this exact memo:
          </p>
          <div style={{
            background: '#111',
            padding: 16,
            borderRadius: 8,
            fontSize: 18,
            textAlign: 'center',
            fontFamily: 'monospace',
            color: '#4ade80',
            border: '2px solid #4ade80'
          }}>
            {email}
          </div>
          <p style={{ margin: '16px 0 0 0', fontSize: 14, color: '#888' }}>
            Once payment is confirmed, you'll receive a welcome email within 10 minutes.
          </p>
          <button
            onClick={() => setShowPayment(false)}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: 'transparent',
              color: '#888',
              border: '1px solid #333',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ← Use different email
          </button>
        </div>
      )}
      
      <p style={{ marginTop: 32, fontSize: 14, color: '#666', textAlign: 'center' }}>
        <a href="/" style={{ color: '#888' }}>← Back to WhaleScope</a>
      </p>
    </div>
  );
}
