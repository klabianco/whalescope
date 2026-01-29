'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EmailCapture } from '../components/EmailCapture';
import { useAuth } from '../providers/AuthProvider';
import {
  FilterTabs,
  ProUpsellBanner,
  TradeCard,
  TradeFeedList,
  type FilterTab,
} from '../components/TradeFeed';
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

const ACTION_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  BUY: { bg: '#064e3b', color: '#4ade80', label: 'BUY' },
  SELL: { bg: '#7f1d1d', color: '#f87171', label: 'SELL' },
  TRANSFER: { bg: '#1e1b4b', color: '#a78bfa', label: 'TRANSFER' },
  UNKNOWN: { bg: '#333', color: '#888', label: '???' },
};

function isRecentTrade(trade: WhaleTrade): boolean {
  const now = Date.now() / 1000;
  return (now - trade.timestamp) < 24 * 60 * 60;
}

function formatTime(ts: number): string {
  const date = new Date(ts * 1000);
  const diffMs = Date.now() - date.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'Yesterday';
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

export default function WhalesPage() {
  const [filter, setFilter] = useState('all');

  let isPro = false;
  try {
    const auth = useAuth();
    isPro = auth.isPro;
  } catch {}

  const recentTradeCount = useMemo(() => TRADES.filter(isRecentTrade).length, []);
  const uniqueWhales = useMemo(() => new Set(TRADES.map(t => t.wallet)).size, []);

  const filteredTrades = TRADES.filter(t => {
    if (!isPro && isRecentTrade(t)) return false;
    if (filter === 'buy') return t.action === 'BUY';
    if (filter === 'sell') return t.action === 'SELL';
    if (filter === 'transfer') return t.action === 'TRANSFER';
    return true;
  });

  const tabs: FilterTab[] = [
    { key: 'all', label: 'All Trades' },
    { key: 'buy', label: 'Buys' },
    { key: 'sell', label: 'Sells' },
    { key: 'transfer', label: 'Transfers' },
  ];

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Whale Tracker</h1>
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
          flexWrap: 'wrap',
        }}>
          {[
            { value: uniqueWhales, label: 'Whales Tracked', color: '#fff' },
            { value: TRADES.length, label: 'Recent Trades', color: '#fff' },
            { value: TRADES.filter(t => t.action === 'BUY').length, label: 'Buys', color: '#4ade80' },
          ].map(({ value, label, color }) => (
            <div key={label} style={{
              background: '#111118',
              border: '1px solid #222',
              borderRadius: '8px',
              padding: '10px 16px',
              textAlign: 'center',
              minWidth: '120px',
            }}>
              <div style={{ color, fontSize: '20px', fontWeight: '700' }}>{value}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pro Upsell */}
        {!isPro && (
          <ProUpsellBanner
            count={recentTradeCount}
            label="whale trade"
            description="Pro members see whale moves instantly. Free users get a 24h delay."
          />
        )}

        {/* Filter Tabs */}
        <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />

        {/* Trade Feed */}
        <TradeFeedList
          trades={filteredTrades}
          isPro={isPro}
          emptyMessage="No trades found for this filter."
          renderCard={(trade, i) => {
            const badge = ACTION_BADGES[trade.action] || ACTION_BADGES.UNKNOWN;
            const symbol = trade.tokenSymbol || (trade.tokenMint ? shortAddress(trade.tokenMint) : '???');
            const displayName = trade.walletLabel || shortAddress(trade.wallet);

            return (
              <TradeCard
                key={`${trade.signature}-${i}`}
                badge={badge}
                actor={displayName}
                actorHref={`/wallet/${trade.wallet}`}
                actorMeta={<span style={{ color: '#555' }}>{trade.walletValue}</span>}
                timestamp={formatTime(trade.timestamp)}
                highlight={symbol}
                highlightMeta={trade.description ? trade.description.slice(0, 60) : undefined}
                bottomRight={
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontWeight: '500' }}>
                      {trade.tokenAmount !== undefined
                        ? `${formatAmount(trade.tokenAmount)} ${symbol}`
                        : '—'}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      <a
                        href={`https://solscan.io/tx/${trade.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa', textDecoration: 'none' }}
                      >
                        View on Solscan ↗
                      </a>
                    </div>
                  </div>
                }
              />
            );
          }}
        />

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
          textAlign: 'center',
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
