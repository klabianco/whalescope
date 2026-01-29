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

interface PriceCache {
  [ticker: string]: {
    prices: { [date: string]: number };
    lastUpdated: string;
  };
}

// Load stock price cache
function loadPriceCache(): PriceCache {
  try {
    const cachePath = join(process.cwd(), 'data', 'stock-prices.json');
    if (existsSync(cachePath)) {
      return JSON.parse(readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.log('No price cache available');
  }
  return {};
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

// Calculate actual return from price cache
function calculateReturn(ticker: string, tradeDate: string, type: 'Purchase' | 'Sale', priceCache: PriceCache): number | null {
  const tickerData = priceCache[ticker];
  if (!tickerData || !tickerData.prices) return null;
  
  const tradeDateKey = new Date(tradeDate).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const buyPrice = tickerData.prices[tradeDateKey];
  const currentPrice = tickerData.prices[today] || tickerData.prices[tickerData.lastUpdated];
  
  if (!buyPrice || !currentPrice) return null;
  
  // Calculate percentage return
  const returnPct = (currentPrice - buyPrice) / buyPrice;
  
  // For purchases: gain when price goes up
  // For sales: we measure if they sold before a drop (inverted)
  return type === 'Purchase' ? returnPct : -returnPct;
}

function calculateLeaderboard(trades: CongressTrade[], priceCache: PriceCache) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  
  const politicianData = new Map<string, {
    party: string;
    chamber: string;
    trades: { amount: number; return: number | null; date: Date }[];
  }>();
  
  for (const trade of trades) {
    const tradeDate = new Date(trade.traded || trade.filed);
    const amount = parseAmount(trade.amount);
    const returnPct = calculateReturn(trade.ticker, trade.traded || trade.filed, trade.type, priceCache);
    
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
      const filtered = trades.filter(t => t.date >= cutoff && t.return !== null);
      if (filtered.length === 0) return null;
      
      const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
      if (totalAmount === 0) return null;
      
      const weightedReturn = filtered.reduce((sum, t) => sum + (t.return || 0) * t.amount, 0) / totalAmount;
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
  const priceCache = loadPriceCache();
  const leaderboard = calculateLeaderboard(trades, priceCache).slice(0, 50);
  
  return <LeaderboardClient leaderboard={leaderboard} />;
}
