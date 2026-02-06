'use client';

import { useMemo } from 'react';

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

interface CongressInsight {
  type: 'clustering' | 'bipartisan' | 'party_pattern' | 'large_trade' | 'sector' | 'high_volume';
  emoji: string;
  headline: string;
  detail: string;
  trades: CongressTrade[];
  priority: number; // Higher = more important
}

// Parse amount range to get minimum value
function parseAmountMin(amount: string): number {
  if (!amount) return 0;
  
  // Handle ranges like "$500,001 - $1,000,000"
  const match = amount.match(/\$?([\d,]+)/);
  if (!match) return 0;
  
  return parseInt(match[1].replace(/,/g, ''), 10);
}

// Get amount tier for display
function getAmountTier(amount: string): string {
  const min = parseAmountMin(amount);
  if (min >= 5000000) return '$5M+';
  if (min >= 1000000) return '$1M+';
  if (min >= 500000) return '$500K+';
  if (min >= 250000) return '$250K+';
  if (min >= 100000) return '$100K+';
  if (min >= 50000) return '$50K+';
  return amount;
}

// Check if trade is within a date range (days ago)
function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

// Map tickers to sectors (simplified)
const SECTOR_MAP: Record<string, string> = {
  // Tech
  AAPL: 'Tech', MSFT: 'Tech', GOOGL: 'Tech', GOOG: 'Tech', META: 'Tech', AMZN: 'Tech',
  NVDA: 'Tech', AMD: 'Tech', INTC: 'Tech', TSM: 'Tech', AVGO: 'Tech', CRM: 'Tech',
  ORCL: 'Tech', ADBE: 'Tech', IBM: 'Tech', NFLX: 'Tech',
  // Finance
  JPM: 'Finance', BAC: 'Finance', WFC: 'Finance', GS: 'Finance', MS: 'Finance',
  C: 'Finance', V: 'Finance', MA: 'Finance', AXP: 'Finance', PYPL: 'Finance',
  // Healthcare
  JNJ: 'Healthcare', UNH: 'Healthcare', PFE: 'Healthcare', MRK: 'Healthcare',
  ABBV: 'Healthcare', LLY: 'Healthcare', TMO: 'Healthcare', ABT: 'Healthcare',
  AMGN: 'Healthcare', VRTX: 'Healthcare', BMY: 'Healthcare',
  // Defense
  LMT: 'Defense', RTX: 'Defense', NOC: 'Defense', BA: 'Defense', GD: 'Defense',
  // Energy
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', EOG: 'Energy', SLB: 'Energy',
  // Consumer
  WMT: 'Consumer', HD: 'Consumer', MCD: 'Consumer', SBUX: 'Consumer', NKE: 'Consumer',
  KO: 'Consumer', PEP: 'Consumer', PG: 'Consumer', COST: 'Consumer', DIS: 'Consumer',
  // Crypto/Digital Assets
  IREN: 'Crypto Mining', MARA: 'Crypto Mining', RIOT: 'Crypto Mining', COIN: 'Crypto',
};

function getSector(ticker: string): string {
  return SECTOR_MAP[ticker] || 'Other';
}

// Known high-profile traders
const HIGH_PROFILE_TRADERS = [
  'Nancy Pelosi',
  'Tommy Tuberville',
  'Dan Crenshaw',
  'Marjorie Taylor Greene',
];

