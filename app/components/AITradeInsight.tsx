'use client';

import { useMemo } from 'react';

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

interface WalletPattern {
  tradeCount30d: number;
  winRate: number | null;
  avgHoldTimeDays: number | null;
  favoriteToken: string | null;
}

// Heuristic-based AI insight generator
// Analyzes trade context and generates human-readable explanations
export function generateTradeInsight(
  trade: WhaleTrade,
  usdValue: number,
  walletPattern?: WalletPattern,
  recentTrades?: WhaleTrade[]
): string | null {
  // Only generate insights for significant trades
  if (usdValue < 10000) return null;

  const insights: string[] = [];
  const symbol = trade.tokenSymbol || trade.boughtSymbol || trade.soldSymbol || 'unknown token';
  const walletName = trade.walletLabel || 'This whale';
  const action = trade.action === 'BUY' ? 'bought' : 'sold';

  // 1. Size-based insight
  if (usdValue >= 1000000) {
    insights.push(`🐋 Massive move: $${(usdValue / 1000000).toFixed(1)}M position`);
  } else if (usdValue >= 100000) {
    insights.push(`💰 Large position: $${(usdValue / 1000).toFixed(0)}K`);
  } else if (usdValue >= 50000) {
    insights.push(`📊 Significant trade: $${(usdValue / 1000).toFixed(0)}K`);
  }

  // 2. Wallet reputation insight
  if (walletPattern) {
    if (walletPattern.winRate !== null && walletPattern.winRate >= 70) {
      insights.push(`🎯 High-conviction trader (${walletPattern.winRate.toFixed(0)}% win rate)`);
    } else if (walletPattern.tradeCount30d >= 20) {
      insights.push(`🔥 Highly active trader (${walletPattern.tradeCount30d} trades this month)`);
    } else if (walletPattern.tradeCount30d <= 3 && walletPattern.tradeCount30d > 0) {
      insights.push(`👀 Rarely trades — this move stands out`);
    }
  }

  // 3. Token-specific insights based on common patterns
  const lowerSymbol = symbol.toLowerCase();
  
  if (symbol === 'SOL') {
    if (trade.action === 'BUY') {
      insights.push(`Accumulating SOL — bullish on the ecosystem`);
    } else {
      insights.push(`Taking profits or rotating out of SOL`);
    }
  } else if (['USDC', 'USDT'].includes(symbol)) {
    if (trade.action === 'BUY') {
      insights.push(`Moving to stables — possible risk-off move`);
    }
  } else if (lowerSymbol.includes('ai') || lowerSymbol.includes('gpt')) {
    insights.push(`AI narrative token — sector is hot with institutional interest`);
  } else if (lowerSymbol.includes('meme') || lowerSymbol.includes('pepe') || lowerSymbol.includes('doge') || lowerSymbol.includes('shib')) {
    insights.push(`Meme coin play — high risk, high reward territory`);
  }

  // 4. Timing insights
  const now = Date.now() / 1000;
  const tradeAge = now - trade.timestamp;
  
  if (tradeAge < 3600) { // Less than 1 hour old
    insights.push(`⚡ Fresh move — just happened`);
  }

  // 5. Pattern detection from recent trades
  if (recentTrades && recentTrades.length >= 3) {
    const sameTokenTrades = recentTrades.filter(t => 
      (t.tokenSymbol === symbol || t.boughtSymbol === symbol || t.soldSymbol === symbol) &&
      t.wallet !== trade.wallet
    ).slice(0, 5);

    if (sameTokenTrades.length >= 2) {
      const sameDirTrades = sameTokenTrades.filter(t => t.action === trade.action);
      if (sameDirTrades.length >= 2) {
        insights.push(`📈 Multiple whales ${action} ${symbol} recently — coordinated move?`);
      }
    }
  }

  // 6. Wallet value context
  const walletVal = parseWalletValue(trade.walletValue);
  if (walletVal && usdValue > 0) {
    const percentOfPortfolio = (usdValue / walletVal) * 100;
    if (percentOfPortfolio >= 10) {
      insights.push(`🎯 Major allocation: ~${percentOfPortfolio.toFixed(0)}% of their portfolio`);
    } else if (percentOfPortfolio >= 5) {
      insights.push(`Meaningful position size for this wallet`);
    }
  }

  // Return the most relevant insight (limit to 2 for readability)
  if (insights.length === 0) return null;
  
  return insights.slice(0, 2).join(' • ');
}

