'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        missing_token: 'Invalid login link.',
        invalid_token: 'This login link is invalid or has expired.',
        token_used: 'This login link has already been used.',
        token_expired: 'This login link has expired. Please request a new one.',
        profile_not_found: 'Account not found.',
        server_error: 'Something went wrong. Please try again.',
      };
      setError(errorMessages[errorParam] || 'An error occurred.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send login link');
        return;
      }

      setSent(true);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)',
      color: '#fff',
    }}>
      <Header />
      
      <main style={{ maxWidth: '400px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          Log In
        </h1>
        
        <p style={{ 
          color: '#71717a', 
          textAlign: 'center', 
          marginBottom: '32px',
          fontSize: '15px',
        }}>
          Access your WhaleScope Pro account
        </p>

        {error && (
          <div style={{
            background: '#7f1d1d',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#fecaca',
          }}>
            {error}
          </div>
        )}

        {sent ? (
          <div style={{
            background: '#14532d',
            border: '1px solid #22c55e',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
              Check your email
            </h2>
            <p style={{ color: '#bbf7d0', fontSize: '14px', lineHeight: '1.6' }}>
              We sent a login link to <strong>{email}</strong>. 
              Click the link to sign in. It expires in 15 minutes.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              style={{
                marginTop: '20px',
                background: 'none',
                border: 'none',
                color: '#4ade80',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#a1a1aa',
                }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#3b82f6' : '#3b82f6',
                  opacity: loading || !email ? 0.7 : 1,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>

            <div style={{
              margin: '32px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
              <span style={{ color: '#52525b', fontSize: '14px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
            </div>

            <Link
              href="/auth/signup"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Connect Wallet Instead
            </Link>

            <p style={{ 
              marginTop: '32px', 
              textAlign: 'center', 
              fontSize: '14px', 
              color: '#71717a' 
            }}>
              Don't have an account?{' '}
              <Link href="/pricing" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                Get Pro
              </Link>
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: '#71717a' }}>Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
