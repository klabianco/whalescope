'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WalletActivity {
  address: string;
  recentTx?: {
    signature: string;
    timestamp: number;
    type: string;
  };
}

const HELIUS_KEY = '2bc6aa5c-ec94-4566-9102-18294afa2b14';

export default function WatchlistPage() {
  const [wallets, setWallets] = useState<string[]>([]);
  const [activities, setActivities] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('followedWallets');
    const list = saved ? JSON.parse(saved) : [];
    setWallets(list);
    setLoading(false);
    
    // Fetch recent activity for each wallet
    list.forEach((addr: string) => fetchWalletActivity(addr));
  }, []);

  async function fetchWalletActivity(address: string) {
    try {
      const res = await fetch(
        `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${HELIUS_KEY}&limit=1`
      );
      const txs = await res.json();
      if (txs && txs.length > 0) {
        setActivities(prev => new Map(prev).set(address, txs[0]));
      }
    } catch (err) {
      console.error('Failed to fetch wallet activity:', err);
    }
  }

  function removeWallet(address: string) {
    const newList = wallets.filter(w => w !== address);
    localStorage.setItem('followedWallets', JSON.stringify(newList));
    setWallets(newList);
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }

  function timeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to WhaleScope
        </Link>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
          👀 Your Watchlist
        </h1>
        <p style={{ color: '#888' }}>
          Wallets you&apos;re following. Track what smart money does next.
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#888' }}>Loading...</div>
      ) : wallets.length === 0 ? (
        <div style={{ 
          background: '#111118', 
          padding: '60px 40px', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐋</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No wallets yet</h3>
          <p style={{ color: '#888', marginBottom: '24px' }}>
            Search a token and follow wallets you want to track.
          </p>
          <Link href="/search" style={{
            display: 'inline-block',
            background: '#4ade80',
            color: '#000',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            Search Tokens →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {wallets.map((address) => {
            const activity = activities.get(address);
            return (
              <div key={address} style={{
                background: '#111118',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <a 
                    href={`https://solscan.io/account/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#60a5fa', textDecoration: 'none', fontFamily: 'monospace', fontSize: '15px' }}
                  >
                    {shortenAddress(address)}
                  </a>
                  {activity && (
                    <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
                      Last active: {timeAgo(activity.timestamp)} · {activity.type || 'Transaction'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeWallet(address)}
                  style={{
                    padding: '6px 12px',
                    background: '#7f1d1d',
                    color: '#f87171',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Unfollow
                </button>
              </div>
            );
          })}
        </div>
      )}

      {wallets.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <p style={{ color: '#888', marginBottom: '12px' }}>
            Want alerts when these wallets make moves?
          </p>
          <button style={{
            background: '#4ade80',
            color: '#000',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
          }}>
            Coming Soon
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '60px', color: '#666', fontSize: '14px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          🐋 WhaleScope
        </Link>
        {' · '}
        Built by <a href="https://x.com/WrenTheAI" style={{ color: '#60a5fa' }}>@WrenTheAI</a> 🪶
      </footer>
    </main>
  );
}
