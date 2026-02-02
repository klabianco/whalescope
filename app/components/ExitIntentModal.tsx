'use client';

import { useState, useEffect } from 'react';
import { trackEmailSignup, trackExitIntentShow, trackExitIntentDismiss } from '../lib/tracking';

/**
 * Exit intent email capture
 * Triggers when mouse moves toward browser chrome (tab/address bar)
 * Offers immediate value: "Top 5 whale moves this week"
 */

export function ExitIntentModal() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem('exitIntentDismissed')) {
      setDismissed(true);
      return;
    }

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves through top of window (toward browser chrome)
      if (e.clientY <= 0 && !dismissed && !show) {
        setShow(true);
        trackExitIntentShow();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [dismissed, show]);

  const handleClose = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('exitIntentDismissed', 'true');
    if (status !== 'success') {
      trackExitIntentDismiss();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/email-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'exit-intent' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      trackEmailSignup('exit-intent');
    } catch (err) {
      setStatus('error');
    }
  };

  if (!show || dismissed) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(135deg, #0a1628 0%, #0f1f17 100%)',
        border: '2px solid #22c55e',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        zIndex: 9999,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#71717a',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ✕
        </button>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ color: '#22c55e', fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
              Check your inbox!
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6' }}>
              We just sent you this week's top 5 whale moves. Plus you'll get weekly alerts with the best trades.
            </p>
            <button
              onClick={handleClose}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: '#27272a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Continue Browsing
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🐋</div>
              <h3 style={{
                color: '#fff',
                fontSize: '26px',
                fontWeight: '700',
                marginBottom: '8px',
                lineHeight: '1.2',
              }}>
                Wait! Get this week's top 5 whale moves
              </h3>
              <p style={{ color: '#71717a', fontSize: '15px', lineHeight: '1.5' }}>
                We'll send you the biggest trades from the last 7 days. Free, instant delivery.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '12px',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: status === 'loading' ? '#27272a' : '#22c55e',
                  color: status === 'loading' ? '#71717a' : '#000',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                }}
              >
                {status === 'loading' ? 'Sending...' : 'Send Me the Trades'}
              </button>
            </form>

            {status === 'error' && (
              <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
                Something went wrong. Please try again.
              </p>
            )}

            <p style={{ color: '#52525b', fontSize: '12px', textAlign: 'center' }}>
              Plus weekly alerts. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
