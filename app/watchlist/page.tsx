'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '../components/Header';
import { useFollows } from '../hooks/useFollows';
import tradesData from '../../data/whale-trades.json';
import whaleWalletsData from '../../data/whale-wallets.json';

interface Trade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  traded: string;
}

interface WhaleTrade {
  wallet: string;
  walletLabel: string;
  walletValue: string;
  timestamp: number;
  tokenSymbol?: string;
  solAmount?: number;
  action: 'BUY' | 'SELL' | 'TRANSFER' | 'UNKNOWN';
}

interface FollowedPolitician {
  slug: string;
  name: string;
  party: string;
  chamber: string;
  recentTrades: Trade[];
}

export default function WatchlistPage() {
  const { publicKey } = useWallet();
  const { follows, toggleWhale, togglePolitician } = useFollows();
  const [politicians, setPoliticians] = useState<FollowedPolitician[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'congress'>('all');

  const whaleFollows = follows.whales;

  // Whale wallet lookup
  const walletLookup = useMemo(() => {
    const map = new Map<string, { name: string; value: string }>();
    (whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets
      .forEach(w => map.set(w.address, { name: w.name, value: w.type }));
    return map;
  }, []);

  // Recent trades per wallet
  const recentTradesByWallet = useMemo(() => {
    const map = new Map<string, WhaleTrade[]>();
    (tradesData as WhaleTrade[])
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach(t => {
        if (!map.has(t.wallet)) map.set(t.wallet, []);
        const list = map.get(t.wallet)!;
        if (list.length < 3) list.push(t);
      });
    return map;
  }, []);

  // Load politician details when follows change
  useEffect(() => {
    const slugs = follows.politicians;
    if (slugs.length === 0) {
      setPoliticians([]);
      setLoading(false);
      return;
    }
    fetch('/api/congress-trades')
      .then(res => res.json())
      .then(data => {
        const allTrades: Trade[] = data.trades || [];
        const followedList: FollowedPolitician[] = [];
        for (const slug of slugs) {
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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [follows.politicians]);

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function formatTime(ts: number) {
    const diffH = Math.floor((Date.now() / 1000 - ts) / 3600);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffH < 168) return `${Math.floor(diffH / 24)}d ago`;
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const showWallets = activeTab === 'all' || activeTab === 'crypto';
  const showPoliticians = activeTab === 'all' || activeTab === 'congress';
  const totalFollowed = whaleFollows.length + follows.politicians.length;
  const isEmpty = totalFollowed === 0;

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/whales" style={{
                display: 'inline-block',
                background: '#fff',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                🐋 Crypto Whales
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
                🏛️ Politicians
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Crypto Whale Follows */}
            {showWallets && whaleFollows.map((address) => {
              const info = walletLookup.get(address);
              const trades = recentTradesByWallet.get(address) || [];
              return (
                <div key={address} style={{
                  background: '#111118',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  padding: '16px 20px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: trades.length > 0 ? '12px' : '0'
                  }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                        {info?.name || shortenAddress(address)}
                      </span>
                      {info && (
                        <span style={{ color: '#555', fontSize: '13px', marginLeft: '8px' }}>
                          {shortenAddress(address)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleWhale(address)}
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
                  {trades.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {trades.map((t, i) => (
                        <span key={i} style={{
                          padding: '4px 10px',
                          background: '#0a0a0f',
                          borderRadius: '4px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <span style={{ color: t.action === 'BUY' ? '#4ade80' : '#f87171' }}>
                            {t.action === 'BUY' ? '↑' : '↓'}
                          </span>
                          <span style={{ color: '#ccc' }}>{t.tokenSymbol || 'SOL'}</span>
                          <span style={{ color: '#444' }}>·</span>
                          <span style={{ color: '#555' }}>{formatTime(t.timestamp)}</span>
                        </span>
                      ))}
                    </div>
                  )}
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
                  <button
                    onClick={() => togglePolitician(pol.slug)}
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {pol.recentTrades.map((trade, i) => (
                      <span key={i} style={{
                        padding: '4px 10px',
                        background: '#0a0a0f',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <span style={{ color: trade.type === 'Purchase' ? '#4ade80' : '#f87171' }}>
                          {trade.type === 'Purchase' ? '↑' : '↓'}
                        </span>
                        <span style={{ color: '#ccc' }}>{trade.ticker}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isEmpty && !publicKey && (
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
            padding: '28px',
            borderRadius: '12px',
            textAlign: 'center',
            marginTop: '24px'
          }}>
            <p style={{ color: '#fff', fontWeight: '600', fontSize: '17px', marginBottom: '8px' }}>
              You're following {whaleFollows.length + politicians.length} {whaleFollows.length + politicians.length === 1 ? 'account' : 'accounts'}.
              Get notified when they trade.
            </p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
              Connect your wallet to get real-time alerts via email or Telegram, and sync your watchlist across devices.
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click()}
              style={{
                background: '#4ade80',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              Connect Wallet
            </button>
          </div>
        )}

        {!isEmpty && publicKey && (
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
            padding: '28px',
            borderRadius: '12px',
            textAlign: 'center',
            marginTop: '24px'
          }}>
            <p style={{ color: '#fff', fontWeight: '600', fontSize: '17px', marginBottom: '8px' }}>
              🔔 Get alerts when your {whaleFollows.length + politicians.length} follows make moves
            </p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
              Real-time email digests or Telegram alerts.
            </p>
            <Link href="/pricing" style={{
              display: 'inline-block',
              background: '#fff',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              Upgrade to Pro
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
