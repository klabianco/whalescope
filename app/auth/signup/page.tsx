'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../providers/AuthProvider';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 24px 80px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
            Check your email
          </h1>
          <p style={{ color: '#71717a', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
            We sent a confirmation link to <strong style={{ color: '#fff' }}>{email}</strong>. 
            Click the link to activate your account.
          </p>
          <Link href="/auth/login">
            <button style={{
              padding: '12px 24px',
              background: '#27272a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Back to Sign In
            </button>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Create your account
          </h1>
          <p style={{ color: '#71717a', fontSize: '15px' }}>
            Start tracking smart money for free
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#f87171',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#a1a1aa', fontSize: '14px', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#a1a1aa', fontSize: '14px', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#a1a1aa', fontSize: '14px', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: loading ? '#27272a' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p style={{ color: '#52525b', fontSize: '12px', textAlign: 'center', lineHeight: '1.5' }}>
            By signing up, you agree to our{' '}
            <Link href="/terms" style={{ color: '#71717a', textDecoration: 'underline' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: '#71717a', textDecoration: 'underline' }}>Privacy Policy</Link>
          </p>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: '#71717a', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#22c55e', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          margin: '32px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
          <span style={{ color: '#52525b', fontSize: '13px' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: '#27272a' }} />
        </div>

        {/* Wallet Connect Button */}
        <button
          onClick={() => {/* TODO: Implement wallet auth */}}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '20px' }}>👛</span>
          Connect Wallet
        </button>

        {/* Free tier benefits */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '32px'
        }}>
          <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Free account includes:
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Basic whale trade feed',
              'Congress trades (24h delay)',
              '5 watchlist slots',
              'Daily email digest'
            ].map((item, i) => (
              <li key={i} style={{ color: '#71717a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#22c55e' }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