export function generateCongressInsights(trades: CongressTrade[]): CongressInsight[] {
  const insights: CongressInsight[] = [];
  const recentTrades = trades.filter(t => isWithinDays(t.filed, 14));
  
  // === 1. Large Trade Detection ===
  const largeTrades = recentTrades.filter(t => {
    const min = parseAmountMin(t.amount);
    return min >= 100000;
  });
  
  // Group by tier
  const millionPlusTrades = largeTrades.filter(t => parseAmountMin(t.amount) >= 1000000);
  const halfMillionTrades = largeTrades.filter(t => {
    const min = parseAmountMin(t.amount);
    return min >= 500000 && min < 1000000;
  });
  
  // Report individual $1M+ trades (they're rare and significant)
  for (const trade of millionPlusTrades) {
    const isHighProfile = HIGH_PROFILE_TRADERS.includes(trade.politician);
    insights.push({
      type: 'large_trade',
      emoji: '💰',
      headline: `${getAmountTier(trade.amount)} ${trade.type.toLowerCase()} by ${trade.politician}`,
      detail: `${trade.politician} (${trade.party}) ${trade.type === 'Purchase' ? 'bought' : 'sold'} ${trade.ticker}${trade.company ? ` (${trade.company})` : ''} — filed ${trade.filed}`,
      trades: [trade],
      priority: isHighProfile ? 95 : 90,
    });
  }
  
  // === 2. Ticker Clustering Detection ===
  const tickerGroups = new Map<string, CongressTrade[]>();
  for (const trade of recentTrades) {
    const existing = tickerGroups.get(trade.ticker) || [];
    existing.push(trade);
    tickerGroups.set(trade.ticker, existing);
  }
  
  for (const [ticker, tickerTrades] of tickerGroups) {
    if (tickerTrades.length < 2) continue;
    
    // Check for same-direction clustering
    const buys = tickerTrades.filter(t => t.type === 'Purchase');
    const sells = tickerTrades.filter(t => t.type === 'Sale');
    
    // Multiple politicians buying same stock
    const uniqueBuyers = new Set(buys.map(t => t.politician));
    const uniqueSellers = new Set(sells.map(t => t.politician));
    
    if (uniqueBuyers.size >= 3) {
      const parties = new Set(buys.map(t => t.party));
      const isBipartisan = parties.has('D') && parties.has('R');
      
      if (isBipartisan) {
        insights.push({
          type: 'bipartisan',
          emoji: '⚖️',
          headline: `Bipartisan buying: ${uniqueBuyers.size} politicians buying ${ticker}`,
          detail: `Both parties accumulating ${ticker} — strong consensus signal`,
          trades: buys,
          priority: 85,
        });
      } else {
        insights.push({
          type: 'clustering',
          emoji: '🏛️',
          headline: `${uniqueBuyers.size} politicians buying ${ticker}`,
          detail: `Unusual clustering — multiple members taking the same position`,
          trades: buys,
          priority: 75,
        });
      }
    }
    
    if (uniqueSellers.size >= 3) {
      const parties = new Set(sells.map(t => t.party));
      const isBipartisan = parties.has('D') && parties.has('R');
      
      if (isBipartisan) {
        insights.push({
          type: 'bipartisan',
          emoji: '⚖️',
          headline: `Bipartisan selling: ${uniqueSellers.size} politicians selling ${ticker}`,
          detail: `Both parties exiting ${ticker} — potential red flag`,
          trades: sells,
          priority: 85,
        });
      } else {
        insights.push({
          type: 'clustering',
          emoji: '🏛️',
          headline: `${uniqueSellers.size} politicians sold ${ticker}`,
          detail: `Unusual clustering — multiple members exiting the same position`,
          trades: sells,
          priority: 75,
        });
      }
    }
  }
  
  // === 3. Party Pattern Detection ===
  const partyTickerBuys = new Map<string, { D: number; R: number; I: number }>();
  const partyTickerSells = new Map<string, { D: number; R: number; I: number }>();
  
  for (const trade of recentTrades) {
    const key = trade.ticker;
    const map = trade.type === 'Purchase' ? partyTickerBuys : partyTickerSells;
    const existing = map.get(key) || { D: 0, R: 0, I: 0 };
    existing[trade.party]++;
    map.set(key, existing);
  }
  
  // Look for strong party patterns (3+ from one party, 0 from other)
  for (const [ticker, counts] of partyTickerBuys) {
    if (counts.D >= 3 && counts.R === 0) {
      const dTrades = recentTrades.filter(t => t.ticker === ticker && t.party === 'D' && t.type === 'Purchase');
      insights.push({
        type: 'party_pattern',
        emoji: '🔵',
        headline: `Democrats accumulating ${ticker}`,
        detail: `${counts.D} Democrats buying ${ticker}, no Republicans — party-line signal`,
        trades: dTrades,
        priority: 65,
      });
    }
    if (counts.R >= 3 && counts.D === 0) {
      const rTrades = recentTrades.filter(t => t.ticker === ticker && t.party === 'R' && t.type === 'Purchase');
      insights.push({
        type: 'party_pattern',
        emoji: '🔴',
        headline: `Republicans accumulating ${ticker}`,
        detail: `${counts.R} Republicans buying ${ticker}, no Democrats — party-line signal`,
        trades: rTrades,
        priority: 65,
      });
    }
  }
  
  // === 4. Sector Concentration ===
  const sectorBuys = new Map<string, CongressTrade[]>();
  const sectorSells = new Map<string, CongressTrade[]>();
  
  for (const trade of recentTrades) {
    const sector = getSector(trade.ticker);
    if (sector === 'Other') continue;
    
    const map = trade.type === 'Purchase' ? sectorBuys : sectorSells;
    const existing = map.get(sector) || [];
    existing.push(trade);
    map.set(sector, existing);
  }
  
  for (const [sector, sectorTrades] of sectorBuys) {
    const uniqueTraders = new Set(sectorTrades.map(t => t.politician));
    if (uniqueTraders.size >= 4) {
      insights.push({
        type: 'sector',
        emoji: '📊',
        headline: `${sector} sector: ${uniqueTraders.size} politicians buying`,
        detail: `Heavy accumulation in ${sector} stocks this week`,
        trades: sectorTrades.slice(0, 5),
        priority: 60,
      });
    }
  }
  
  for (const [sector, sectorTrades] of sectorSells) {
    const uniqueTraders = new Set(sectorTrades.map(t => t.politician));
    if (uniqueTraders.size >= 4) {
      insights.push({
        type: 'sector',
        emoji: '📉',
        headline: `${sector} sector: ${uniqueTraders.size} politicians selling`,
        detail: `Notable selling pressure in ${sector} stocks`,
        trades: sectorTrades.slice(0, 5),
        priority: 60,
      });
    }
  }
  
  // === 5. High Volume Trader Alert ===
  const traderCounts = new Map<string, CongressTrade[]>();
  for (const trade of recentTrades) {
    const existing = traderCounts.get(trade.politician) || [];
    existing.push(trade);
    traderCounts.set(trade.politician, existing);
  }
  
  for (const [politician, politicianTrades] of traderCounts) {
    if (politicianTrades.length >= 10) {
      const buys = politicianTrades.filter(t => t.type === 'Purchase').length;
      const sells = politicianTrades.filter(t => t.type === 'Sale').length;
      insights.push({
        type: 'high_volume',
        emoji: '🔥',
        headline: `${politician} filed ${politicianTrades.length} trades`,
        detail: `Active trading: ${buys} buys, ${sells} sells in the last 2 weeks`,
        trades: politicianTrades.slice(0, 5),
        priority: 55,
      });
    }
  }
  
  // === 6. Notable Half-Million Trades ===
  if (halfMillionTrades.length > 0 && halfMillionTrades.length <= 3) {
    for (const trade of halfMillionTrades) {
      // Only if not already covered by a clustering insight
      const alreadyCovered = insights.some(
        i => i.trades.some(t => t.politician === trade.politician && t.ticker === trade.ticker)
      );
      if (!alreadyCovered) {
        insights.push({
          type: 'large_trade',
          emoji: '💵',
          headline: `${getAmountTier(trade.amount)} ${trade.type.toLowerCase()} in ${trade.ticker}`,
          detail: `${trade.politician} (${trade.party}-${trade.chamber}) — filed ${trade.filed}`,
          trades: [trade],
          priority: 70,
        });
      }
    }
  }
  
  // Sort by priority and deduplicate
  const sortedInsights = insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
  
  return sortedInsights;
}

