'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../providers/AuthProvider';
import {
  FilterTabs,
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

interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  state: string;
  ticker: string;
  company: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

// ALL crypto trades — no filtering. Raw firehose.
const ALL_TRADES: WhaleTrade[] = (tradesData as WhaleTrade[])
  .sort((a, b) => b.timestamp - a.timestamp);

const CRYPTO_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  BUY: { bg: '#064e3b', color: '#4ade80', label: 'BUY' },
  SELL: { bg: '#7f1d1d', color: '#f87171', label: 'SELL' },
  TRANSFER: { bg: '#1e3a5f', color: '#60a5fa', label: 'TRANSFER' },
  UNKNOWN: { bg: '#333', color: '#888', label: '???' },
};

const STABLECOIN_SYMBOLS = new Set(['USDC', 'USDT', 'UST', 'DAI', 'BUSD', 'PYUSD']);

const ALL_MINTS = [...new Set(
  (tradesData as WhaleTrade[])
    .map(t => t.tokenMint)
    .filter((m): m is string => !!m)
)];

interface TokenInfo { symbol: string; name: string; price: number; }

async function fetchTokenData(): Promise<Record<string, TokenInfo>> {
  const tokenMap: Record<string, TokenInfo> = {};
  try {
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

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type FeedMode = 'crypto' | 'congress';

export default function FirehoseClient() {
  const { isPro: authIsPro, loading: authLoading } = useAuth();
  const { publicKey, connected } = useWallet();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFeed = searchParams.get('feed') === 'congress' ? 'congress' : 'crypto';
  const [feedMode, setFeedMode] = useState<FeedMode>(initialFeed);
  const [walletIsPro, setWalletIsPro] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);
  const [filter, setFilter] = useState('all');
  const [tokenData, setTokenData] = useState<Record<string, TokenInfo>>({});
  const [congressTrades, setCongressTrades] = useState<CongressTrade[]>([]);
  const [congressLoading, setCongressLoading] = useState(false);

  function switchFeed(mode: FeedMode) {
    setFeedMode(mode);
    setFilter('all');
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'crypto') {
      params.delete('feed');
    } else {
      params.set('feed', mode);
    }
    const qs = params.toString();
    router.replace(`/firehose${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  // Check Pro status by wallet
  useEffect(() => {
    if (!authIsPro && connected && publicKey) {
      const addr = publicKey.toBase58();
      fetch(`/api/check-pro?wallet=${addr}`)
        .then(res => res.json())
        .then(data => {
          setWalletIsPro(data.isPro === true);
          setWalletChecked(true);
        })
        .catch(() => setWalletChecked(true));
    } else {
      setWalletChecked(true);
    }
  }, [authIsPro, connected, publicKey]);

  const isPro = authIsPro || walletIsPro;
  const loading = authLoading || (!walletChecked && connected);

  // Fetch crypto token data
  useEffect(() => {
    if (isPro && feedMode === 'crypto') {
      fetchTokenData().then(setTokenData);
    }
  }, [isPro, feedMode]);

  // Fetch ALL congress trades (no limit)
  useEffect(() => {
    if (isPro && feedMode === 'congress' && congressTrades.length === 0) {
      setCongressLoading(true);
      const walletParam = publicKey ? `&wallet=${publicKey.toBase58()}` : '';
      fetch(`/api/congress-trades?limit=1000${walletParam}`)
        .then(r => r.json())
        .then(data => {
          const trades = Array.isArray(data) ? data : (data.trades || []);
          setCongressTrades(trades);
        })
        .catch(() => {})
        .finally(() => setCongressLoading(false));
    }
  }, [isPro, feedMode]);

  function getTokenSymbol(trade: WhaleTrade): string {
    if (trade.tokenMint && tokenData[trade.tokenMint]?.symbol)
      return tokenData[trade.tokenMint].symbol;
    const rawSymbol = trade.tokenSymbol || '';
    if (rawSymbol && rawSymbol.length <= 10 && !rawSymbol.includes('...'))
      return rawSymbol;
    return trade.tokenMint ? `...${trade.tokenMint.slice(-4)}` : '???';
  }

  function getTradeUSD(trade: WhaleTrade): string {
    const amt = trade.tokenAmount;
    if (!amt) return '';
    const sym = trade.tokenSymbol || '';
    if (STABLECOIN_SYMBOLS.has(sym)) return formatUSD(amt);
    if (trade.tokenMint && tokenData[trade.tokenMint]?.price)
      return formatUSD(amt * tokenData[trade.tokenMint].price);
    const solMint = 'So11111111111111111111111111111111111111112';
    if (trade.solAmount && trade.solAmount > 0.001 && tokenData[solMint]?.price)
      return formatUSD(trade.solAmount * tokenData[solMint].price);
    return '';
  }

  // Crypto filtered trades
  const filteredCrypto = ALL_TRADES.filter(t => {
    if (filter === 'buy') return t.action === 'BUY';
    if (filter === 'sell') return t.action === 'SELL';
    if (filter === 'transfer') return t.action === 'TRANSFER';
    return true;
  });

  // Congress filtered trades
  const filteredCongress = useMemo(() => {
    let trades = [...congressTrades];
    if (filter === 'buy') trades = trades.filter(t => t.type === 'Purchase');
    if (filter === 'sell') trades = trades.filter(t => t.type === 'Sale');
    if (filter === 'dem') trades = trades.filter(t => t.party === 'D');
    if (filter === 'rep') trades = trades.filter(t => t.party === 'R');
    return trades;
  }, [congressTrades, filter]);

  const cryptoTabs: FilterTab[] = [
    { key: 'all', label: 'All' },
    { key: 'buy', label: 'Buys' },
    { key: 'sell', label: 'Sells' },
    { key: 'transfer', label: 'Transfers' },
  ];

  const congressTabs: FilterTab[] = [
    { key: 'all', label: 'All' },
    { key: 'buy', label: 'Purchases' },
    { key: 'sell', label: 'Sales' },
    { key: 'dem', label: '🔵 Democrats' },
    { key: 'rep', label: '🔴 Republicans' },
  ];

  // Pro gate
  if (!loading && !isPro) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔥</div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Firehose</h1>
          <p style={{ color: '#888', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Every transaction. Every wallet. Every politician. Unfiltered, raw data from crypto whales and Congress members.
          </p>
          <div style={{
            background: '#111118',
            border: '1px solid #222',
            borderRadius: '16px',
            padding: '40px 24px',
            maxWidth: '440px',
            margin: '0 auto',
          }}>
            <p style={{ color: '#fbbf24', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              🔒 Pro Feature
            </p>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              The Firehose shows {ALL_TRADES.length.toLocaleString()}+ unfiltered transactions from crypto whales and Congress members. Upgrade to Pro for full access.
            </p>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#4ade80',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
              }}>
                Upgrade to Pro
              </button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: '#888' }}>Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            🔥 Firehose
          </h1>
          <p style={{ color: '#888', marginBottom: '8px' }}>
            Every transaction. Unfiltered. Raw data.
          </p>
          <p style={{ color: '#4ade80', fontSize: '13px' }}>
            Pro access · Crypto whales + Congress trades
          </p>
        </div>

        {/* Feed toggle: Crypto / Congress */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: '24px',
        }}>
          <div style={{
            display: 'inline-flex', background: '#18181b', padding: '4px', borderRadius: '12px', border: '1px solid #27272a',
          }}>
            <button
              onClick={() => switchFeed('crypto')}
              style={{
                padding: '10px 24px', background: feedMode === 'crypto' ? '#27272a' : 'transparent',
                color: feedMode === 'crypto' ? '#fff' : '#71717a', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: feedMode === 'crypto' ? '600' : '400', cursor: 'pointer',
              }}
            >
              🐋 Crypto ({ALL_TRADES.length.toLocaleString()})
            </button>
            <button
              onClick={() => switchFeed('congress')}
              style={{
                padding: '10px 24px', background: feedMode === 'congress' ? '#27272a' : 'transparent',
                color: feedMode === 'congress' ? '#fff' : '#71717a', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: feedMode === 'congress' ? '600' : '400', cursor: 'pointer',
              }}
            >
              🏛️ Congress {congressTrades.length > 0 ? `(${congressTrades.length})` : ''}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <FilterTabs
          tabs={feedMode === 'crypto' ? cryptoTabs : congressTabs}
          active={filter}
          onChange={setFilter}
        />

        {/* Crypto Feed */}
        {feedMode === 'crypto' && (
          <TradeFeedList
            trades={filteredCrypto}
            isPro={true}
            emptyMessage="No trades found for this filter."
            renderCard={(trade, i) => {
              const t = trade as WhaleTrade;
              const badge = CRYPTO_BADGES[t.action] || CRYPTO_BADGES.UNKNOWN;
              const symbol = getTokenSymbol(t);
              const displayName = t.walletLabel || shortAddress(t.wallet);
              return (
                <TradeCard
                  key={`${t.signature}-${i}`}
                  actor={displayName}
                  actorHref={`/wallet/${t.wallet}`}
                  badge={badge}
                  asset={symbol}
                  amount={
                    t.tokenAmount !== undefined
                      ? `${formatAmount(t.tokenAmount)} ${symbol}`
                      : '—'
                  }
                  usdValue={getTradeUSD(t)}
                  date={formatDate(t.timestamp)}
                  txUrl={`https://solscan.io/tx/${t.signature}`}
                />
              );
            }}
          />
        )}

        {/* Congress Feed */}
        {feedMode === 'congress' && (
          congressLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              Loading Congress trades...
            </div>
          ) : (
            <TradeFeedList
              trades={filteredCongress}
              isPro={true}
              emptyMessage="No trades found for this filter."
              renderCard={(trade, i) => {
                const t = trade as unknown as CongressTrade;
                const badge = t.type === 'Purchase'
                  ? { bg: '#064e3b', color: '#4ade80', label: 'BUY' }
                  : { bg: '#7f1d1d', color: '#f87171', label: 'SELL' };
                const partyEmoji = t.party === 'D' ? '🔵' : t.party === 'R' ? '🔴' : '⚪';
                return (
                  <TradeCard
                    key={`congress-${i}`}
                    actor={`${t.politician} ${partyEmoji}`}
                    actorHref={`/congress/${t.politician.toLowerCase().replace(/ /g, '-')}`}
                    badge={badge}
                    asset={t.ticker}
                    amount={t.amount}
                    date={t.traded ? `Traded ${t.traded}` : `Filed ${t.filed}`}
                    extras={
                      <span style={{ color: '#52525b', fontSize: '12px' }}>
                        {t.chamber} · {t.company || t.ticker}
                      </span>
                    }
                  />
                );
              }}
            />
          )
        )}
      </main>
      <Footer />
    </>
  );
}
