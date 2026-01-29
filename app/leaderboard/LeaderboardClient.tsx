'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

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
  if (value === null) return '#52525b';
  if (value >= 0.15) return '#22c55e';
  if (value >= 0) return '#4ade80';
  if (value >= -0.1) return '#f87171';
  return '#ef4444';
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
  
  const topPerformers = sortedLeaderboard
    .filter(e => getReturn(e) !== null)
    .slice(0, 3);

  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          .leaderboard-row {
            grid-template-columns: 60px 1fr 100px 90px 100px 130px !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
          .leaderboard-row .hide-mobile { display: block !important; }
          .podium-grid { gap: 20px !important; padding: 0 20px !important; }
        }
        @media (max-width: 639px) {
          .podium-grid {
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 8px !important;
          }
          .podium-card { padding: 16px 8px !important; }
          .podium-card .podium-name { font-size: 13px !important; }
          .podium-card .podium-return { font-size: 22px !important; }
          .podium-card-first { padding: 20px 8px !important; }
          .podium-card-first .podium-return { font-size: 28px !important; }
          .podium-card .podium-meta { display: none; }
          .controls-wrap { flex-direction: column !important; }
        }
      `}</style>
      <Header />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px 60px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-block',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '8px',
            padding: '6px 16px',
            marginBottom: '16px'
          }}>
            <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px' }}>
              PERFORMANCE RANKINGS
            </span>
          </div>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '700',
            marginBottom: '12px',
            background: 'linear-gradient(to right, #fff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            Congressional Trading Leaderboard
          </h1>
          <p style={{ color: '#71717a', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            Estimated portfolio returns based on publicly disclosed trades
          </p>
        </div>

        {/* Podium - Top 3 */}
        {topPerformers.length >= 3 && (
          <div className="podium-grid" style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr',
            gap: '12px',
            marginBottom: '48px',
            alignItems: 'end',
            padding: '0'
          }}>
            {/* 2nd Place */}
            <div className="podium-card" style={{
              background: 'linear-gradient(180deg, #27272a 0%, #18181b 100%)',
              padding: '28px 20px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid #3f3f46',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #a1a1aa, transparent)'
              }} />
              <div style={{ 
                fontSize: '14px', 
                color: '#a1a1aa', 
                fontWeight: '600',
                marginBottom: '16px',
                letterSpacing: '2px'
              }}>
                2ND PLACE
              </div>
              <Link href={`/congress/${encodeURIComponent(topPerformers[1].name.toLowerCase().replace(/ /g, '-'))}`} style={{ textDecoration: 'none' }}>
                <div className="podium-name" style={{ color: '#fff', fontWeight: '600', fontSize: '17px', marginBottom: '6px' }}>
                  {topPerformers[1].name}
                </div>
              </Link>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: topPerformers[1].party === 'D' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '4px 10px',
                borderRadius: '20px',
                marginBottom: '16px'
              }}>
                <span style={{ 
                  color: topPerformers[1].party === 'D' ? '#60a5fa' : '#f87171',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {topPerformers[1].party === 'D' ? 'Democrat' : 'Republican'} · {topPerformers[1].chamber}
                </span>
              </div>
              <div className="podium-return" style={{ 
                color: getReturnColor(getReturn(topPerformers[1])),
                fontSize: '32px',
                fontWeight: '700',
                letterSpacing: '-1px'
              }}>
                {formatReturn(getReturn(topPerformers[1]))}
              </div>
              <div className="podium-meta" style={{ color: '#71717a', fontSize: '13px', marginTop: '8px' }}>
                {topPerformers[1].tradeCount} trades · {formatVolume(topPerformers[1].totalVolume)}
              </div>
            </div>

            {/* 1st Place */}
            <div className="podium-card podium-card-first" style={{
              background: 'linear-gradient(180deg, #422006 0%, #1c1917 100%)',
              padding: '36px 24px',
              borderRadius: '24px',
              textAlign: 'center',
              border: '1px solid #854d0e',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(251, 191, 36, 0.15)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)'
              }} />
              <div style={{ 
                fontSize: '14px', 
                marginBottom: '8px',
                color: '#fbbf24',
                fontWeight: '700',
                letterSpacing: '3px'
              }}>
                #1
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: '#fbbf24', 
                fontWeight: '600',
                marginBottom: '16px',
                letterSpacing: '3px'
              }}>
                TOP PERFORMER
              </div>
              <Link href={`/congress/${encodeURIComponent(topPerformers[0].name.toLowerCase().replace(/ /g, '-'))}`} style={{ textDecoration: 'none' }}>
                <div className="podium-name" style={{ color: '#fff', fontWeight: '700', fontSize: '20px', marginBottom: '8px' }}>
                  {topPerformers[0].name}
                </div>
              </Link>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: topPerformers[0].party === 'D' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                padding: '5px 12px',
                borderRadius: '20px',
                marginBottom: '20px'
              }}>
                <span style={{ 
                  color: topPerformers[0].party === 'D' ? '#93c5fd' : '#fca5a5',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {topPerformers[0].party === 'D' ? 'Democrat' : 'Republican'} · {topPerformers[0].chamber}
                </span>
              </div>
              <div className="podium-return" style={{ 
                color: '#fbbf24',
                fontSize: '44px',
                fontWeight: '700',
                letterSpacing: '-2px',
                textShadow: '0 0 30px rgba(251, 191, 36, 0.5)'
              }}>
                {formatReturn(getReturn(topPerformers[0]))}
              </div>
              <div className="podium-meta" style={{ color: '#a3a3a3', fontSize: '14px', marginTop: '12px' }}>
                {topPerformers[0].tradeCount} trades · {formatVolume(topPerformers[0].totalVolume)}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="podium-card" style={{
              background: 'linear-gradient(180deg, #292524 0%, #1c1917 100%)',
              padding: '24px 20px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid #44403c',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #a16207, transparent)'
              }} />
              <div style={{ 
                fontSize: '14px', 
                color: '#a16207', 
                fontWeight: '600',
                marginBottom: '16px',
                letterSpacing: '2px'
              }}>
                3RD PLACE
              </div>
              <Link href={`/congress/${encodeURIComponent(topPerformers[2].name.toLowerCase().replace(/ /g, '-'))}`} style={{ textDecoration: 'none' }}>
                <div className="podium-name" style={{ color: '#fff', fontWeight: '600', fontSize: '16px', marginBottom: '6px' }}>
                  {topPerformers[2].name}
                </div>
              </Link>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: topPerformers[2].party === 'D' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '4px 10px',
                borderRadius: '20px',
                marginBottom: '16px'
              }}>
                <span style={{ 
                  color: topPerformers[2].party === 'D' ? '#60a5fa' : '#f87171',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {topPerformers[2].party === 'D' ? 'Democrat' : 'Republican'} · {topPerformers[2].chamber}
                </span>
              </div>
              <div className="podium-return" style={{ 
                color: getReturnColor(getReturn(topPerformers[2])),
                fontSize: '28px',
                fontWeight: '700',
                letterSpacing: '-1px'
              }}>
                {formatReturn(getReturn(topPerformers[2]))}
              </div>
              <div className="podium-meta" style={{ color: '#71717a', fontSize: '13px', marginTop: '8px' }}>
                {topPerformers[2].tradeCount} trades · {formatVolume(topPerformers[2].totalVolume)}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls-wrap" style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#18181b',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #27272a'
        }}>
          {/* Time Frame Selector */}
          <div style={{ display: 'flex', gap: '6px', background: '#09090b', padding: '4px', borderRadius: '10px' }}>
            {(['30d', '90d', 'ytd'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                style={{
                  padding: '10px 20px',
                  background: timeFrame === tf ? '#27272a' : 'transparent',
                  color: timeFrame === tf ? '#fff' : '#71717a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: timeFrame === tf ? '600' : '400',
                  transition: 'all 0.15s ease'
                }}
              >
                {tf === '30d' ? '30 Days' : tf === '90d' ? '90 Days' : 'Year to Date'}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#52525b', fontSize: '14px', fontWeight: '500' }}>Sort by</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['return', 'volume', 'trades'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  style={{
                    padding: '8px 16px',
                    background: sortBy === s ? '#3f3f46' : 'transparent',
                    color: sortBy === s ? '#fff' : '#71717a',
                    border: '1px solid',
                    borderColor: sortBy === s ? '#3f3f46' : '#27272a',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: sortBy === s ? '500' : '400',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {s === 'return' ? '% Return' : s === 'volume' ? 'Volume' : 'Trades'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Full Leaderboard Table */}
        <div style={{ 
          background: '#09090b', 
          borderRadius: '16px', 
          overflow: 'hidden',
          border: '1px solid #27272a'
        }}>
          {/* Table Header */}
          <div className="leaderboard-row" style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 80px 60px',
            padding: '16px 16px',
            background: '#18181b',
            borderBottom: '1px solid #27272a',
            fontSize: '11px',
            color: '#52525b',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div>Rank</div>
            <div>Politician</div>
            <div style={{ textAlign: 'center' }}>Party</div>
            <div style={{ textAlign: 'right' }}>Trades</div>
          </div>

          {/* Table Body */}
          {sortedLeaderboard.map((entry, index) => (
            <Link
              key={entry.name}
              href={`/congress/${encodeURIComponent(entry.name.toLowerCase().replace(/ /g, '-'))}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="leaderboard-row" style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 80px 60px',
                padding: '14px 16px',
                borderBottom: index < sortedLeaderboard.length - 1 ? '1px solid #1f1f23' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#18181b'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ 
                  color: index < 3 ? '#fbbf24' : '#52525b',
                  fontWeight: '600',
                  fontSize: '14px',
                  fontFamily: 'ui-monospace, monospace'
                }}>
                  #{index + 1}
                </div>
                <div style={{ color: '#fafafa', fontWeight: '500', fontSize: '14px' }}>
                  {entry.name}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    background: entry.party === 'D' ? 'rgba(59, 130, 246, 0.15)' : entry.party === 'R' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                    color: entry.party === 'D' ? '#60a5fa' : entry.party === 'R' ? '#f87171' : '#a1a1aa',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {entry.party === 'D' ? 'Dem' : entry.party === 'R' ? 'Rep' : entry.party} · {entry.chamber === 'House' ? 'H' : 'S'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', color: '#71717a', fontSize: '13px', fontFamily: 'ui-monospace, monospace' }}>
                  {entry.tradeCount}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.02) 100%)',
          padding: '24px',
          borderRadius: '12px',
          marginTop: '40px',
          border: '1px solid rgba(251, 191, 36, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', margin: 0 }}>
              Methodology & Disclaimer
            </h4>
          </div>
          <p style={{ color: '#71717a', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
            Returns are estimated based on trade filing dates and market performance for traded securities.
            Actual returns may vary significantly. Congressional disclosures only require reporting within 45 days,
            so exact entry/exit prices are unknown. This is for educational and informational purposes only and should not be
            considered financial advice or a recommendation to follow any politician&apos;s trades.
          </p>
        </div>

      </main>
      <Footer />
    </>
  );
}
