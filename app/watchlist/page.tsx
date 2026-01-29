'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from '../components/Header';

interface Trade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  traded: string;
}

interface FollowedPolitician {
  slug: string;
  name: string;
  party: string;
  chamber: string;
  recentTrades: Trade[];
}

export default function WatchlistPage() {
  const { publicKey, connected } = useWallet();
  const [wallets, setWallets] = useState<string[]>([]);
  const [walletActivities, setWalletActivities] = useState<Map<string, any>>(new Map());
  const [politicians, setPoliticians] = useState<FollowedPolitician[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'congress'>('all');

  // Storage key based on wallet
  const storageKey = publicKey ? publicKey.toBase58() : null;

  useEffect(() => {
    if (connected && storageKey) {
      loadWatchlist();
    } else {
      setLoading(false);
    }
  }, [connected, storageKey]);

  async function loadWatchlist() {
    if (!storageKey) return;

    // Load crypto wallets (stored per user wallet)
    const savedWallets = localStorage.getItem(`wallets_${storageKey}`);
    const walletList = savedWallets ? JSON.parse(savedWallets) : [];
    setWallets(walletList);
    
    // Fetch wallet activity
    walletList.forEach((addr: string) => fetchWalletActivity(addr));

    // Load politicians
    const savedPoliticians = localStorage.getItem(`politicians_${storageKey}`);
    const politicianSlugs: string[] = savedPoliticians ? JSON.parse(savedPoliticians) : [];
    
    if (politicianSlugs.length > 0) {
      try {
        const res = await fetch('/congress-trades.json');
        const allTrades: Trade[] = await res.json();

        const followedList: FollowedPolitician[] = [];
        for (const slug of politicianSlugs) {
          const trades = allTrades.filter(t => 
            t.politician.toLowerCase().replace(/ /g, '-') === slug
          );
          if (trades.length > 0) {
            followedList.push({
              slug,
              name: trades[0].politician,
              party: trades[0].party,
              chamber: trades[0].chamber,
              recentTrades: trades.slice(0, 3)
            });
          }
        }
        setPoliticians(followedList);
      } catch (err) {
        console.error('Failed to load politicians:', err);
      }
    }
    
    setLoading(false);
  }

  async function fetchWalletActivity(address: string) {
    try {
      const res = await fetch(
        `/api/helius?action=wallet-txns&address=${address}&limit=1`
      );
      const txs = await res.json();
      if (txs && txs.length > 0) {
        setWalletActivities(prev => new Map(prev).set(address, txs[0]));
      }
    } catch (err) {
      console.error('Failed to fetch wallet activity:', err);
    }
  }

  function removeWallet(address: string) {
    if (!storageKey) return;
    const newList = wallets.filter(w => w !== address);
    localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
    setWallets(newList);
  }

  function removePolitician(slug: string) {
    if (!storageKey) return;
    const saved = localStorage.getItem(`politicians_${storageKey}`);
    const list: string[] = saved ? JSON.parse(saved) : [];
    const newList = list.filter(s => s !== slug);
    localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
    setPoliticians(politicians.filter(p => p.slug !== slug));
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

  const showWallets = activeTab === 'all' || activeTab === 'crypto';
  const showPoliticians = activeTab === 'all' || activeTab === 'congress';
  const isEmpty = wallets.length === 0 && politicians.length === 0;

  // Not connected - show connect prompt
  if (!connected) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ 
            background: '#111118', 
            padding: '60px 40px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h2 style={{ color: '#fff', marginBottom: '8px' }}>Connect Your Wallet</h2>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              Connect your Solana wallet to save your watchlist.
            </p>
            <WalletMultiButton style={{
              backgroundColor: '#4ade80',
              color: '#000',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              height: '48px',
              padding: '0 32px'
            }} />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            Your Watchlist
          </h1>
          <p style={{ color: '#888' }}>
            Track crypto wallets and politicians in one place.
          </p>
        </div>

        {/* Tabs */}
        {!isEmpty && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {(['all', 'crypto', 'congress'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab ? '#4ade80' : '#222',
                  color: activeTab === tab ? '#000' : '#888',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {tab === 'all' ? 'All' : tab === 'crypto' ? 'Crypto' : 'Congress'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#888' }}>Loading...</div>
        ) : isEmpty ? (
          <div style={{ 
            background: '#111118', 
            padding: '60px 40px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>Your watchlist is empty</h3>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              Follow crypto wallets or politicians to track their moves.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/search" style={{
                display: 'inline-block',
                background: '#fff',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                Search Tokens
              </Link>
              <Link href="/congress" style={{
                display: 'inline-block',
                background: '#333',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                Congress Trades
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Crypto Wallets */}
            {showWallets && wallets.map((address) => {
              const activity = walletActivities.get(address);
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    
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
                          Last active: {timeAgo(activity.timestamp)}
                        </div>
                      )}
                    </div>
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

            {/* Politicians */}
            {showPoliticians && politicians.map((pol) => (
              <div key={pol.slug} style={{
                background: '#111118',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '16px 20px',
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: pol.recentTrades.length > 0 ? '12px' : '0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    
                    <Link 
                      href={`/congress/${pol.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span style={{ color: '#fff', fontWeight: '600' }}>
                        {pol.name}
                      </span>
                      <span style={{ 
                        color: pol.party === 'D' ? '#60a5fa' : '#f87171',
                        fontSize: '13px',
                        marginLeft: '8px'
                      }}>
                        ({pol.party}) · {pol.chamber}
                      </span>
                    </Link>
                  </div>
                  <button
                    onClick={() => removePolitician(pol.slug)}
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
                
                {pol.recentTrades.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '32px' }}>
                    {pol.recentTrades.map((trade, i) => (
                      <span key={i} style={{
                        padding: '4px 8px',
                        background: '#0a0a0f',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <span style={{ color: trade.type === 'Purchase' ? '#4ade80' : '#f87171' }}>
                          {trade.type === 'Purchase' ? '↑' : '↓'}
                        </span>
                        {' '}
                        <span style={{ color: '#888' }}>{trade.ticker}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isEmpty && (
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <p style={{ color: '#888', marginBottom: '12px' }}>
              🔔 Want alerts when your watchlist makes moves?
            </p>
            <button style={{
              background: '#fff',
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
      </main>
    </>
  );
}