function parseWalletValue(value: string): number | null {
  if (!value) return null;
  const match = value.match(/\$?([\d.]+)\s*(M|K)?/i);
  if (!match) return null;
  
  const num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  
  if (suffix === 'M') return num * 1000000;
  if (suffix === 'K') return num * 1000;
  return num;
}

// Compact inline insight badge
export function TradeInsightBadge({ insight }: { insight: string }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      borderRadius: '8px',
      padding: '8px 12px',
      marginTop: '8px',
      fontSize: '12px',
      color: '#a78bfa',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}>
      <span style={{ fontSize: '14px' }}>🤖</span>
      <span style={{ lineHeight: '1.4' }}>{insight}</span>
    </div>
  );
}

// Widget panel for showing multiple AI insights
export function AIInsightPanel({
  trades,
  getUsdValue,
  walletPatterns,
  limit = 5,
}: {
  trades: WhaleTrade[];
  getUsdValue: (trade: WhaleTrade) => number;
  walletPatterns?: Map<string, WalletPattern>;
  limit?: number;
}) {
  const significantTrades = useMemo(() => {
    return trades
      .map(trade => ({
        trade,
        usdValue: getUsdValue(trade),
        insight: generateTradeInsight(
          trade,
          getUsdValue(trade),
          walletPatterns?.get(trade.wallet),
          trades
        ),
      }))
      .filter(t => t.insight !== null && t.usdValue >= 10000)
      .slice(0, limit);
  }, [trades, getUsdValue, walletPatterns, limit]);

  if (significantTrades.length === 0) return null;

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
          {significantTrades.length} insight{significantTrades.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {significantTrades.map(({ trade, usdValue, insight }, i) => {
          const symbol = trade.tokenSymbol || trade.boughtSymbol || trade.soldSymbol || '???';
          const isBuy = trade.action === 'BUY';
          
          return (
            <div key={`${trade.signature}-${i}`} style={{
              background: '#111118',
              borderRadius: '12px',
              padding: '14px 16px',
            }}>
              {/* Trade summary */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  background: isBuy ? '#064e3b' : '#7f1d1d',
                  color: isBuy ? '#4ade80' : '#f87171',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}>
                  {trade.action}
                </span>
                <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '15px' }}>
                  {symbol}
                </span>
                <span style={{ color: '#888', fontSize: '13px' }}>
                  ${usdValue >= 1000000 
                    ? (usdValue / 1000000).toFixed(1) + 'M'
                    : (usdValue / 1000).toFixed(0) + 'K'}
                </span>
                <span style={{ 
                  color: '#666', 
                  fontSize: '12px',
                  marginLeft: 'auto',
                }}>
                  by {trade.walletLabel?.slice(0, 20) || trade.wallet.slice(0, 8)}...
                </span>
              </div>

              {/* AI Insight */}
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
                {insight}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '12px',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center',
      }}>
        AI insights generated from on-chain patterns and wallet behavior
      </div>
    </div>
  );
}

// Hook for easy integration
export function useTradeInsight(
  trade: WhaleTrade,
  usdValue: number,
  walletPattern?: WalletPattern,
  recentTrades?: WhaleTrade[]
): string | null {
  return useMemo(
    () => generateTradeInsight(trade, usdValue, walletPattern, recentTrades),
    [trade, usdValue, walletPattern, recentTrades]
  );
}
