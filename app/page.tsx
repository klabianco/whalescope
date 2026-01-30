'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EmailCapture } from './components/EmailCapture';
import { FollowToast } from './components/FollowToast';
import { FOLLOW_BUTTON } from './config/theme';
import { useFollows } from './hooks/useFollows';
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

// Filter out bots/protocols
const BOT_KEYWORDS = ['bot', 'automated', 'liquidit'];
const EXCLUDED_WALLETS = new Set(
  (whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets
    .filter(w => w.type === 'protocol' || BOT_KEYWORDS.some(kw => w.name.toLowerCase().includes(kw)))
    .map(w => w.address)
);

// Build wallet display name lookup
function getWalletDisplayName(address: string, tradeLabel: string, tradeValue: string): string {
  const wallets = (whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets;
  const dbWallet = wallets.find(w => w.address === address);
  const dbName = dbWallet?.name || '';
  // Use real DB label if it's not just a truncated address
  if (dbName && !dbName.includes('...')) return dbName;
  // If trade label is a real name, use it
  if (tradeLabel && !tradeLabel.includes('...')) return tradeLabel;
  // Value-based label
  if (tradeValue) return `${tradeValue} Whale`;
  return address.slice(0, 8) + '...' + address.slice(-4);
}

const TOTAL_TRACKED_WALLETS = (whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets.length;

export default function Home() {
  const [congressTrades, setCongressTrades] = useState<CongressTrade[]>([]);
  const [liveTrades, setLiveTrades] = useState<WhaleTrade[]>([]);
  const { toast, toggleWhale, isFollowingWhale, limitHit } = useFollows();

  useEffect(() => {
    fetch('/api/congress-trades?limit=3')
      .then(res => res.ok ? res.json() : [])
      .then((data: any) => {
        const trades = Array.isArray(data) ? data : (data.trades || []);
        setCongressTrades(trades);
      })
      .catch(() => setCongressTrades([]));

    // Fetch live whale trades from webhook data
    fetch('/api/whale-trades?limit=50')
      .then(res => res.json())
      .then(data => {
        if (data.trades && data.trades.length > 0) {
          setLiveTrades(data.trades);
        }
      })
      .catch(() => {});
  }, []);

  const whaleTrades = useMemo(() => {
    // Merge live + static data
    const staticTrades = (tradesData as WhaleTrade[])
      .filter(t => !EXCLUDED_WALLETS.has(t.wallet) && t.tokenSymbol && (t.action === 'BUY' || t.action === 'SELL'));

    const liveFiltered = liveTrades
      .filter(t => !EXCLUDED_WALLETS.has(t.wallet) && (t.action === 'BUY' || t.action === 'SELL'))
      // Homepage only shows significant trades — filter out dust
      .filter(t => (t.solAmount && t.solAmount >= 10) || (t.tokenAmount && t.tokenAmount >= 1000));

    const liveSigs = new Set(liveFiltered.map(t => t.signature));
    const combined = [
      ...liveFiltered,
      ...staticTrades.filter(t => !liveSigs.has(t.signature)),
    ].sort((a, b) => b.timestamp - a.timestamp);

    // Dedupe by wallet (show 1 trade per wallet)
    const seen = new Set<string>();
    return combined
      .filter(t => {
        if (seen.has(t.wallet)) return false;
        seen.add(t.wallet);
        return true;
      })
      .slice(0, 6);
  }, [liveTrades]);

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

  const formatUSD = (val: string) => {
    // walletValue is like "$32.3M" — use it directly as trade value display
    return val || '';
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
            {TOTAL_TRACKED_WALLETS} crypto wallets · 125 politicians · real-time alerts
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/whales" style={{
              background: '#fff',
              color: '#000',
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

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '10px',
            }}>
              {whaleTrades.map((trade, i) => {
                const isFollowing = isFollowingWhale(trade.wallet);
                const shortAddr = trade.wallet.slice(0, 6) + '...' + trade.wallet.slice(-4);
                return (
                  <div key={i} style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}>
                    {/* Row 1: Token + Action badge + Follow */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700' }}>{trade.tokenSymbol}</span>
                        <span style={{
                          background: trade.action === 'BUY' ? '#064e3b' : '#7f1d1d',
                          color: trade.action === 'BUY' ? '#4ade80' : '#f87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          {trade.action}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleWhale(trade.wallet)}
                        style={{
                          background: isFollowing ? FOLLOW_BUTTON.activeBg : FOLLOW_BUTTON.inactiveBg,
                          color: isFollowing ? FOLLOW_BUTTON.activeColor : FOLLOW_BUTTON.inactiveColor,
                          border: isFollowing ? FOLLOW_BUTTON.activeBorder : FOLLOW_BUTTON.inactiveBorder,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {isFollowing ? '✓' : '+'}
                      </button>
                    </div>
                    {/* Row 2: Trade value — the hero number */}
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>
                        {trade.walletValue || formatSol(trade.solAmount) || '—'}
                      </span>
                    </div>
                    {/* Row 3: Wallet + time */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link href={`/wallet/${trade.wallet}`} style={{ color: '#666', fontSize: '12px', textDecoration: 'none' }}>
                        {shortAddr}
                      </Link>
                      <span style={{ color: '#555', fontSize: '11px' }}>
                        {formatTime(trade.timestamp)}
                      </span>
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '10px',
            }}>
              {congressTrades.slice(0, 3).map((trade, i) => (
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

      <FollowToast message={toast.message} show={toast.show} />
      <Footer />
    </>
  );
}
