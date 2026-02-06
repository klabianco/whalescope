'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EmailCapture } from '../components/EmailCapture';
import { FollowToast } from '../components/FollowToast';
import { FOLLOW_BUTTON } from '../config/theme';
import { useFollows } from '../hooks/useFollows';
import {
  FilterTabs,
  TradeCard,
  TradeFeedList,
  type FilterTab,
} from '../components/TradeFeed';
import {
  calculateWalletStats,
  WalletPatternsBadge,
  WalletPatternsTooltip,
} from '../components/WalletPatterns';
import {
  AIInsightPanel,
  generateTradeInsight,
  TradeInsightBadge,
} from '../components/AITradeInsight';
import tradesData from '../../data/whale-trades.json';
import whaleWalletsData from '../../data/whale-wallets.json';

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

// --- Filtering: keep raw data intact, exclude bots & protocols at UI layer ---
const BOT_KEYWORDS = ['bot', 'automated', 'liquidit'];

// Build set of wallet addresses to exclude (protocols + bots by name)
const EXCLUDED_WALLETS = new Set(
  (whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets
    .filter(w =>
      w.type === 'protocol' ||
      BOT_KEYWORDS.some(kw => w.name.toLowerCase().includes(kw))
    )
    .map(w => w.address)
);

// Also detect bot-pattern wallets from trade data: 40+ trades in ≤2 unique tokens
const _walletTokens: Record<string, Set<string>> = {};
const _walletCounts: Record<string, number> = {};
(tradesData as WhaleTrade[]).forEach(t => {
  _walletCounts[t.wallet] = (_walletCounts[t.wallet] || 0) + 1;
  if (!_walletTokens[t.wallet]) _walletTokens[t.wallet] = new Set();
  if (t.tokenSymbol) _walletTokens[t.wallet].add(t.tokenSymbol);
});
Object.entries(_walletCounts).forEach(([addr, count]) => {
  if (count >= 40 && (_walletTokens[addr]?.size || 0) <= 2) {
    EXCLUDED_WALLETS.add(addr);
  }
});

// Also exclude trades with bot-like labels not in whale-wallets.json
function isBotLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return BOT_KEYWORDS.some(kw => lower.includes(kw));
}

const ALL_TRADES: WhaleTrade[] = (tradesData as WhaleTrade[])
  .filter(t => t.action === 'BUY' || t.action === 'SELL')
  .filter(t => !EXCLUDED_WALLETS.has(t.wallet) && !isBotLabel(t.walletLabel))
  .sort((a, b) => b.timestamp - a.timestamp);

const ACTION_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  BUY: { bg: '#064e3b', color: '#4ade80', label: 'BUY' },
  SELL: { bg: '#7f1d1d', color: '#f87171', label: 'SELL' },
};


