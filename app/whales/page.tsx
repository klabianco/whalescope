'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EmailCapture } from '../components/EmailCapture';
import { useAuth } from '../providers/AuthProvider';
import tradesData from '../../data/whale-trades.json';

interface WhaleTrade {
  wallet: string;
  walletLabel: string;
  walletValue: string;
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenMint?: string;
  tokenSymbol?: string;
  tokenAmount?: number;
  solAmount?: number;
  action: 'BUY' | 'SELL' | 'TRANSFER' | 'UNKNOWN';
}

const TRADES: WhaleTrade[] = (tradesData as WhaleTrade[])
  .sort((a, b) => b.timestamp - a.timestamp);

const TRADES_PER_PAGE = 25;

function isRecentTrade(trade: WhaleTrade): boolean {
  const now = Date.now() / 1000;
  return (now - trade.timestamp) < 24 * 60 * 60;
}

function formatTime(ts: number): string {
  const date = new Date(ts * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  
  if (diffH < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `${mins}m ago`;
  }
  if (diffH < 24) {
    return `${Math.floor(diffH)}h ago`;
  }
  if (diffH < 48) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAmount(amount?: number): string {
  if (!amount) return '?';
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(2) + 'B';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(2) + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(1) + 'K';
  if (amount >= 1) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return amount.toFixed(6);
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const ACTION_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  BUY: { bg: '#064e3b', color: '#4ade80', label: 'BUY' },
  SELL: { bg: '#7f1d1d', color: '#f87171', label: 'SELL' },
  TRANSFER: { bg: '#1e1b4b', color: '#a78bfa', label: 'TRANSFER' },
  UNKNOWN: { bg: '#333', color: '#888', label: '???' },
};

export default function WhalesPage() {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'transfer'>('all');
  const [visibleCount, setVisibleCount] = useState(TRADES_PER_PAGE);

  let isPro = false;
  try {
    const auth = useAuth();
    isPro = auth.isPro;
  } catch {}

  const recentTradeCount = useMemo(() => TRADES.filter(isRecentTrade).length, []);
  const FREE_TRADE_LIMIT = 25;

  const filteredTrades = TRADES.filter(t => {
    if (!isPro && isRecentTrade(t)) return false;
    if (filter === 'buy') return t.action === 'BUY';
    if (filter === 'sell') return t.action === 'SELL';
    if (filter === 'transfer') return t.action === 'TRANSFER';
    return true;
  });

  const visibleTrades = isPro ? filteredTrades : filteredTrades.slice(0, FREE_TRADE_LIMIT);
  const hiddenTradeCount = isPro ? 0 : Math.max(0, filteredTrades.length - FREE_TRADE_LIMIT);

  // Unique whales
  const uniqueWhales = useMemo(() => new Set(TRADES.map(t => t.wallet)).size, []);

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            Whale Tracker
          </h1>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            Real-time trades from the biggest wallets on Solana
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/search" style={{ color: '#4ade80', textDecoration: 'none' }}>
              Search Tokens →
            </Link>
            <Link href="/watchlist" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Your Watchlist →
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            background: '#111118', 
            border: '1px solid #222', 
            borderRadius: '8px', 
            padding: '10px 16px',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>{uniqueWhales}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>Whales Tracked</div>
          </div>
          <div style={{ 
            background: '#111118', 
            border: '1px solid #222', 
            borderRadius: '8px', 
            padding: '10px 16px',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>{TRADES.length}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>Recent Trades</div>
          </div>
          <div style={{ 
            background: '#111118', 
            border: '1px solid #222', 
            borderRadius: '8px', 
            padding: '10px 16px',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: '700' }}>
              {TRADES.filter(t => t.action === 'BUY').length}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>Buys</div>
          </div>
        </div>

        {/* Pro upsell for recent trades */}
        {!isPro && recentTradeCount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
          <div>
            <p style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', margin: 0 }}>
              🔒 {recentTradeCount} whale trade{recentTradeCount > 1 ? 's' : ''} in the last 24h
            </p>
            <p style={{ color: '#71717a', fontSize: '13px', margin: '4px 0 0' }}>
              Pro members see whale moves instantly. Free users get a 24h delay.
            </p>
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#22c55e',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>
              Upgrade to Pro
            </button>
          </Link>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {(['all', 'buy', 'sell', 'transfer'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setVisibleCount(TRADES_PER_PAGE); }}
              style={{
                padding: '8px 16px',
                background: filter === f ? '#4ade80' : '#222',
                color: filter === f ? '#000' : '#888',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All Trades' : 
               f === 'buy' ? 'Buys' :
               f === 'sell' ? 'Sells' : 'Transfers'}
            </button>
          ))}
        </div>

        {/* Trades Feed */}
        {filteredTrades.length === 0 ? (
          <div style={{ 
            background: '#111118', 
            padding: '40px', 
            borderRadius: '12px',
            textAlign: 'center',
            color: '#666'
          }}>
            No trades found for this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visibleTrades.slice(0, visibleCount).map((trade, i) => {
              const actionStyle = ACTION_STYLES[trade.action] || ACTION_STYLES.UNKNOWN;
              const symbol = trade.tokenSymbol || (trade.tokenMint ? shortAddress(trade.tokenMint) : '???');
              const displayName = trade.walletLabel || shortAddress(trade.wallet);

              return (
                <div key={`${trade.signature}-${i}`} style={{
                  background: '#111118',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  padding: '16px 20px',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: actionStyle.bg,
                        color: actionStyle.color,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {actionStyle.label}
                      </span>
                      <div>
                        <Link 
                          href={`/wallet/${trade.wallet}`}
                          style={{ color: '#fff', fontWeight: '600', textDecoration: 'none' }}
                        >
                          {displayName}
                        </Link>
                        <span style={{ color: '#555', fontSize: '12px', marginLeft: '8px' }}>
                          {trade.walletValue}
                        </span>
                      </div>
                    </div>
                    <span style={{ color: '#666', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatTime(trade.timestamp)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '18px' }}>
                        {symbol}
                      </span>
                      {trade.tokenAmount !== undefined && (
                        <span style={{ color: '#888', marginLeft: '8px' }}>
                          {formatAmount(trade.tokenAmount)} {symbol}
                        </span>
                      )}
                    </div>
                    <a
                      href={`https://solscan.io/tx/${trade.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}
                    >
                      View tx ↗
                    </a>
                  </div>
                </div>
              );
            })}

            {visibleCount < visibleTrades.length && (
              <button
                onClick={() => setVisibleCount(v => v + TRADES_PER_PAGE)}
                style={{
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#4ade80',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '8px',
                  width: '100%',
                }}
              >
                Show More ({visibleTrades.length - visibleCount} remaining)
              </button>
            )}

            {!isPro && hiddenTradeCount > 0 && visibleCount >= visibleTrades.length && (
              <Link href="/pricing" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, #111118 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}>
                  <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: '600', margin: '0 0 4px' }}>
                    🔒 {hiddenTradeCount} more trade{hiddenTradeCount > 1 ? 's' : ''} available with Pro
                  </p>
                  <p style={{ color: '#71717a', fontSize: '13px', margin: 0 }}>
                    Get full trade history, real-time alerts, and analytics →
                  </p>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Email Capture */}
        <div style={{ marginTop: '40px' }}>
          <EmailCapture 
            source="whales"
            headline="Get whale trade alerts"
            subtext="Know when big wallets move — delivered free to your inbox."
            buttonText="Get Free Alerts"
          />
        </div>

        {/* Data Notice */}
        <div style={{
          background: '#1a1a2e',
          padding: '16px 20px',
          borderRadius: '12px',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#888', fontSize: '13px' }}>
            Tracking {uniqueWhales} whale wallets on Solana · Data from on-chain transactions ·{' '}
            <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Solscan
            </a>
            <br />
            <span style={{ color: '#4ade80' }}>Updated daily</span>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
