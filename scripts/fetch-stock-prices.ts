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
  
  // Phase 1: Get current prices for all tickers (most important for leaderboard)
  const needsCurrentPrice = tickers.filter(t => !cache[t] || cache[t].lastUpdated !== today);
  console.log(`Phase 1: Fetching current prices for ${needsCurrentPrice.length} tickers...\n`);
  
  for (let i = 0; i < needsCurrentPrice.length; i++) {
    const ticker = needsCurrentPrice[i];
    
    if (!cache[ticker]) {
      cache[ticker] = { prices: {}, lastUpdated: '' };
    }
    
    const currentPrice = await getCurrentPrice(ticker);
    if (currentPrice) {
      cache[ticker].prices[today] = currentPrice;
      cache[ticker].lastUpdated = today;
      fetched++;
    } else {
      failed++;
    }
    
    // Progress + save every 50 tickers
    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${needsCurrentPrice.length} (${fetched} ok, ${failed} failed)`);
      saveCache(cache);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Save after phase 1
  saveCache(cache);
  console.log(`\nPhase 1 done: ${fetched} fetched, ${failed} failed\n`);
  
  // Phase 2: Get historical trade-date prices (only for tickers we have current prices for)
  const tickersWithPrices = tickers.filter(t => cache[t]?.prices[today]);
  console.log(`Phase 2: Fetching historical prices for ${tickersWithPrices.length} tickers...\n`);
  
  let histFetched = 0;
  let histSkipped = 0;
  let tickersDone = 0;
  
  for (const ticker of tickersWithPrices) {
    const tickerTrades = trades.filter(t => t.ticker === ticker);
    // Only fetch unique trade dates we don't already have
    const needsDates = new Set<string>();
    for (const trade of tickerTrades) {
      const tradeDate = trade.traded || trade.filed;
      if (!tradeDate) continue;
      const dateKey = new Date(tradeDate).toISOString().split('T')[0];
      if (!cache[ticker].prices[dateKey]) {
        needsDates.add(dateKey);
      }
    }
    
    if (needsDates.size === 0) {
      histSkipped++;
      continue;
    }
    
    // Fetch entire history in one call instead of per-date
    try {
      const oldestDate = [...needsDates].sort()[0];
      const result = await yahooFinance.chart(ticker, {
        period1: new Date(oldestDate),
        period2: new Date(),
        interval: '1d'
      });
      
      if (result.quotes) {
        for (const quote of result.quotes) {
          const qDate = new Date(quote.date).toISOString().split('T')[0];
          if (quote.close) {
            cache[ticker].prices[qDate] = quote.close;
          }
        }
        histFetched++;
      }
    } catch (e) {
      // Skip failures silently
    }
    
    tickersDone++;
    if (tickersDone % 50 === 0) {
      console.log(`  Phase 2: ${tickersDone}/${tickersWithPrices.length}`);
      saveCache(cache);
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Count already cached
  cached = tickers.length - needsCurrentPrice.length;
  
  // Save cache
  saveCache(cache);
  
  // Final save
  saveCache(cache);
  
  console.log(`\n✅ Done!`);
  console.log(`   Current prices fetched: ${fetched}`);
  console.log(`   Historical tickers fetched: ${histFetched}`);
  console.log(`   Already cached: ${cached}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total tickers in cache: ${Object.keys(cache).length}`);
  console.log(`   Saved to: ${CACHE_PATH}`);
}

main().catch(console.error);