function formatDate(ts: number): string {
  const date = new Date(ts * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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

function formatUSD(value: number): string {
  if (value >= 1_000_000) return '$' + (value / 1_000_000).toFixed(2) + 'M';
  if (value >= 1_000) return '$' + (value / 1_000).toFixed(1) + 'K';
  if (value >= 1) return '$' + value.toFixed(2);
  if (value > 0) return '<$1';
  return '';
}

// Known stablecoin mints (USDC, USDT) — value ≈ $1
const STABLECOIN_SYMBOLS = new Set(['USDC', 'USDT', 'UST', 'DAI', 'BUSD', 'PYUSD']);

// Collect all unique token mints from trade data
const ALL_MINTS = [...new Set(
  (tradesData as WhaleTrade[])
    .map(t => t.tokenMint)
    .filter((m): m is string => !!m)
)];

interface TokenInfo {
  symbol: string;
  name: string;
  price: number;
}

// Fetch token names + prices from DexScreener (covers pump.fun, all Solana tokens)
async function fetchTokenData(): Promise<Record<string, TokenInfo>> {
  const tokenMap: Record<string, TokenInfo> = {};
  try {
    // DexScreener batch: ~20 mints per request to avoid URL length limits
    for (let i = 0; i < ALL_MINTS.length; i += 20) {
      const batch = ALL_MINTS.slice(i, i + 20);
      const url = `https://api.dexscreener.com/tokens/v1/solana/${batch.join(',')}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const pair of data) {
          const bt = pair.baseToken;
          if (!bt?.address || tokenMap[bt.address]) continue;
          tokenMap[bt.address] = {
            symbol: bt.symbol || '',
            name: bt.name || '',
            price: pair.priceUsd ? parseFloat(pair.priceUsd) : 0,
          };
        }
      }
    }
  } catch {}
  return tokenMap;
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Build a lookup of wallet address → best display name from whale DB
const WALLET_LABELS: Record<string, string> = {};
(whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets.forEach(w => {
  const name = w.name || '';
  // If the name is just a truncated address, skip it
  if (!name || name.includes('...')) return;
  WALLET_LABELS[w.address] = name;
});

function getWalletDisplayName(address: string, tradeLabel: string, tradeValue: string): string {
  // Use real DB label if available
  if (WALLET_LABELS[address]) return WALLET_LABELS[address];
  // If trade label is a real name (not truncated address), use it
  if (tradeLabel && !tradeLabel.includes('...')) return tradeLabel;
  // Otherwise, create a value-based label like "$32M Whale"
  if (tradeValue) {
    return `${tradeValue} Whale`;
  }
  return shortAddress(address);
}

export default function WhalesPage() {
  const [filter, setFilter] = useState('all');
  const { toast, toggleWhale, isFollowingWhale, limitHit, FREE_FOLLOW_LIMIT } = useFollows();
  const [tokenData, setTokenData] = useState<Record<string, TokenInfo>>({});
  const [liveTrades, setLiveTrades] = useState<WhaleTrade[]>([]);
  const [liveSource, setLiveSource] = useState<'static' | 'live'>('static');
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenData().then(setTokenData);

    // Fetch live trades from Supabase (webhook data)
    fetch('/api/whale-trades?limit=200')
      .then(res => res.json())
      .then(data => {
        if (data.trades && data.trades.length > 0) {
          setLiveTrades(data.trades);
          setLiveSource('live');
        }
      })
      .catch(() => {});
  }, []);

  // Get resolved token symbol from DexScreener data
  function getTokenSymbol(trade: WhaleTrade): string {
    // Use DexScreener name if available
    if (trade.tokenMint && tokenData[trade.tokenMint]?.symbol) {
      return tokenData[trade.tokenMint].symbol;
    }
    // Fallback to trade data symbol
    const rawSymbol = trade.tokenSymbol || '';
    if (rawSymbol && rawSymbol.length <= 10 && !rawSymbol.includes('...')) {
      return rawSymbol;
    }
    // Last resort: last 4 chars of mint
    return trade.tokenMint ? `...${trade.tokenMint.slice(-4)}` : '???';
  }

  // Compute raw USD value for a trade (number, for filtering + display)
  function getTradeUSDRaw(trade: WhaleTrade): number {
    const amt = trade.tokenAmount;
    if (!amt) return 0;
    const sym = trade.tokenSymbol || '';

    // Stablecoins: $1 each
    if (STABLECOIN_SYMBOLS.has(sym)) return amt;

    // DexScreener price by mint
    if (trade.tokenMint && tokenData[trade.tokenMint]?.price) {
      return amt * tokenData[trade.tokenMint].price;
    }

    // Fallback: SOL amount on the trade (swap counterpart)
    const solMint = 'So11111111111111111111111111111111111111112';
    if (trade.solAmount && trade.solAmount > 0.001 && tokenData[solMint]?.price) {
      return trade.solAmount * tokenData[solMint].price;
    }

    // Fallback: extract USD from description (swaps mentioning USDC/USDT)
    const desc = trade.description || '';
    const usdcMatch = desc.match(/(\d+(?:\.\d+)?)\s*(?:USDC|USDT)/);
    if (usdcMatch) return parseFloat(usdcMatch[1]);

    return 0;
  }

  function getTradeUSD(trade: WhaleTrade): string {
    const val = getTradeUSDRaw(trade);
    return val > 0 ? formatUSD(val) : '';
  }

  // Total wallets in our database (not just those with recent trades)
  const totalTrackedWallets = (whaleWalletsData as { wallets: { address: string; name: string; type: string }[] }).wallets.length;
  const uniqueWhales = totalTrackedWallets;

  // Most active whales (last 30 days)
  const topWhales = useMemo(() => {
    const oneMonthAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
    const counts: Record<string, { label: string; value: string; count: number }> = {};
    ALL_TRADES.filter(t => t.timestamp > oneMonthAgo).forEach(t => {
      if (!counts[t.wallet]) counts[t.wallet] = { label: t.walletLabel, value: t.walletValue, count: 0 };
      counts[t.wallet].count++;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([address, info]) => ({ address, ...info }));
  }, []);

  // Merge live trades with static — prefer live data, fall back to static
  const mergedTrades = useMemo(() => {
    if (liveTrades.length === 0) return ALL_TRADES;

    // Build a set of signatures from live data
    const liveSigs = new Set(liveTrades.map(t => t.signature));

    // Live trades first, then static trades not in live data
    const combined = [
      ...liveTrades.filter(t => t.action === 'BUY' || t.action === 'SELL')
        .filter(t => !EXCLUDED_WALLETS.has(t.wallet) && !isBotLabel(t.walletLabel)),
      ...ALL_TRADES.filter(t => !liveSigs.has(t.signature)),
    ];

    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [liveTrades]);

  // Limit trades per wallet to prevent one whale dominating the entire feed
  const MAX_TRADES_PER_WALLET = 5;
  const filteredTrades = (() => {
    const walletCounts: Record<string, number> = {};
    return mergedTrades.filter(t => {
      if (filter === 'buy' && t.action !== 'BUY') return false;
      if (filter === 'sell' && t.action !== 'SELL') return false;
      // Filter out small trades — whale tracker should only show significant moves
      const usd = getTradeUSDRaw(t);
      if (usd > 0 && usd < 1000) return false;
      // Per-wallet limit for feed diversity
      walletCounts[t.wallet] = (walletCounts[t.wallet] || 0) + 1;
      if (walletCounts[t.wallet] > MAX_TRADES_PER_WALLET) return false;
      return true;
    });
  })();

  const tabs: FilterTab[] = [
    { key: 'all', label: 'All Trades' },
    { key: 'buy', label: 'Buys' },
    { key: 'sell', label: 'Sells' },
  ];

  // Calculate wallet patterns for all unique wallets (memoized)
  const walletPatternsMap = useMemo(() => {
    const patterns = new Map<string, ReturnType<typeof calculateWalletStats>>();
    const uniqueWallets = [...new Set(mergedTrades.map(t => t.wallet))];
    const solPrice = tokenData['So11111111111111111111111111111111111111112']?.price || 0;
    
    for (const wallet of uniqueWallets) {
      patterns.set(wallet, calculateWalletStats(
        wallet,
        tradesData as WhaleTrade[],
        { SOL: solPrice }
      ));
    }
    return patterns;
  }, [mergedTrades, tokenData]);

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Crypto Tracker</h1>
          <p style={{ color: '#888', marginBottom: '8px' }}>
            Real-time trades from the biggest wallets on Solana
          </p>
          <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
            Tracking {uniqueWhales} wallets
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

        {/* Watchlist Limit Warning */}
        {limitHit && (
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
            gap: '8px',
          }}>
            <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0 }}>
              Free plan limit: {FREE_FOLLOW_LIMIT} watchlist slots. Upgrade for unlimited.
            </p>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#fbbf24', color: '#000', border: 'none', borderRadius: '6px',
                padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}>Upgrade to Pro</button>
            </Link>
          </div>
        )}

        {/* Most Active Whales */}
        {topWhales.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#fff' }}>
              Most Active Whales
            </h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {topWhales.map((whale) => {
                const isFollowing = isFollowingWhale(whale.address);
                const displayName = getWalletDisplayName(whale.address, whale.label, whale.value);
                return (
                  <div
                    key={whale.address}
                    style={{
                      background: '#111118',
                      border: '1px solid #222',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      minWidth: '160px',
                      maxWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => toggleWhale(whale.address)}
                      style={{
                        padding: '4px 10px',
                        background: isFollowing ? FOLLOW_BUTTON.activeBg : FOLLOW_BUTTON.inactiveBg,
                        color: isFollowing ? FOLLOW_BUTTON.activeColor : FOLLOW_BUTTON.inactiveColor,
                        border: isFollowing ? FOLLOW_BUTTON.activeBorder : FOLLOW_BUTTON.inactiveBorder,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      {isFollowing ? '✓ Following' : 'Follow'}
                    </button>
                    <Link
                      href={`/wallet/${whale.address}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{displayName}</span>
                    </Link>
                    <div style={{ color: '#888', fontSize: '13px' }}>
                      {whale.count} trades
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time delay notice */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, #111118 100%)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>&#x23F3;</span>
            <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
              Free tier: <strong style={{ color: '#fbbf24' }}>24h delayed</strong>. Pro members see trades in real time.
            </span>
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <span style={{
              background: '#22c55e',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}>
              Upgrade to Pro
            </span>
          </Link>
        </div>

        {/* AI Insight Panel */}
        <AIInsightPanel
          trades={filteredTrades.slice(0, 50)}
          getUsdValue={getTradeUSDRaw}
          walletPatterns={walletPatternsMap}
          limit={5}
        />

        {/* Filter Tabs */}
        <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />

        {/* Trade Feed */}
        <TradeFeedList
          trades={filteredTrades}
          isPro={false}
          emptyMessage="No trades found for this filter."
          renderCard={(trade, i) => {
            const badge = ACTION_BADGES[trade.action] || { bg: '#333', color: '#888', label: '?' };
            const symbol = getTokenSymbol(trade);
            // In the trade feed, show short address to avoid repeating "$27.4M Whale" on every row
            // The wallet display name is used in the "Most Active Whales" section instead
            const displayName = shortAddress(trade.wallet);
            const isFollowing = isFollowingWhale(trade.wallet);
            const walletStats = walletPatternsMap.get(trade.wallet);
            const tradeUsd = getTradeUSDRaw(trade);
            const aiInsight = tradeUsd >= 10000 && walletStats
              ? generateTradeInsight(trade, tradeUsd, walletStats, filteredTrades)
              : null;
            const isExpanded = expandedWallet === trade.wallet;

            return (
              <div key={`${trade.signature}-${i}`} style={{ position: 'relative' }}>
                <TradeCard
                  followButton={
                    <button
                      onClick={() => {
                        toggleWhale(trade.wallet);
                      }}
                      style={{
                        padding: '4px 10px',
                        background: isFollowing ? FOLLOW_BUTTON.activeBg : FOLLOW_BUTTON.inactiveBg,
                        color: isFollowing ? FOLLOW_BUTTON.activeColor : FOLLOW_BUTTON.inactiveColor,
                        border: isFollowing ? FOLLOW_BUTTON.activeBorder : FOLLOW_BUTTON.inactiveBorder,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {isFollowing ? '✓ Following' : 'Follow'}
                    </button>
                  }
                  actor={displayName}
                  actorHref={`/wallet/${trade.wallet}`}
                  badge={badge}
                  asset={symbol}
                  amount={
                    trade.tokenAmount !== undefined
                      ? `${formatAmount(trade.tokenAmount)} ${symbol}`
                      : '—'
                  }
                  usdValue={getTradeUSD(trade)}
                  date={formatDate(trade.timestamp)}
                  txUrl={`https://solscan.io/tx/${trade.signature}`}
                  extras={
                    walletStats && (walletStats.tradeCount30d > 0 || walletStats.winRate !== null) ? (
                      <WalletPatternsBadge
                        stats={walletStats}
                        onClick={() => setExpandedWallet(isExpanded ? null : trade.wallet)}
                      />
                    ) : undefined
                  }
                />
                {/* Inline AI insight for significant trades */}
                {aiInsight && (
                  <TradeInsightBadge insight={aiInsight} />
                )}
                {/* Expandable wallet history */}
                {walletStats && (
                  <WalletPatternsTooltip
                    stats={walletStats}
                    isOpen={isExpanded}
                    onClose={() => setExpandedWallet(null)}
                  />
                )}
              </div>
            );
          }}
        />

        {/* Email Capture */}
        <div id="email-capture-bottom" style={{ marginTop: '40px' }}>
          <EmailCapture
            source="whales"
            headline="Get whale trade alerts"
            subtext="Know when big wallets move -- delivered free to your inbox. Join 200+ traders."
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
            <span style={{ color: '#4ade80' }}>
              {liveSource === 'live' ? '🟢 Live data' : 'Updated daily'}
            </span>
          </p>
        </div>
      </main>
      <FollowToast message={toast.message} show={toast.show} />
      <Footer />
    </>
  );
}