export function CongressAIInsightPanel({ trades }: { trades: CongressTrade[] }) {
  const insights = useMemo(() => generateCongressInsights(trades), [trades]);
  
  if (insights.length === 0) return null;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1025 100%)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#fff',
          margin: 0,
        }}>
          AI Analysis
        </h2>
        <span style={{
          background: 'rgba(139, 92, 246, 0.2)',
          color: '#a78bfa',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '500',
        }}>
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight, i) => (
          <div key={`insight-${i}`} style={{
            background: '#111118',
            borderRadius: '12px',
            padding: '14px 16px',
          }}>
            {/* Headline */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '16px' }}>{insight.emoji}</span>
              <span style={{ 
                color: '#fff', 
                fontWeight: '600', 
                fontSize: '14px',
              }}>
                {insight.headline}
              </span>
              <span style={{
                background: getInsightTypeBg(insight.type),
                color: getInsightTypeColor(insight.type),
                padding: '2px 8px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: '600',
                textTransform: 'uppercase',
                marginLeft: 'auto',
              }}>
                {insight.type.replace('_', ' ')}
              </span>
            </div>

            {/* Detail */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.08)',
              borderLeft: '3px solid #8b5cf6',
              padding: '10px 12px',
              borderRadius: '0 8px 8px 0',
              fontSize: '13px',
              color: '#c4b5fd',
              lineHeight: '1.5',
            }}>
              <span style={{ marginRight: '6px' }}>💡</span>
              {insight.detail}
            </div>
            
            {/* Trade chips */}
            {insight.trades.length > 1 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginTop: '10px',
              }}>
                {insight.trades.slice(0, 4).map((trade, j) => (
                  <span
                    key={`trade-${j}`}
                    style={{
                      background: trade.party === 'D' ? 'rgba(59, 130, 246, 0.15)' : 
                                  trade.party === 'R' ? 'rgba(239, 68, 68, 0.15)' : 
                                  'rgba(156, 163, 175, 0.15)',
                      color: trade.party === 'D' ? '#60a5fa' : 
                             trade.party === 'R' ? '#f87171' : '#9ca3af',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                  >
                    {trade.politician.split(' ').slice(-1)[0]} ({trade.party})
                  </span>
                ))}
                {insight.trades.length > 4 && (
                  <span style={{
                    color: '#666',
                    fontSize: '11px',
                    padding: '3px 0',
                  }}>
                    +{insight.trades.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '12px',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center',
      }}>
        AI insights generated from congressional trading patterns and disclosures
      </div>
    </div>
  );
}

function getInsightTypeBg(type: CongressInsight['type']): string {
  switch (type) {
    case 'bipartisan': return 'rgba(168, 85, 247, 0.2)';
    case 'clustering': return 'rgba(59, 130, 246, 0.2)';
    case 'party_pattern': return 'rgba(234, 179, 8, 0.2)';
    case 'large_trade': return 'rgba(34, 197, 94, 0.2)';
    case 'sector': return 'rgba(236, 72, 153, 0.2)';
    case 'high_volume': return 'rgba(249, 115, 22, 0.2)';
    default: return 'rgba(107, 114, 128, 0.2)';
  }
}

function getInsightTypeColor(type: CongressInsight['type']): string {
  switch (type) {
    case 'bipartisan': return '#c084fc';
    case 'clustering': return '#60a5fa';
    case 'party_pattern': return '#facc15';
    case 'large_trade': return '#4ade80';
    case 'sector': return '#f472b6';
    case 'high_volume': return '#fb923c';
    default: return '#9ca3af';
  }
}

export default CongressAIInsightPanel;
