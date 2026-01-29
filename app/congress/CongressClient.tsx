'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CommitteeCorrelation from '../components/CommitteeCorrelation';
import { Footer } from '../components/Footer';
import { EmailCapture } from '../components/EmailCapture';
import TradeAlerts from '../components/TradeAlerts';
import { Header } from '../components/Header';
import { useAuth } from '../providers/AuthProvider';
import {
  FilterTabs,
  ProUpsellBanner,
  TradeCard,
  TradeFeedList,
  type FilterTab,
} from '../components/TradeFeed';

interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  state?: string;
  ticker: string;
  company: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

interface TopTrader {
  name: string;
  party: string;
  trades: number;
}

interface CommitteeData {
  committees: Record<string, {
    sectors: string[];
    tickers: string[];
  }>;
  members: Record<string, string[]>;
}

interface Props {
  trades: CongressTrade[];
  topTraders: TopTrader[];
  committeeData: CommitteeData;
  politicians: string[];
}

function hasCorrelation(trade: CongressTrade, committeeData: CommitteeData): boolean {
  const memberCommittees = committeeData.members[trade.politician] || [];
  for (const committee of memberCommittees) {
    const committeeInfo = committeeData.committees[committee];
    if (committeeInfo?.tickers.includes(trade.ticker)) return true;
  }
  return false;
}

function isRecentTrade(trade: CongressTrade): boolean {
  const filedDate = new Date(trade.filed + 'T00:00:00');
  const now = new Date();
  const hoursSinceFiled = (now.getTime() - filedDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceFiled < 24;
}

export default function CongressClient({ trades, topTraders, committeeData, politicians }: Props) {
  const [filter, setFilter] = useState('all');

  let isPro = false;
  try {
    const auth = useAuth();
    isPro = auth.isPro;
  } catch {}

  const recentTradeCount = useMemo(() => trades.filter(isRecentTrade).length, [trades]);
  const flaggedCount = trades.filter(t => hasCorrelation(t, committeeData)).length;

  const filteredTrades = trades.filter(t => {
    if (!isPro && isRecentTrade(t)) return false;
    if (filter === 'buy') return t.type === 'Purchase';
    if (filter === 'sell') return t.type === 'Sale';
    if (filter === 'flagged') return hasCorrelation(t, committeeData);
    return true;
  });

  const tabs: FilterTab[] = [
    { key: 'all', label: 'All Trades' },
    { key: 'buy', label: 'Buys' },
    { key: 'sell', label: 'Sells' },
    { key: 'flagged', label: 'Flagged', color: '#fbbf24', count: flaggedCount },
  ];

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Congress Tracker</h1>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            See what politicians are buying and selling
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/leaderboard" style={{ color: '#4ade80', textDecoration: 'none' }}>
              Performance Leaderboard →
            </Link>
            <Link href="/watchlist" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Your Watchlist →
            </Link>
          </div>
        </div>

        {/* Trade Alerts Signup */}
        <div style={{ marginBottom: '32px' }}>
          <TradeAlerts politicians={politicians} compact={true} />
        </div>

        {/* Top Traders */}
        {topTraders.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#fff' }}>
              Most Active Traders
            </h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {topTraders.filter(t => t.name).map((trader) => (
                <Link
                  key={trader.name}
                  href={`/congress/${encodeURIComponent((trader.name || '').toLowerCase().replace(/ /g, '-'))}`}
                  style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    minWidth: '160px',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{trader.name}</span>
                    <span style={{ color: trader.party === 'D' ? '#60a5fa' : '#f87171', fontSize: '12px' }}>
                      ({trader.party})
                    </span>
                  </div>
                  <div style={{ color: '#888', fontSize: '13px' }}>{trader.trades} trades</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pro Upsell */}
        {!isPro && (
          <ProUpsellBanner
            count={recentTradeCount}
            label="trade filed"
          />
        )}

        {/* Filter Tabs */}
        <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />

        {/* Flagged explanation */}
        {filter === 'flagged' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}>
            <p style={{ color: '#fbbf24', fontSize: '13px', margin: 0 }}>
              Note: <strong>Committee Correlation:</strong> These trades involve stocks that fall under the
              oversight of committees the politician sits on. This could indicate a potential conflict of interest.
            </p>
          </div>
        )}

        {/* Trade Feed */}
        <TradeFeedList
          trades={filteredTrades}
          isPro={isPro}
          emptyMessage={
            filter === 'flagged'
              ? 'No flagged trades found. Great news!'
              : 'No trades available. Run fetch-congress script to update data.'
          }
          renderCard={(trade, i) => {
            const isFlagged = hasCorrelation(trade, committeeData);
            return (
              <TradeCard
                key={i}
                badge={{
                  label: trade.type === 'Purchase' ? 'BUY' : 'SELL',
                  bg: trade.type === 'Purchase' ? '#064e3b' : '#7f1d1d',
                  color: trade.type === 'Purchase' ? '#4ade80' : '#f87171',
                }}
                actor={trade.politician}
                actorHref={`/congress/${encodeURIComponent(trade.politician.toLowerCase().replace(/ /g, '-'))}`}
                actorMeta={
                  <span style={{ color: trade.party === 'D' ? '#60a5fa' : '#f87171' }}>
                    ({trade.party}) · {trade.chamber}
                  </span>
                }
                extras={
                  isFlagged ? (
                    <CommitteeCorrelation trade={trade} committeeData={committeeData} showBadge={true} />
                  ) : undefined
                }
                timestamp={`Filed ${trade.filed}`}
                highlight={trade.ticker}
                highlightMeta={trade.company}
                bottomRight={
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontWeight: '500' }}>{trade.amount}</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>Traded {trade.traded}</div>
                  </div>
                }
                background={
                  isFlagged
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, #111118 100%)'
                    : undefined
                }
                border={isFlagged ? '1px solid rgba(251, 191, 36, 0.3)' : undefined}
              />
            );
          }}
        />

        {/* Email Capture */}
        <div style={{ marginTop: '40px' }}>
          <EmailCapture
            source="congress"
            headline="Get weekly congress trade alerts"
            subtext="The biggest trades from Capitol Hill, delivered free to your inbox every week."
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
            Data from STOCK Act disclosures. Politicians must report trades within 45 days.
            <br />
            <span style={{ color: '#4ade80' }}>Live data • Updated daily</span>
            {' • '}
            <span style={{ color: '#fbbf24' }}>{flaggedCount} potential conflicts flagged</span>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
