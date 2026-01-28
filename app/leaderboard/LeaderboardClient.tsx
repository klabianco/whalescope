'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';

interface LeaderboardEntry {
  name: string;
  party: string;
  chamber: string;
  tradeCount: number;
  totalVolume: number;
  return30d: number | null;
  return90d: number | null;
  returnYTD: number | null;
}

interface Props {
  leaderboard: LeaderboardEntry[];
}

type TimeFrame = '30d' | '90d' | 'ytd';

function formatReturn(value: number | null): string {
  if (value === null) return '—';
  const pct = (value * 100).toFixed(1);
  return value >= 0 ? `+${pct}%` : `${pct}%`;
}

function formatVolume(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function getReturnColor(value: number | null): string {
  if (value === null) return '#666';
  if (value >= 0.15) return '#4ade80'; // Strong positive
  if (value >= 0) return '#86efac'; // Positive
  if (value >= -0.1) return '#fca5a5'; // Slight negative
  return '#f87171'; // Negative
}

export default function LeaderboardClient({ leaderboard }: Props) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('ytd');
  const [sortBy, setSortBy] = useState<'return' | 'volume' | 'trades'>('return');
  
  const getReturn = (entry: LeaderboardEntry) => {
    switch (timeFrame) {
      case '30d': return entry.return30d;
      case '90d': return entry.return90d;
      case 'ytd': return entry.returnYTD;
    }
  };
  
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'return') {
      const aRet = getReturn(a) ?? -999;
      const bRet = getReturn(b) ?? -999;
      return bRet - aRet;
    }
    if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
    return b.tradeCount - a.tradeCount;
  });
  
  // Top 3 performers
  const topPerformers = sortedLeaderboard
    .filter(e => getReturn(e) !== null)
    .slice(0, 3);

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            🏆 Performance Leaderboard
          </h1>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            Estimated returns based on reported congressional trades
          </p>
          <p style={{ color: '#666', fontSize: '13px' }}>
            ⚠️ Returns are estimates based on trade timing. Not financial advice.
          </p>
        </div>

      {/* Podium - Top 3 */}
      {topPerformers.length >= 3 && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '40px',
          alignItems: 'end'
        }}>
          {/* 2nd Place */}
          <div style={{
            background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥈</div>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
              {topPerformers[1].name}
            </div>
            <div style={{ 
              color: topPerformers[1].party === 'D' ? '#60a5fa' : '#f87171',
              fontSize: '12px',
              marginBottom: '12px'
            }}>
              ({topPerformers[1].party}) · {topPerformers[1].chamber}
            </div>
            <div style={{ 
              color: getReturnColor(getReturn(topPerformers[1])),
              fontSize: '28px',
              fontWeight: '700'
            }}>
              {formatReturn(getReturn(topPerformers[1]))}
            </div>
            <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
              {topPerformers[1].tradeCount} trades
            </div>
          </div>

          {/* 1st Place */}
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            padding: '32px 24px',
            borderRadius: '16px',
            textAlign: 'center',
            transform: 'translateY(-16px)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
            <div style={{ color: '#000', fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>
              {topPerformers[0].name}
            </div>
            <div style={{ 
              color: topPerformers[0].party === 'D' ? '#1e40af' : '#991b1b',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              ({topPerformers[0].party}) · {topPerformers[0].chamber}
            </div>
            <div style={{ 
              color: '#000',
              fontSize: '36px',
              fontWeight: '700'
            }}>
              {formatReturn(getReturn(topPerformers[0]))}
            </div>
            <div style={{ color: '#78350f', fontSize: '12px', marginTop: '4px' }}>
              {topPerformers[0].tradeCount} trades · {formatVolume(topPerformers[0].totalVolume)}
            </div>
          </div>

          {/* 3rd Place */}
          <div style={{
            background: 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
            padding: '20px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🥉</div>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
              {topPerformers[2].name}
            </div>
            <div style={{ 
              color: topPerformers[2].party === 'D' ? '#93c5fd' : '#fca5a5',
              fontSize: '12px',
              marginBottom: '12px'
            }}>
              ({topPerformers[2].party}) · {topPerformers[2].chamber}
            </div>
            <div style={{ 
              color: getReturnColor(getReturn(topPerformers[2])),
              fontSize: '24px',
              fontWeight: '700'
            }}>
              {formatReturn(getReturn(topPerformers[2]))}
            </div>
            <div style={{ color: '#a1a1aa', fontSize: '12px', marginTop: '4px' }}>
              {topPerformers[2].tradeCount} trades
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Time Frame Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['30d', '90d', 'ytd'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              style={{
                padding: '8px 16px',
                background: timeFrame === tf ? '#4ade80' : '#222',
                color: timeFrame === tf ? '#000' : '#888',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: timeFrame === tf ? '600' : '400'
              }}
            >
              {tf === '30d' ? '30 Days' : tf === '90d' ? '90 Days' : 'YTD'}
            </button>
          ))}
        </div>

        {/* Sort By */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#888', fontSize: '14px' }}>Sort by:</span>
          {(['return', 'volume', 'trades'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: '6px 12px',
                background: sortBy === s ? '#333' : 'transparent',
                color: sortBy === s ? '#fff' : '#666',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {s === 'return' ? 'Return' : s === 'volume' ? 'Volume' : 'Trades'}
            </button>
          ))}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div style={{ 
        background: '#111118', 
        borderRadius: '12px', 
        overflow: 'hidden',
        border: '1px solid #222'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 1fr 80px 100px 100px 120px',
          padding: '16px 20px',
          background: '#1a1a2e',
          borderBottom: '1px solid #333',
          fontSize: '12px',
          color: '#888',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          <div>Rank</div>
          <div>Politician</div>
          <div style={{ textAlign: 'center' }}>Party</div>
          <div style={{ textAlign: 'right' }}>Trades</div>
          <div style={{ textAlign: 'right' }}>Volume</div>
          <div style={{ textAlign: 'right' }}>Return</div>
        </div>

        {/* Table Body */}
        {sortedLeaderboard.map((entry, index) => (
          <Link
            key={entry.name}
            href={`/congress/${encodeURIComponent(entry.name.toLowerCase().replace(/ /g, '-'))}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 80px 100px 100px 120px',
              padding: '16px 20px',
              borderBottom: '1px solid #222',
              alignItems: 'center',
              transition: 'background 0.15s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a2e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ 
                color: index < 3 ? '#fbbf24' : '#666',
                fontWeight: index < 3 ? '700' : '400',
                fontSize: index < 3 ? '16px' : '14px'
              }}>
                {index + 1}
              </div>
              <div style={{ color: '#fff', fontWeight: '500' }}>
                {entry.name}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  background: entry.party === 'D' ? '#1e3a5f' : entry.party === 'R' ? '#5f1e1e' : '#3f3f46',
                  color: entry.party === 'D' ? '#60a5fa' : entry.party === 'R' ? '#f87171' : '#a1a1aa',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {entry.party} · {entry.chamber === 'House' ? 'H' : 'S'}
                </span>
              </div>
              <div style={{ textAlign: 'right', color: '#888' }}>
                {entry.tradeCount}
              </div>
              <div style={{ textAlign: 'right', color: '#888' }}>
                {formatVolume(entry.totalVolume)}
              </div>
              <div style={{ 
                textAlign: 'right',
                color: getReturnColor(getReturn(entry)),
                fontWeight: '600',
                fontSize: '15px'
              }}>
                {formatReturn(getReturn(entry))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        background: '#1a1a2e',
        padding: '20px',
        borderRadius: '12px',
        marginTop: '32px'
      }}>
        <h4 style={{ color: '#fbbf24', marginBottom: '8px', fontSize: '14px' }}>
          ⚠️ Methodology & Disclaimer
        </h4>
        <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.6' }}>
          Returns are estimated based on trade filing dates and general market performance for traded securities.
          Actual returns may vary significantly. Congressional disclosures only require reporting within 45 days,
          so exact entry/exit prices are unknown. This is for educational purposes only and should not be
          considered financial advice or a recommendation to follow any politician&apos;s trades.
        </p>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#666', fontSize: '14px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          🐋 WhaleScope
        </Link>
        {' · '}
        <Link href="/congress" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          Congress Tracker
        </Link>
        {' · '}
        Built by <a href="https://x.com/WrenTheAI" style={{ color: '#60a5fa' }}>@WrenTheAI</a>
      </footer>
    </main>
    </>
  );
}
