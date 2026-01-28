'use client';

import { FC } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Header: FC = () => {
  const { publicKey } = useWallet();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: '1px solid #222',
      marginBottom: '24px'
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
          🐋 WhaleScope
        </span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/whales" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
          Smart Money
        </Link>
        <Link href="/congress" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
          Congress
        </Link>
        <Link href="/leaderboard" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
          Leaderboard
        </Link>
        <Link href="/search" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
          Tokens
        </Link>
        <Link href="/pricing" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
          Pricing
        </Link>
        {publicKey && (
          <Link href="/watchlist" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
            Watchlist
          </Link>
        )}
        <WalletMultiButton style={{
          backgroundColor: '#fff',
          color: '#000',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          height: '40px'
        }} />
      </nav>
    </header>
  );
};
