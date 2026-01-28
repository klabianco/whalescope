/**
 * Fetch historical stock prices for congress trades
 * Uses Yahoo Finance to get actual price data
 */

import YahooFinanceModule from 'yahoo-finance2';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Yahoo Finance (v3 API)
const YahooFinance = YahooFinanceModule.default || YahooFinanceModule;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

interface CongressTrade {
  politician: string;
  ticker: string;
  type: 'Purchase' | 'Sale';
  traded: string;
  filed: string;
}

interface PriceCache {
  [ticker: string]: {
    prices: { [date: string]: number };
    lastUpdated: string;
  };
}

const CACHE_PATH = join(process.cwd(), 'data', 'stock-prices.json');

function loadCache(): PriceCache {
  try {
    if (existsSync(CACHE_PATH)) {
      return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.log('No existing cache, starting fresh');
  }
  return {};
}

function saveCache(cache: PriceCache) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function getHistoricalPrice(ticker: string, date: string): Promise<number | null> {
  try {
    const targetDate = new Date(date);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 7); // Go back a week to ensure we get data
    
    const result = await yahooFinance.chart(ticker, {
      period1: startDate,
      period2: new Date(), // Up to today
      interval: '1d'
    });
    
    if (!result.quotes || result.quotes.length === 0) {
      return null;
    }
    
    // Find the closest price to the target date
    const targetTime = targetDate.getTime();
    let closestQuote = result.quotes[0];
    let closestDiff = Math.abs(new Date(closestQuote.date).getTime() - targetTime);
    
    for (const quote of result.quotes) {
      const diff = Math.abs(new Date(quote.date).getTime() - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestQuote = quote;
      }
    }
    
    return closestQuote.close || null;
  } catch (e) {
    console.log(`  Failed to fetch ${ticker}: ${(e as Error).message}`);
    return null;
  }
}

async function getCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const quote = await yahooFinance.quote(ticker);
    return quote.regularMarketPrice || null;
  } catch (e) {
    console.log(`  Failed to fetch current price for ${ticker}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  console.log('📈 Fetching stock prices for congress trades...\n');
  
  // Load trades
  const tradesPath = join(process.cwd(), 'data', 'congress-trades.json');
  const trades: CongressTrade[] = JSON.parse(readFileSync(tradesPath, 'utf-8'));
  
  // Get unique tickers
  const tickers = [...new Set(trades.map(t => t.ticker))].filter(t => t && t.length <= 5);
  console.log(`Found ${tickers.length} unique tickers\n`);
  
  // Load existing cache
  const cache = loadCache();
  const today = new Date().toISOString().split('T')[0];
  
  let fetched = 0;
  let cached = 0;
  let failed = 0;
  
  for (const ticker of tickers) {
    // Initialize cache for ticker if needed
    if (!cache[ticker]) {
      cache[ticker] = { prices: {}, lastUpdated: '' };
    }
    
    // Get current price if not fetched today
    if (cache[ticker].lastUpdated !== today) {
      console.log(`Fetching ${ticker}...`);
      const currentPrice = await getCurrentPrice(ticker);
      if (currentPrice) {
        cache[ticker].prices[today] = currentPrice;
        cache[ticker].lastUpdated = today;
        fetched++;
      } else {
        failed++;
      }
      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    } else {
      cached++;
    }
    
    // Get historical prices for trade dates
    const tickerTrades = trades.filter(t => t.ticker === ticker);
    for (const trade of tickerTrades) {
      const tradeDate = trade.traded || trade.filed;
      if (!tradeDate) continue;
      
      const dateKey = new Date(tradeDate).toISOString().split('T')[0];
      
      // Skip if we already have this date
      if (cache[ticker].prices[dateKey]) continue;
      
      const price = await getHistoricalPrice(ticker, tradeDate);
      if (price) {
        cache[ticker].prices[dateKey] = price;
        fetched++;
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  // Save cache
  saveCache(cache);
  
  console.log(`\n✅ Done!`);
  console.log(`   Fetched: ${fetched}`);
  console.log(`   Cached: ${cached}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Saved to: ${CACHE_PATH}`);
}

main().catch(console.error);
