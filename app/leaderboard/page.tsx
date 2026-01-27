import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import LeaderboardClient from './LeaderboardClient';

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

// Parse amount range to get midpoint estimate
function parseAmount(amount: string): number {
  if (!amount) return 0;
  
  // Handle exact amounts like "$15.00"
  const exactMatch = amount.match(/^\$?([\d,]+(?:\.\d{2})?)\s*$/);
  if (exactMatch) {
    return parseFloat(exactMatch[1].replace(/,/g, ''));
  }
  
  // Handle ranges like "$1,001 - $15,000"
  const rangeMatch = amount.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
    return (low + high) / 2;
  }
  
  return 0;
}

// Generate deterministic "returns" based on ticker and trade date for demo purposes
// In production, you'd use actual price data from an API
function estimateReturn(ticker: string, tradeDate: string, type: 'Purchase' | 'Sale'): number {
  // Use a simple hash of ticker + date to generate a pseudo-random but consistent return
  const hash = (ticker + tradeDate).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Tech stocks generally performed well
  const techTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'AVGO', 'AMD', 'PLTR', 'COIN'];
  const isTech = techTickers.includes(ticker);
  
  // Base return between -15% and +40%, skewed positive for tech
  const baseReturn = isTech 
    ? ((hash % 45) - 5) / 100  // -5% to +40%
    : ((hash % 40) - 15) / 100; // -15% to +25%
  
  // Purchases gain when price goes up, sales "gain" when sold before drop
  return type === 'Purchase' ? baseReturn : -baseReturn * 0.3;
}

function calculateLeaderboard(trades: CongressTrade[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  
  const politicianData = new Map<string, {
    party: string;
    chamber: string;
    trades: { amount: number; return: number; date: Date }[];
  }>();
  
  for (const trade of trades) {
    const tradeDate = new Date(trade.traded || trade.filed);
    const amount = parseAmount(trade.amount);
    const returnPct = estimateReturn(trade.ticker, trade.traded, trade.type);
    
    if (!politicianData.has(trade.politician)) {
      politicianData.set(trade.politician, {
        party: trade.party,
        chamber: trade.chamber,
        trades: []
      });
    }
    
    politicianData.get(trade.politician)!.trades.push({
      amount,
      return: returnPct,
      date: tradeDate
    });
  }
  
  const leaderboard = Array.from(politicianData.entries()).map(([name, data]) => {
    // Calculate weighted average return for different periods
    const calcReturn = (trades: typeof data.trades, cutoff: Date) => {
      const filtered = trades.filter(t => t.date >= cutoff);
      if (filtered.length === 0) return null;
      
      const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
      if (totalAmount === 0) return null;
      
      const weightedReturn = filtered.reduce((sum, t) => sum + t.return * t.amount, 0) / totalAmount;
      return weightedReturn;
    };
    
    const return30d = calcReturn(data.trades, thirtyDaysAgo);
    const return90d = calcReturn(data.trades, ninetyDaysAgo);
    const returnYTD = calcReturn(data.trades, yearStart);
    
    // Calculate total volume
    const totalVolume = data.trades.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name,
      party: data.party,
      chamber: data.chamber,
      tradeCount: data.trades.length,
      totalVolume,
      return30d,
      return90d,
      returnYTD
    };
  });
  
  // Sort by YTD return (or 90d if no YTD trades)
  leaderboard.sort((a, b) => {
    const aRet = a.returnYTD ?? a.return90d ?? a.return30d ?? -999;
    const bRet = b.returnYTD ?? b.return90d ?? b.return30d ?? -999;
    return bRet - aRet;
  });
  
  return leaderboard;
}

function getTrades(): CongressTrade[] {
  try {
    const dataPath = join(process.cwd(), 'data', 'congress-trades.json');
    if (!existsSync(dataPath)) return [];
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export default function LeaderboardPage() {
  const trades = getTrades();
  const leaderboard = calculateLeaderboard(trades);
  
  return <LeaderboardClient leaderboard={leaderboard} />;
}
