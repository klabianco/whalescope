'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../providers/AuthProvider';
import whaleData from '../../data/whale-wallets.json';

const FREE_WATCHLIST_LIMIT = 3;

interface WhaleWallet {
  address: string;
  name: string;
  type: string;
  totalUSD: string;
  totalUSDRaw: number;
  topHoldings?: string[] | null;
  solscanUrl: string;
}

const WALLETS: WhaleWallet[] = (whaleData.wallets as WhaleWallet[])
  .sort((a, b) => b.totalUSDRaw - a.totalUSDRaw);

type WalletType = 'all' | 'exchange' | 'protocol' | 'institution' | 'unknown_whale';

const TYPE_LABELS: Record<string, string> = {
  exchange: 'Exchange',
  protocol: 'Protocol',
  institution: 'Institution',
  unknown_whale: 'Whale',
};

const TYPE_COLORS: Record<string, string> = {
  exchange: '#fbbf24',
  protocol: '#22d3ee',
  institution: '#60a5fa',
  unknown_whale: '#a78bfa',
};

export default function WhalesPage() {
  const { publicKey, connected } = useWallet();
  const [followingWallets, setFollowingWallets] = useState<string[]>([]);
  const [walletFilter, setWalletFilter] = useState<WalletType>('all');
  const [limitWarning, setLimitWarning] = useState(false);
  
  let isPro = false;
  try {
    const auth = useAuth();
    isPro = auth.isPro;
  } catch {}

  const storageKey = publicKey ? publicKey.toBase58() : null;

  const filteredWallets = walletFilter === 'all'
    ? WALLETS
    : WALLETS.filter(w => w.type === walletFilter);

  const typeCounts: Record<string, number> = {};
  WALLETS.forEach(w => { typeCounts[w.type] = (typeCounts[w.type] || 0) + 1; });

  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`whales_${storageKey}`);
        setFollowingWallets(saved ? JSON.parse(saved) : []);
      } catch {
        setFollowingWallets([]);
      }
    }
  }, [storageKey]);

  function toggleFollow(address: string) {
    if (!storageKey) return;
    if (followingWallets.includes(address)) {
      const newList = followingWallets.filter(a => a !== address);
      localStorage.setItem(`whales_${storageKey}`, JSON.stringify(newList));
      setFollowingWallets(newList);
      setLimitWarning(false);
      return;
    }
    if (!isPro && followingWallets.length >= FREE_WATCHLIST_LIMIT) {
      setLimitWarning(true);
      return;
    }
    const newList = [...followingWallets, address];
    localStorage.setItem(`whales_${storageKey}`, JSON.stringify(newList));
    setFollowingWallets(newList);
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', margin: '0 0 8px' }}>
            Whale Tracker
          </h1>
          <p style={{ color: '#888' }}>
            Track the biggest crypto wallets on Solana — exchanges, protocols, and individual whales.
          </p>
        </div>

        {/* Watchlist Limit Warning */}
        {limitWarning && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0 }}>
              Free plan limit: {FREE_WATCHLIST_LIMIT} watchlist slots. Upgrade for unlimited.
            </p>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#fbbf24',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Upgrade to Pro
              </button>
            </Link>
          </div>
        )}

        {/* Filter pills */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setWalletFilter('all')}
            style={{
              padding: '6px 14px',
              background: walletFilter === 'all' ? '#fff' : '#1a1a24',
              color: walletFilter === 'all' ? '#000' : '#888',
              border: '1px solid ' + (walletFilter === 'all' ? '#fff' : '#333'),
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            All ({WALLETS.length})
          </button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => {
            const count = typeCounts[key] || 0;
            if (count === 0) return null;
            const color = TYPE_COLORS[key] || '#888';
            const isActive = walletFilter === key;
            return (
              <button
                key={key}
                onClick={() => setWalletFilter(key as WalletType)}
                style={{
                  padding: '6px 14px',
                  background: isActive ? color + '20' : '#1a1a24',
                  color: isActive ? color : '#888',
                  border: '1px solid ' + (isActive ? color + '60' : '#333'),
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Wallet cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredWallets.map((wallet) => {
            const typeColor = TYPE_COLORS[wallet.type] || '#888';
            const typeLabel = TYPE_LABELS[wallet.type] || wallet.type;
            const isUnknown = wallet.type === 'unknown_whale';
            const displayName = isUnknown 
              ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
              : wallet.name;
            return (
              <div key={wallet.address} style={{
                background: '#111118',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  {/* Name + type badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                      {displayName}
                    </span>
                    <span style={{
                      background: typeColor + '20',
                      color: typeColor,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {typeLabel}
                    </span>
                  </div>

                  {/* Portfolio value */}
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>
                    {wallet.totalUSD}
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                      tracked value
                    </span>
                  </div>

                  {/* Top holdings */}
                  {wallet.topHoldings && wallet.topHoldings.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {wallet.topHoldings.slice(0, 5).map((holding, i) => (
                        <span key={i} style={{
                          background: '#1a1a24',
                          border: '1px solid #2a2a3a',
                          color: '#aaa',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {holding}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Address + Solscan link */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#555', fontSize: '12px', fontFamily: 'monospace' }}>
                      {wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}
                    </span>
                    <a 
                      href={wallet.solscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      View on Solscan ↗
                    </a>
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Link 
                    href={`/wallet/${wallet.address}`}
                    style={{ 
                      padding: '10px 20px', 
                      background: '#222', 
                      color: '#fff', 
                      borderRadius: '8px', 
                      textDecoration: 'none', 
                      fontSize: '14px',
                      display: 'inline-block'
                    }}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      if (connected) {
                        toggleFollow(wallet.address);
                      } else {
                        document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: followingWallets.includes(wallet.address) ? typeColor + '30' : '#222',
                      color: followingWallets.includes(wallet.address) ? typeColor : '#fff',
                      border: followingWallets.includes(wallet.address) ? `1px solid ${typeColor}50` : '1px solid transparent',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {followingWallets.includes(wallet.address) ? '✓ Following' : 'Follow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Data source attribution */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px', 
          padding: '12px',
          color: '#555',
          fontSize: '12px'
        }}>
          {WALLETS.length} wallets tracked · Data from on-chain analysis ·{' '}
          <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            Solscan
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
