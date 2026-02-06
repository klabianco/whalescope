'use client';

import { useState, useMemo } from 'react';

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
  soldSymbol?: string;
  soldAmount?: number;
  boughtSymbol?: string;
  boughtAmount?: number;
}

interface WalletStats {
  last5Trades: WhaleTrade[];
  tradeCount30d: number;
  avgHoldTimeDays: number | null;
  winRate: number | null;
  totalWins: number;
  totalLosses: number;
  favoriteToken: string | null;
}

export function calculateWalletStats(
  walletAddress: string,
  allTrades: WhaleTrade[],
  tokenPrices?: Record<string, number>
): WalletStats {
  const walletTrades = allTrades
    .filter(t => t.wallet === walletAddress)
    .sort((a, b) => b.timestamp - a.timestamp);

  const now = Date.now() / 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const tradesLast30d = walletTrades.filter(t => t.timestamp > thirtyDaysAgo);

  // Last 5 trades
  const last5Trades = walletTrades.slice(0, 5);

  // Favorite token (most traded)
  const tokenCounts: Record<string, number> = {};
  walletTrades.forEach(t => {
    const sym = t.tokenSymbol || t.boughtSymbol || t.soldSymbol;
    if (sym && sym !== 'SOL' && sym !== 'USDC' && sym !== 'USDT') {
      tokenCounts[sym] = (tokenCounts[sym] || 0) + 1;
    }
  });
  const favoriteToken = Object.entries(tokenCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Win rate calculation (simplified: compare buy price to later sell price for same token)
  let wins = 0;
  let losses = 0;
  const buysByToken: Record<string, { timestamp: number; amount: number; price: number }[]> = {};

  for (const trade of walletTrades.slice().reverse()) { // oldest first
    const sym = trade.tokenSymbol || trade.boughtSymbol;
    if (!sym) continue;

    if (trade.action === 'BUY') {
      if (!buysByToken[sym]) buysByToken[sym] = [];
      // Estimate price from USD value if available, or from SOL amount
      const usdVal = trade.solAmount && tokenPrices?.['SOL'] 
        ? trade.solAmount * tokenPrices['SOL']
        : 0;
      const pricePerToken = trade.tokenAmount && usdVal > 0 
        ? usdVal / trade.tokenAmount 
        : 0;
      buysByToken[sym].push({
        timestamp: trade.timestamp,
        amount: trade.tokenAmount || 0,
        price: pricePerToken,
      });
    } else if (trade.action === 'SELL' && buysByToken[sym]?.length) {
      // Match with earliest buy (FIFO)
      const buy = buysByToken[sym].shift();
      if (buy && buy.price > 0) {
        const sellUsdVal = trade.solAmount && tokenPrices?.['SOL']
          ? trade.solAmount * tokenPrices['SOL']
          : 0;
        const sellPricePerToken = trade.tokenAmount && sellUsdVal > 0
          ? sellUsdVal / trade.tokenAmount
          : 0;
        
        if (sellPricePerToken > buy.price) {
          wins++;
        } else if (sellPricePerToken < buy.price && sellPricePerToken > 0) {
          losses++;
        }
      }
    }
  }

  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

  // Average hold time (time between buys and sells of same token)
  const holdTimes: number[] = [];
  const buyTimestamps: Record<string, number[]> = {};
  
  for (const trade of walletTrades.slice().reverse()) {
    const sym = trade.tokenSymbol || trade.boughtSymbol;
    if (!sym) continue;

    if (trade.action === 'BUY') {
      if (!buyTimestamps[sym]) buyTimestamps[sym] = [];
      buyTimestamps[sym].push(trade.timestamp);
    } else if (trade.action === 'SELL' && buyTimestamps[sym]?.length) {
      const buyTs = buyTimestamps[sym].shift();
      if (buyTs) {
        holdTimes.push(trade.timestamp - buyTs);
      }
    }
  }

  const avgHoldTimeDays = holdTimes.length > 0
    ? (holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length) / (24 * 60 * 60)
    : null;

  return {
    last5Trades,
    tradeCount30d: tradesLast30d.length,
    avgHoldTimeDays,
    winRate,
    totalWins: wins,
    totalLosses: losses,
    favoriteToken,
  };
}

function formatTimeAgo(ts: number): string {
  const now = Date.now() / 1000;
  const diff = now - ts;
  const hours = diff / 3600;
  if (hours < 1) return `${Math.floor(diff / 60)}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return 'Yesterday';
  return `${Math.floor(hours / 24)}d ago`;
}

function formatAmount(amount?: number): string {
  if (!amount) return '?';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(1) + 'K';
  if (amount >= 1) return amount.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return amount.toFixed(4);
}

export function WalletPatternsTooltip({
  stats,
  isOpen,
  onClose,
}: {
  stats: WalletStats;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: '#1a1a2e',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '8px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Stats summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{ background: '#111118', padding: '10px 12px', borderRadius: '8px' }}>
          <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>
            30d Trades
          </div>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
            {stats.tradeCount30d}
          </div>
        </div>
        {stats.winRate !== null && (
          <div style={{ background: '#111118', padding: '10px 12px', borderRadius: '8px' }}>
            <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Win Rate
            </div>
            <div style={{ 
              color: stats.winRate >= 50 ? '#4ade80' : '#f87171', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              {stats.winRate.toFixed(0)}%
              <span style={{ color: '#666', fontSize: '11px', marginLeft: '4px' }}>
                ({stats.totalWins}W/{stats.totalLosses}L)
              </span>
            </div>
          </div>
        )}
        {stats.avgHoldTimeDays !== null && (
          <div style={{ background: '#111118', padding: '10px 12px', borderRadius: '8px' }}>
            <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Avg Hold
            </div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
              {stats.avgHoldTimeDays < 1 
                ? `${Math.round(stats.avgHoldTimeDays * 24)}h`
                : `${stats.avgHoldTimeDays.toFixed(1)}d`}
            </div>
          </div>
        )}
        {stats.favoriteToken && (
          <div style={{ background: '#111118', padding: '10px 12px', borderRadius: '8px' }}>
            <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Top Token
            </div>
            <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: '600' }}>
              {stats.favoriteToken}
            </div>
          </div>
        )}
      </div>

      {/* Recent trades */}
      <div>
        <div style={{ 
          color: '#888', 
          fontSize: '12px', 
          textTransform: 'uppercase', 
          marginBottom: '8px',
          letterSpacing: '0.5px',
        }}>
          Recent Activity
        </div>
        {stats.last5Trades.length === 0 ? (
          <div style={{ color: '#666', fontSize: '13px' }}>No recent trades</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {stats.last5Trades.map((trade, i) => {
              const symbol = trade.tokenSymbol || trade.boughtSymbol || trade.soldSymbol || 'Unknown';
              const isBuy = trade.action === 'BUY';
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                }}>
                  <span style={{
                    background: isBuy ? '#064e3b' : '#7f1d1d',
                    color: isBuy ? '#4ade80' : '#f87171',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    width: '36px',
                    textAlign: 'center',
                  }}>
                    {trade.action}
                  </span>
                  <span style={{ color: '#fff', fontWeight: '500' }}>
                    {formatAmount(trade.tokenAmount)} {symbol}
                  </span>
                  <span style={{ color: '#666', marginLeft: 'auto', fontSize: '12px' }}>
                    {formatTimeAgo(trade.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Close hint */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '12px', 
        color: '#555', 
        fontSize: '11px',
        cursor: 'pointer',
      }} onClick={onClose}>
        Click anywhere to close
      </div>
    </div>
  );
}

export function WalletPatternsBadge({
  stats,
  onClick,
}: {
  stats: WalletStats;
  onClick?: () => void;
}) {
  // Show a compact badge summarizing the wallet's pattern
  const frequencyLabel = stats.tradeCount30d >= 20 
    ? '🔥 Active' 
    : stats.tradeCount30d >= 5 
      ? '📊 Regular'
      : stats.tradeCount30d > 0
        ? '💤 Quiet'
        : null;

  if (!frequencyLabel && stats.winRate === null) return null;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(74, 222, 128, 0.1)',
        border: '1px solid rgba(74, 222, 128, 0.2)',
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '11px',
        color: '#4ade80',
        cursor: 'pointer',
      }}
    >
      {frequencyLabel && <span>{frequencyLabel}</span>}
      {stats.winRate !== null && (
        <span style={{ 
          color: stats.winRate >= 50 ? '#4ade80' : '#fbbf24',
        }}>
          {stats.winRate.toFixed(0)}% WR
        </span>
      )}
      <span style={{ color: '#666' }}>▼</span>
    </button>
  );
}

// Hook to get wallet stats with memoization
export function useWalletStats(
  walletAddress: string,
  allTrades: WhaleTrade[],
  tokenPrices?: Record<string, number>
): WalletStats {
  return useMemo(
    () => calculateWalletStats(walletAddress, allTrades, tokenPrices),
    [walletAddress, allTrades, tokenPrices]
  );
}
