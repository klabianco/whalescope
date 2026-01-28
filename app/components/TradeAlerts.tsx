'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface Props {
  politicians?: string[];
  defaultPolitician?: string;
  compact?: boolean;
}

export default function TradeAlerts({ compact = false }: Props) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #27272a',
      padding: compact ? '20px' : '32px',
      borderRadius: '16px',
      textAlign: 'center'
    }}>
      <h3 style={{ fontSize: compact ? '18px' : '22px', marginBottom: '8px', color: '#fff' }}>
        Get Trade Alerts
      </h3>
      <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '20px' }}>
        Real-time notifications when politicians make moves
      </p>

      {connected ? (
        <Link href="/pricing" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Upgrade to Pro
          </button>
        </Link>
      ) : (
        <button
          onClick={() => setVisible(true)}
          style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Connect Wallet
        </button>
      )}

      <p style={{ color: '#52525b', fontSize: '12px', marginTop: '16px' }}>
        Pro members get Telegram & Discord alerts
      </p>
    </div>
  );
}
