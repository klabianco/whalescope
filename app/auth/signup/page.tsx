'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function SignupPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  useEffect(() => {
    if (connected && publicKey) {
      // Wallet connected - redirect to dashboard or whales page
      router.push('/whales');
    }
  }, [connected, publicKey, router]);

  return (
    <>
      <Header />
      <main style={{ maxWidth: '400px', margin: '0 auto', padding: '60px 24px 80px', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐋</div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
            Get Started
          </h1>
          <p style={{ color: '#71717a', fontSize: '15px', lineHeight: '1.6' }}>
            Connect your wallet to start tracking smart money
          </p>
        </div>

        <button
          onClick={() => setVisible(true)}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
        >
          Connect Wallet
        </button>

        <p style={{ color: '#52525b', fontSize: '13px', lineHeight: '1.6' }}>
          No email or password needed. Your wallet is your identity.
        </p>

        {/* Benefits */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '32px',
          textAlign: 'left'
        }}>
          <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
            Free account includes:
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Track crypto whales & congress trades',
              'Follow up to 5 wallets',
              'Basic trade alerts',
              'Leaderboard access'
            ].map((item, i) => (
              <li key={i} style={{ color: '#a1a1aa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
