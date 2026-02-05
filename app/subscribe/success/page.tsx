'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { PushNotificationButton } from '../../components/PushNotificationButton';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brief delay for the webhook to process
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px' }}>Activating your Pro access...</h1>
        <p style={{ color: '#71717a' }}>This only takes a moment.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 24px 80px' }}>
      <div style={{
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        marginBottom: '32px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
        <h1 style={{ color: '#22c55e', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Welcome to Pro!
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6' }}>
          Your payment was successful. You now have full access to real-time trades, alerts, and analytics.
        </p>
      </div>

      {/* Get Started Cards */}
      <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
        Get Started
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <Link href="/congress" style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px 12px',
          textDecoration: 'none',
          textAlign: 'center',
          display: 'block',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏛️</div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Congress Trades</div>
          <div style={{ color: '#71717a', fontSize: '11px', lineHeight: '1.4' }}>See real-time filings</div>
        </Link>
        <a href="https://discord.gg/prKfxkYFUw" target="_blank" rel="noopener noreferrer" style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px 12px',
          textDecoration: 'none',
          textAlign: 'center',
          display: 'block',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎮</div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Join Discord</div>
          <div style={{ color: '#71717a', fontSize: '11px', lineHeight: '1.4' }}>Real-time alerts in #alerts</div>
        </a>
        <a href="https://t.me/WhaleScopeAlerts_bot" target="_blank" rel="noopener noreferrer" style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px 12px',
          textDecoration: 'none',
          textAlign: 'center',
          display: 'block',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📱</div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Telegram Bot</div>
          <div style={{ color: '#71717a', fontSize: '11px', lineHeight: '1.4' }}>Get alerts as DMs</div>
        </a>
        <Link href="/watchlist" style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px 12px',
          textDecoration: 'none',
          textAlign: 'center',
          display: 'block',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>👀</div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Watchlist</div>
          <div style={{ color: '#71717a', fontSize: '11px', lineHeight: '1.4' }}>Track your favorites</div>
        </Link>
      </div>
      <PushNotificationButton />
    </main>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ color: '#71717a' }}>Loading...</p>
        </main>
      }>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
