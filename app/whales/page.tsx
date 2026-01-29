'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EmailCapture } from '../components/EmailCapture';
import { FOLLOW_BUTTON } from '../config/theme';
import {
  FilterTabs,
  TradeCard,
  TradeFeedList,
  type FilterTab,
} from '../components/TradeFeed';
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

const FREE_WATCHLIST_LIMIT = 3;

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

export default function WhalesPage() {
  const [filter, setFilter] = useState('all');
  const { publicKey, connected } = useWallet();
  const [followingWallets, setFollowingWallets] = useState<string[]>([]);
  const [limitWarning, setLimitWarning] = useState(false);
  const [tokenData, setTokenData] = useState<Record<string, TokenInfo>>({});

  useEffect(() => {
    fetchTokenData().then(setTokenData);
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

  const storageKey = publicKey ? publicKey.toBase58() : null;

  // Load follows from localStorage
  useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`whales_${storageKey}`);
        if (saved) setFollowingWallets(JSON.parse(saved));
      } catch {}
    }
  });

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

  const uniqueWhales = useMemo(() => new Set(ALL_TRADES.map(t => t.wallet)).size, []);

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
      .slice(0, 8)
      .map(([address, info]) => ({ address, ...info }));
  }, []);

  const filteredTrades = ALL_TRADES.filter(t => {
    if (filter === 'buy' && t.action !== 'BUY') return false;
    if (filter === 'sell' && t.action !== 'SELL') return false;
    // Filter out dust trades under $1
    const usd = getTradeUSDRaw(t);
    if (usd > 0 && usd < 1) return false;
    return true;
  });

  const tabs: FilterTab[] = [
    { key: 'all', label: 'All Trades' },
    { key: 'buy', label: 'Buys' },
    { key: 'sell', label: 'Sells' },
  ];

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Whale Tracker</h1>
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
            gap: '8px',
          }}>
            <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0 }}>
              Free plan limit: {FREE_WATCHLIST_LIMIT} watchlist slots. Upgrade for unlimited.
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
                const isFollowing = followingWallets.includes(whale.address);
                const displayName = whale.label || shortAddress(whale.address);
                return (
                  <div
                    key={whale.address}
                    style={{
                      background: '#111118',
                      border: '1px solid #222',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      minWidth: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <button
                      onClick={() => {
                        if (connected) toggleFollow(whale.address);
                        else document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
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
                        alignSelf: 'flex-start',
                      }}
                    >
                      {isFollowing ? '✓ Following' : 'Follow'}
                    </button>
                    <Link
                      href={`/wallet/${whale.address}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <span style={{ color: '#fff', fontWeight: '600' }}>{displayName}</span>
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
            const displayName = trade.walletLabel || shortAddress(trade.wallet);
            const isFollowing = followingWallets.includes(trade.wallet);

            return (
              <TradeCard
                key={`${trade.signature}-${i}`}
                followButton={
                  <button
                    onClick={() => {
                      if (connected) toggleFollow(trade.wallet);
                      else document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
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
