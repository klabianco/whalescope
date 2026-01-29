'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../providers/AuthProvider';

const FREE_WATCHLIST_LIMIT = 3;

interface Whale {
  name: string;
  type: string;
  address: string;
  description: string;
  market: 'crypto' | 'tradfi';
}

interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

// Wallet labels based on verified on-chain data only. No unverified entity claims.
const CRYPTO_WHALES: Whale[] = [
  { name: "Whale #1 (Exchange Pattern)", type: "Exchange", address: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", description: "1.1M+ SOL. High-volume daily transfers.", market: 'crypto' },
  { name: "Whale #2 (Exchange Pattern)", type: "Exchange", address: "AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2", description: "286K+ SOL. Active daily transfers.", market: 'crypto' },
  { name: "Whale #3 (DeFi Trader)", type: "Active Trader", address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", description: "Active Raydium DEX trader. High tx volume.", market: 'crypto' },
  { name: "Whale #4 (Top Holder)", type: "Whale", address: "MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2", description: "#1 SOL holder. 5.17M SOL (1.01% supply).", market: 'crypto' },
  { name: "Whale #5 (Top Holder)", type: "Whale", address: "52C9T2T7JRojtxumYnYZhyUmrN7kqzvCLc4Ksvjk7TxD", description: "#2 SOL holder. 4.37M SOL (0.85% supply).", market: 'crypto' },
  { name: "Whale #6 (Top Holder)", type: "Whale", address: "8BseXT9EtoEhBTKFFYkwTnjKSUZwhtmdKY2Jrj8j45Rt", description: "#3 SOL holder. 3.93M SOL (0.77% supply).", market: 'crypto' },
  { name: "Whale #7 (Top Holder)", type: "Whale", address: "GitYucwpNcg6Dx1Y15UQ9TQn8LZMX1uuqQNn8rXxEWNC", description: "#4 SOL holder. 3.63M SOL (0.71% supply).", market: 'crypto' },
  { name: "Whale #8 (Top Holder)", type: "Whale", address: "9QgXqrgdbVU8KcpfskqJpAXKzbaYQJecgMAruSWoXDkM", description: "#5 SOL holder. 3.14M SOL (0.61% supply).", market: 'crypto' },
  { name: "Whale #9 (High Volume)", type: "Active Trader", address: "5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD", description: "7,359 SOL single transfer. High activity.", market: 'crypto' },
  { name: "Whale #10 (Top Holder)", type: "Whale", address: "9uRJ5aGgeu2i3J98hsC5FDxd2PmRjVy9fQwNAy7fzLG3", description: "#6 SOL holder. 2.87M SOL (0.56% supply).", market: 'crypto' },
];

const TYPE_COLORS: Record<string, string> = {
  'Exchange': '#fbbf24',
  'Active Trader': '#60a5fa',
  'Whale': '#4ade80',
  'Congress-D': '#60a5fa',
  'Congress-R': '#f87171',
  'Congress-I': '#a78bfa',
};

export default function WhalesPage() {
  const { publicKey, connected } = useWallet();
  const [followingWallets, setFollowingWallets] = useState<string[]>([]);
  const [followingPoliticians, setFollowingPoliticians] = useState<string[]>([]);
  const [tab, setTab] = useState<'crypto' | 'congress'>('crypto');
  const [politicians, setPoliticians] = useState<{name: string; party: string; chamber: string; slug: string; tradeCount: number}[]>([]);
  const [limitWarning, setLimitWarning] = useState(false);
  
  let isPro = false;
  try {
    const auth = useAuth();
    isPro = auth.isPro;
  } catch {}

  const storageKey = publicKey ? publicKey.toBase58() : null;

  useEffect(() => {
    if (storageKey) {
      try {
        const savedWallets = localStorage.getItem(`wallets_${storageKey}`);
        setFollowingWallets(savedWallets ? JSON.parse(savedWallets) : []);
        const savedPols = localStorage.getItem(`politicians_${storageKey}`);
        setFollowingPoliticians(savedPols ? JSON.parse(savedPols) : []);
      } catch {
        setFollowingWallets([]);
        setFollowingPoliticians([]);
      }
    }
    
    // Fetch congress data from API (Supabase-backed)
    fetch('/api/congress-trades')
      .then(res => res.ok ? res.json().then(d => d.trades || d) : [])
      .then((trades: CongressTrade[]) => {
        // Get unique politicians with trade counts
        const polMap = new Map<string, {name: string; party: string; chamber: string; count: number}>();
        trades.forEach(t => {
          const key = t.politician;
          if (polMap.has(key)) {
            polMap.get(key)!.count++;
          } else {
            polMap.set(key, { name: t.politician, party: t.party, chamber: t.chamber, count: 1 });
          }
        });
        const pols = Array.from(polMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
          .map(p => ({
            name: p.name,
            party: p.party,
            chamber: p.chamber,
            slug: p.name.toLowerCase().replace(/ /g, '-'),
            tradeCount: p.count
          }));
        setPoliticians(pols);
      })
      .catch(() => setPoliticians([]));
  }, [storageKey]);

  function toggleFollowWallet(address: string) {
    if (!storageKey) return;
    // Unfollowing is always allowed
    if (followingWallets.includes(address)) {
      const newList = followingWallets.filter(a => a !== address);
      localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
      setFollowingWallets(newList);
      setLimitWarning(false);
      return;
    }
    // Check limit for free users
    const totalFollowed = followingWallets.length + followingPoliticians.length;
    if (!isPro && totalFollowed >= FREE_WATCHLIST_LIMIT) {
      setLimitWarning(true);
      return;
    }
    const newList = [...followingWallets, address];
    localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
    setFollowingWallets(newList);
  }

  function toggleFollowPolitician(slug: string) {
    if (!storageKey) return;
    // Unfollowing is always allowed
    if (followingPoliticians.includes(slug)) {
      const newList = followingPoliticians.filter(s => s !== slug);
      localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
      setFollowingPoliticians(newList);
      setLimitWarning(false);
      return;
    }
    // Check limit for free users
    const totalFollowed = followingWallets.length + followingPoliticians.length;
    if (!isPro && totalFollowed >= FREE_WATCHLIST_LIMIT) {
      setLimitWarning(true);
      return;
    }
    const newList = [...followingPoliticians, slug];
    localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
    setFollowingPoliticians(newList);
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', margin: '0 0 8px' }}>
            Smart Money
          </h1>
          <p style={{ color: '#888' }}>
            Track the biggest players. Crypto whales & Congress trades.
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

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px',
        background: '#111118',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setTab('crypto')}
          style={{
            padding: '12px 24px',
            background: tab === 'crypto' ? '#333' : 'transparent',
            color: tab === 'crypto' ? '#fff' : '#888',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Crypto Whales
        </button>
        <button
          onClick={() => setTab('congress')}
          style={{
            padding: '12px 24px',
            background: tab === 'congress' ? '#333' : 'transparent',
            color: tab === 'congress' ? '#fff' : '#888',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Congress ({politicians.length})
        </button>
      </div>

      {/* Crypto Whales */}
      {tab === 'crypto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CRYPTO_WHALES.map((whale) => (
            <div key={whale.address} style={{
              background: '#111118',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                    {whale.name}
                  </span>
                  <span style={{
                    background: (TYPE_COLORS[whale.type] || '#666') + '20',
                    color: TYPE_COLORS[whale.type] || '#666',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {whale.type}
                  </span>
                </div>
                <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 8px' }}>
                  {whale.description}
                </p>
                <Link 
                  href={`/wallet/${whale.address}`}
                  style={{ color: '#60a5fa', fontSize: '12px', fontFamily: 'monospace', textDecoration: 'none' }}
                >
                  {whale.address.slice(0, 8)}...{whale.address.slice(-8)}
                </Link>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link 
                  href={`/wallet/${whale.address}`}
                  style={{ padding: '10px 20px', background: '#222', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}
                >
                  View
                </Link>
                <button
                  onClick={() => {
                    if (connected) {
                      toggleFollowWallet(whale.address);
                    } else {
                      document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    background: followingWallets.includes(whale.address) ? '#333' : '#222',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {followingWallets.includes(whale.address) ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Congress */}
      {tab === 'congress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {politicians.map((pol) => (
            <div key={pol.slug} style={{
              background: '#111118',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                    {pol.name}
                  </span>
                  <span style={{
                    background: (pol.party === 'D' ? '#60a5fa' : pol.party === 'R' ? '#f87171' : '#a78bfa') + '20',
                    color: pol.party === 'D' ? '#60a5fa' : pol.party === 'R' ? '#f87171' : '#a78bfa',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {pol.party === 'D' ? 'Democrat' : pol.party === 'R' ? 'Republican' : 'Independent'}
                  </span>
                </div>
                <p style={{ color: '#888', fontSize: '13px', margin: '4px 0' }}>
                  {pol.chamber} · {pol.tradeCount} {pol.tradeCount === 1 ? 'trade' : 'trades'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link 
                  href={`/congress/${pol.slug}`}
                  style={{ padding: '10px 20px', background: '#222', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}
                >
                  View Trades
                </Link>
                <button
                  onClick={() => {
                    if (connected) {
                      toggleFollowPolitician(pol.slug);
                    } else {
                      document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    background: followingPoliticians.includes(pol.slug) ? '#333' : '#222',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {followingPoliticians.includes(pol.slug) ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
    <Footer />
    </>
  );
}
