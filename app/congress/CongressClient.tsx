'use client';

import { useState } from 'react';
import Link from 'next/link';
import CommitteeCorrelation from '../components/CommitteeCorrelation';
import { Footer } from '../components/Footer';
import TradeAlerts from '../components/TradeAlerts';
import { Header } from '../components/Header';

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

// Check if a trade has committee correlation
function hasCorrelation(trade: CongressTrade, committeeData: CommitteeData): boolean {
  const memberCommittees = committeeData.members[trade.politician] || [];
  for (const committee of memberCommittees) {
    const committeeInfo = committeeData.committees[committee];
    if (committeeInfo?.tickers.includes(trade.ticker)) {
      return true;
    }
  }
  return false;
}

export default function CongressClient({ trades, topTraders, committeeData, politicians }: Props) {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'flagged'>('all');
  
  const filteredTrades = trades.filter(t => {
    if (filter === 'buy') return t.type === 'Purchase';
    if (filter === 'sell') return t.type === 'Sale';
    if (filter === 'flagged') return hasCorrelation(t, committeeData);
    return true;
  });

  // Count flagged trades
  const flaggedCount = trades.filter(t => hasCorrelation(t, committeeData)).length;

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            Congress Tracker
          </h1>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            See what politicians are buying and selling
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/leaderboard" style={{ color: '#4ade80', textDecoration: 'none' }}>
              🏆 Performance Leaderboard →
            </Link>
            <Link href="/watchlist" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              👀 Your Watchlist →
            </Link>
          </div>
        </div>

      {/* Trade Alerts Signup - Compact Version */}
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
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#fff', fontWeight: '600' }}>{trader.name}</span>
                  <span style={{ 
                    color: trader.party === 'D' ? '#60a5fa' : '#f87171',
                    fontSize: '12px'
                  }}>
                    ({trader.party})
                  </span>
                </div>
                <div style={{ color: '#888', fontSize: '13px' }}>
                  {trader.trades} trades
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {(['all', 'buy', 'sell', 'flagged'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              background: filter === f ? (f === 'flagged' ? '#fbbf24' : '#4ade80') : '#222',
              color: filter === f ? '#000' : '#888',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {f === 'all' ? 'All Trades' : 
             f === 'buy' ? '🟢 Buys' : 
             f === 'sell' ? '🔴 Sells' :
             <>⚠️ Flagged <span style={{ 
               background: filter === f ? 'rgba(0,0,0,0.2)' : '#333',
               padding: '2px 6px',
               borderRadius: '4px',
               fontSize: '11px'
             }}>{flaggedCount}</span></>}
          </button>
        ))}
      </div>

      {/* Flagged Trades Explanation */}
      {filter === 'flagged' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <p style={{ color: '#fbbf24', fontSize: '13px', margin: 0 }}>
            ⚠️ <strong>Committee Correlation:</strong> These trades involve stocks that fall under the
            oversight of committees the politician sits on. This could indicate a potential conflict of interest.
          </p>
        </div>
      )}

      {/* Trades Feed */}
      {filteredTrades.length === 0 ? (
        <div style={{ 
          background: '#111118', 
          padding: '40px', 
          borderRadius: '12px',
          textAlign: 'center',
          color: '#666'
        }}>
          {filter === 'flagged' 
            ? 'No flagged trades found. Great news!' 
            : 'No trades available. Run fetch-congress script to update data.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTrades.map((trade, i) => {
            const isFlagged = hasCorrelation(trade, committeeData);
            
            return (
              <div key={i} style={{
                background: isFlagged 
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, #111118 100%)'
                  : '#111118',
                border: isFlagged ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid #222',
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
                      background: trade.type === 'Purchase' ? '#064e3b' : '#7f1d1d',
                      color: trade.type === 'Purchase' ? '#4ade80' : '#f87171',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {trade.type === 'Purchase' ? 'BUY' : 'SELL'}
                    </span>
                    <div>
                      <Link 
                        href={`/congress/${encodeURIComponent(trade.politician.toLowerCase().replace(/ /g, '-'))}`}
                        style={{ color: '#fff', fontWeight: '600', textDecoration: 'none' }}
                      >
                        {trade.politician}
                      </Link>
                      <span style={{ 
                        color: trade.party === 'D' ? '#60a5fa' : '#f87171',
                        fontSize: '12px',
                        marginLeft: '8px'
                      }}>
                        ({trade.party}) · {trade.chamber}
                      </span>
                    </div>
                    {isFlagged && (
                      <CommitteeCorrelation trade={trade} committeeData={committeeData} showBadge={true} />
                    )}
                  </div>
                  <span style={{ color: '#666', fontSize: '13px' }}>
                    Filed {trade.filed}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '18px' }}>
                      {trade.ticker}
                    </span>
                    <span style={{ color: '#888', marginLeft: '8px' }}>
                      {trade.company}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontWeight: '500' }}>
                      {trade.amount}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      Traded {trade.traded}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Notice */}
      <div style={{
        background: '#1a1a2e',
        padding: '16px 20px',
        borderRadius: '12px',
        marginTop: '40px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#888', fontSize: '13px' }}>
          📊 Data from STOCK Act disclosures. Politicians must report trades within 45 days.
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
