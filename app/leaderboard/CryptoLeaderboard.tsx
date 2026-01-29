'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface CryptoEntry {
  address: string;
  name: string;
  type: string;
  totalUSD: string;
  totalUSDRaw: number;
  topHoldings: string[];
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  totalCost: number;
  totalCurrentValue: number;
  roiPct: number;
}

interface Props {
  entries: CryptoEntry[];
}

type SortBy = 'roi' | 'holdings' | 'trades';

// Filter out bots, automated traders, protocols, and market makers
const BOT_KEYWORDS = ['bot', 'automated', 'liquidity', 'protocol', 'market maker', 'raydium', 'jupiter', 'kamino', 'drift', 'pump.fun', 'wormhole', 'meteora', 'marginfi'];

function isBotEntry(entry: CryptoEntry): boolean {
  const name = entry.name.toLowerCase();
  return BOT_KEYWORDS.some(kw => name.includes(kw));
}

function formatReturn(value: number): string {
  const pct = (value * 100).toFixed(2);
  return value >= 0 ? `+${pct}%` : `${pct}%`;
}

function getReturnColor(value: number): string {
  if (value >= 0.15) return '#22c55e';
  if (value >= 0) return '#4ade80';
  if (value >= -0.1) return '#f87171';
  return '#ef4444';
}

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function CryptoLeaderboard({ entries }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('roi');

  const sorted = useMemo(() => {
    const list = entries.filter(e => !isBotEntry(e));
    list.sort((a, b) => {
      if (sortBy === 'roi') return b.roiPct - a.roiPct;
      if (sortBy === 'holdings') return b.totalUSDRaw - a.totalUSDRaw;
      return b.tradeCount - a.tradeCount;
    });
    return list.slice(0, 50);
  }, [entries, sortBy]);

  // Show coming soon state if not enough real swap data
  if (sorted.length < 3) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #1c1917 0%, #09090b 100%)',
          border: '1px solid #27272a',
          borderRadius: '24px',
          padding: '48px 32px',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🐋</div>
          <h2 style={{ 
            fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px',
            background: 'linear-gradient(to right, #fff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Crypto Leaderboard Coming Soon
          </h2>
          <p style={{ color: '#71717a', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            We&apos;re collecting on-chain swap data from active Solana traders.
            Once we have enough real trades, this leaderboard will rank wallets by actual trading performance — not just holdings.
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fbbf24', fontSize: '24px', fontWeight: '700' }}>Swap-Only</div>
              <div style={{ color: '#52525b', fontSize: '13px', marginTop: '4px' }}>Real trades, not transfers</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '24px', fontWeight: '700' }}>On-Chain</div>
              <div style={{ color: '#52525b', fontSize: '13px', marginTop: '4px' }}>Verified DEX activity</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#60a5fa', fontSize: '24px', fontWeight: '700' }}>Real ROI</div>
              <div style={{ color: '#52525b', fontSize: '13px', marginTop: '4px' }}>Cost basis vs current value</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const top3 = sorted.slice(0, 3);

  return (
    <>
      <style>{`
        @media (max-width: 639px) {
          .crypto-podium-grid {
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 8px !important;
          }
          .crypto-podium-card { padding: 16px 8px !important; }
          .crypto-podium-card .cp-name { font-size: 12px !important; }
          .crypto-podium-card .cp-value { font-size: 20px !important; }
          .crypto-podium-first { padding: 20px 8px !important; }
          .crypto-podium-first .cp-value { font-size: 26px !important; }
          .crypto-podium-card .cp-meta { display: none; }
          .crypto-controls { flex-direction: column !important; }
          .crypto-row { grid-template-columns: 36px 1fr 80px !important; padding: 12px !important; }
          .crypto-row .cr-holdings, .crypto-row .cr-trades { display: none !important; }
          .crypto-header { grid-template-columns: 36px 1fr 80px !important; padding: 12px !important; }
          .crypto-header .ch-holdings, .crypto-header .ch-trades { display: none !important; }
        }
        @media (min-width: 640px) {
          .crypto-row { grid-template-columns: 50px 1fr 100px 100px 100px !important; }
          .crypto-header { grid-template-columns: 50px 1fr 100px 100px 100px !important; }
        }
      `}</style>

      {/* Podium - Top 3 */}
      {top3.length >= 3 && (
        <div className="crypto-podium-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr 1fr',
          gap: '12px',
          marginBottom: '48px',
          alignItems: 'end',
        }}>
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            const place = [2, 1, 3][i];
            const isFirst = place === 1;
            const displayName = entry.name.includes('...') ? shortAddress(entry.address) : entry.name;
            return (
              <Link key={entry.address} href={`/wallet/${entry.address}`} style={{ textDecoration: 'none' }}>
                <div
                  className={`crypto-podium-card ${isFirst ? 'crypto-podium-first' : ''}`}
                  style={{
                    background: isFirst
                      ? 'linear-gradient(180deg, #422006 0%, #1c1917 100%)'
                      : 'linear-gradient(180deg, #27272a 0%, #18181b 100%)',
                    padding: isFirst ? '36px 24px' : '28px 20px',
                    borderRadius: isFirst ? '24px' : '20px',
                    textAlign: 'center',
                    border: isFirst ? '1px solid #854d0e' : '1px solid #3f3f46',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isFirst ? '0 0 60px rgba(251, 191, 36, 0.15)' : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: isFirst ? '4px' : '3px',
                    background: isFirst
                      ? 'linear-gradient(90deg, transparent, #fbbf24, transparent)'
                      : place === 2
                        ? 'linear-gradient(90deg, transparent, #a1a1aa, transparent)'
                        : 'linear-gradient(90deg, transparent, #a16207, transparent)',
                  }} />
                  <div style={{
                    fontSize: '14px',
                    color: isFirst ? '#fbbf24' : place === 2 ? '#a1a1aa' : '#a16207',
                    fontWeight: '600', marginBottom: '16px', letterSpacing: '2px',
                  }}>
                    {isFirst ? '🏆 #1' : `#${place}`}
                  </div>
                  <div className="cp-name" style={{ color: '#fff', fontWeight: '600', fontSize: isFirst ? '18px' : '15px', marginBottom: '8px' }}>
                    {displayName}
                  </div>
                  <div className="cp-value" style={{
                    color: isFirst ? '#fbbf24' : getReturnColor(entry.roiPct),
                    fontSize: isFirst ? '36px' : '28px',
                    fontWeight: '700', letterSpacing: '-1px',
                  }}>
                    {formatReturn(entry.roiPct)}
                  </div>
                  <div className="cp-meta" style={{ color: '#71717a', fontSize: '13px', marginTop: '8px' }}>
                    {entry.tradeCount} trades · {formatUSD(entry.totalUSDRaw)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="crypto-controls" style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        marginBottom: '24px', gap: '12px',
        background: '#18181b', padding: '12px 16px', borderRadius: '12px', border: '1px solid #27272a',
      }}>
        <span style={{ color: '#52525b', fontSize: '14px', fontWeight: '500' }}>Sort by</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            { key: 'roi', label: 'ROI' },
            { key: 'holdings', label: 'Holdings' },
            { key: 'trades', label: 'Trades' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                padding: '8px 16px', background: sortBy === key ? '#3f3f46' : 'transparent',
                color: sortBy === key ? '#fff' : '#71717a',
                border: '1px solid', borderColor: sortBy === key ? '#3f3f46' : '#27272a',
                borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: sortBy === key ? '500' : '400',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: '#09090b', borderRadius: '16px', overflow: 'hidden', border: '1px solid #27272a',
      }}>
        {/* Header */}
        <div className="crypto-header" style={{
          display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px 100px',
          padding: '16px', background: '#18181b', borderBottom: '1px solid #27272a',
          fontSize: '11px', color: '#52525b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          <div>Rank</div>
          <div>Wallet</div>
          <div className="ch-holdings" style={{ textAlign: 'right' }}>Holdings</div>
          <div className="ch-trades" style={{ textAlign: 'right' }}>Trades</div>
          <div style={{ textAlign: 'right' }}>ROI</div>
        </div>

        {/* Rows */}
        {sorted.map((entry, index) => {
          const displayName = entry.name.includes('...') ? shortAddress(entry.address) : entry.name;
          // Show wallet value subtitle only when this entry is tied with its neighbor
          const prevROI = index > 0 ? formatReturn(sorted[index - 1].roiPct) : null;
          const nextROI = index < sorted.length - 1 ? formatReturn(sorted[index + 1].roiPct) : null;
          const thisROI = formatReturn(entry.roiPct);
          const isTied = thisROI === prevROI || thisROI === nextROI;
          return (
            <Link key={entry.address} href={`/wallet/${entry.address}`} style={{ textDecoration: 'none' }}>
              <div
                className="crypto-row"
                style={{
                  display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px 100px',
                  padding: '14px 16px', borderBottom: index < sorted.length - 1 ? '1px solid #1f1f23' : 'none',
                  alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#18181b'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  color: index < 3 ? '#fbbf24' : '#52525b', fontWeight: '600', fontSize: '14px',
                  fontFamily: 'ui-monospace, monospace',
                }}>
                  #{index + 1}
                </div>
                <div>
                  <div style={{ color: '#fafafa', fontWeight: '500', fontSize: '14px' }}>{displayName}</div>
                  {isTied && (
                    <div style={{ color: '#52525b', fontSize: '12px', marginTop: '2px' }}>
                      {formatUSD(entry.totalUSDRaw)} total value
                    </div>
                  )}
                </div>
                <div className="cr-holdings" style={{ textAlign: 'right', color: '#a1a1aa', fontSize: '13px', fontFamily: 'ui-monospace, monospace' }}>
                  {formatUSD(entry.totalUSDRaw)}
                </div>
                <div className="cr-trades" style={{ textAlign: 'right', color: '#71717a', fontSize: '13px', fontFamily: 'ui-monospace, monospace' }}>
                  {entry.tradeCount}
                </div>
                <div style={{
                  textAlign: 'right', color: getReturnColor(entry.roiPct),
                  fontSize: '14px', fontWeight: '700', fontFamily: 'ui-monospace, monospace',
                }}>
                  {formatReturn(entry.roiPct)}
                </div>
              </div>
            </Link>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#52525b' }}>
            No ROI data available yet. Check back soon.
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.02) 100%)',
        padding: '24px', borderRadius: '12px', marginTop: '40px',
        border: '1px solid rgba(251, 191, 36, 0.15)',
      }}>
        <h4 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', margin: '0 0 12px' }}>
          Methodology & Disclaimer
        </h4>
        <p style={{ color: '#71717a', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
          ROI is estimated based on token prices at the time of each trade vs current market prices.
          Cost basis is calculated from on-chain swap data (SOL and stablecoin amounts).
          Only wallets with sufficient trade data are shown. This is for informational purposes only
          and should not be considered financial advice.
        </p>
      </div>
    </>
  );
}
