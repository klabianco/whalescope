'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EmailCapture } from './components/EmailCapture';
import { FOLLOW_BUTTON } from './config/theme';
import tradesData from '../data/whale-trades.json';
import whaleWalletsData from '../data/whale-wallets.json';

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

interface WhaleTrade {
  wallet: string;
  walletLabel: string;
  walletValue: string;
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenSymbol?: string;
  tokenAmount?: number;
  solAmount?: number;
  action: 'BUY' | 'SELL' | 'TRANSFER' | 'UNKNOWN';
}

const FREE_WATCHLIST_LIMIT = 3;

// Filter out bots/protocols
const BOT_KEYWORDS = ['bot', 'automated', 'liquidit'];
const EXCLUDED_WALLETS = new Set(
  (whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets
    .filter(w => w.type === 'protocol' || BOT_KEYWORDS.some(kw => w.name.toLowerCase().includes(kw)))
    .map(w => w.address)
);

export default function Home() {
  const [congressTrades, setCongressTrades] = useState<CongressTrade[]>([]);
  const [followingWallets, setFollowingWallets] = useState<string[]>([]);
  const [limitWarning, setLimitWarning] = useState(false);
  const { publicKey, connected } = useWallet();
  const storageKey = publicKey?.toBase58();

  useEffect(() => {
    fetch('/api/congress-trades?limit=4')
      .then(res => res.ok ? res.json() : [])
      .then((data: any) => {
        const trades = Array.isArray(data) ? data : (data.trades || []);
        setCongressTrades(trades);
      })
      .catch(() => setCongressTrades([]));
  }, []);

  // Load follows from localStorage
  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`whales_${storageKey}`);
        if (saved) setFollowingWallets(JSON.parse(saved));
      } catch {}
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
    if (followingWallets.length >= FREE_WATCHLIST_LIMIT) {
      setLimitWarning(true);
      return;
    }
    const newList = [...followingWallets, address];
    localStorage.setItem(`whales_${storageKey}`, JSON.stringify(newList));
    setFollowingWallets(newList);
  }

  const whaleTrades = useMemo(() => {
    // Dedupe by wallet so we show unique whales, not 5 cards of the same one
    const seen = new Set<string>();
    return (tradesData as WhaleTrade[])
      .filter(t => !EXCLUDED_WALLETS.has(t.wallet) && t.tokenSymbol && (t.action === 'BUY' || t.action === 'SELL'))
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter(t => {
        if (seen.has(t.wallet)) return false;
        seen.add(t.wallet);
        return true;
      })
      .slice(0, 6);
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    const now = Date.now();
    const diffH = Math.floor((now - d.getTime()) / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSol = (n?: number) => {
    if (!n) return '';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K SOL`;
    return `${n.toFixed(1)} SOL`;
  };
  
  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {/* Hero — crypto first */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '12px', lineHeight: '1.2' }}>
            Track the whales. Follow the money.
          </h1>
          <p style={{ fontSize: '17px', color: '#888', marginBottom: '24px' }}>
            157 crypto wallets · 125 politicians · real-time alerts
          </p>
          {!connected && (
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click()}
              style={{
                background: FOLLOW_BUTTON.inactiveBg,
                color: FOLLOW_BUTTON.inactiveColor,
                border: FOLLOW_BUTTON.inactiveBorder,
                padding: '14px 36px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              Connect Wallet to Follow Whales
            </button>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: connected ? 0 : '12px' }}>
            <Link href="/whales" style={{
              background: connected ? '#fff' : '#111118',
              color: connected ? '#000' : '#fff',
              border: connected ? 'none' : '1px solid #333',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              🐋 Crypto Whales
            </Link>
            <Link href="/congress" style={{
              background: '#111118',
              color: '#fff',
              border: '1px solid #333',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              🏛️ Politician Trades
            </Link>
          </div>
        </div>

        {/* Whale trades with Follow buttons */}
        {whaleTrades.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{ fontSize: '20px', color: '#fff', margin: 0 }}>
                Recent whale moves
              </h2>
              <Link href="/whales" style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>

            {limitWarning && (
              <div style={{
                background: '#7f1d1d',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '12px',
              }}>
                Free plan limit: {FREE_WATCHLIST_LIMIT} watchlist slots. <Link href="/pricing" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Upgrade for unlimited.</Link>
              </div>
            )}

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px',
            }}>
              {whaleTrades.map((trade, i) => {
                const isFollowing = followingWallets.includes(trade.wallet);
                return (
                  <div key={i} style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <button
                        onClick={() => {
                          if (connected) toggleFollow(trade.wallet);
                          else document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
                        }}
                        style={{
                          background: isFollowing ? FOLLOW_BUTTON.activeBg : FOLLOW_BUTTON.inactiveBg,
                          color: isFollowing ? FOLLOW_BUTTON.activeColor : FOLLOW_BUTTON.inactiveColor,
                          border: isFollowing ? FOLLOW_BUTTON.activeBorder : FOLLOW_BUTTON.inactiveBorder,
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {isFollowing ? '✓ Following' : '+ Follow'}
                      </button>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                        {trade.walletLabel || trade.wallet.slice(0, 8) + '...'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#ccc', fontSize: '15px', fontWeight: '600' }}>{trade.tokenSymbol}</span>
                        <span style={{
                          background: trade.action === 'BUY' ? '#064e3b' : '#7f1d1d',
                          color: trade.action === 'BUY' ? '#4ade80' : '#f87171',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          marginLeft: '8px',
                        }}>
                          {trade.action}
                        </span>
                      </div>
                      <span style={{ color: '#555', fontSize: '12px' }}>{formatSol(trade.solAmount)}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                      {formatTime(trade.timestamp)} · {trade.walletValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Congress trades — secondary */}
        {congressTrades.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{ fontSize: '20px', color: '#fff', margin: 0 }}>
                Latest politician filings
              </h2>
              <Link href="/congress" style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}>
                View all 125 →
              </Link>
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px',
            }}>
              {congressTrades.slice(0, 4).map((trade, i) => (
                <Link key={i} href={`/congress/${trade.politician.toLowerCase().replace(/ /g, '-')}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                        {trade.politician}
                      </span>
                      <span style={{
                        background: trade.type === 'Purchase' ? '#064e3b' : '#7f1d1d',
                        color: trade.type === 'Purchase' ? '#4ade80' : '#f87171',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {trade.type === 'Purchase' ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: '#ccc', fontSize: '15px', fontWeight: '600' }}>{trade.ticker}</span>
                      <span style={{ color: '#555', fontSize: '12px' }}>{trade.amount}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                      Filed {trade.filed} · {trade.party === 'D' ? '🔵' : trade.party === 'R' ? '🔴' : '⚪'} {trade.chamber}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Single CTA */}
        <EmailCapture 
          source="homepage"
          headline="Get free weekly alerts"
          subtext="Crypto whale moves + politician trades. No spam."
          buttonText="Subscribe Free"
          compact={false}
        />

      </main>
      <Footer />
    </>
  );
}
