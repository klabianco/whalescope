/**
 * Compute crypto whale ROI from SWAP data only (not transfers).
 * A swap has a sold side and a bought side.
 * ROI = (current value of bought tokens - value of sold tokens at swap time) / cost
 * 
 * Outputs data/crypto-leaderboard.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Trade {
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
  action: string;
  isSwap?: boolean;
  soldMint?: string;
  soldSymbol?: string;
  soldAmount?: number;
  boughtMint?: string;
  boughtSymbol?: string;
  boughtAmount?: number;
}

interface Wallet {
  address: string;
  name: string;
  type: string;
  totalUSD: string;
  totalUSDRaw: number;
  topHoldings: string[];
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const STABLECOIN_MINTS = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);

// Fetch historical SOL prices from CoinGecko (daily granularity)
async function fetchSOLPriceHistory(): Promise<Map<string, number>> {
  const now = Math.floor(Date.now() / 1000);
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60;
  
  const url = `https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=usd&from=${ninetyDaysAgo}&to=${now}`;
  console.log('Fetching SOL price history from CoinGecko...');
  
  const res = await fetch(url);
  if (!res.ok) {
    console.error('CoinGecko API error:', res.status);
    return new Map();
  }
  
  const data = await res.json();
  const prices = new Map<string, number>();
  
  for (const [ts, price] of data.prices) {
    const date = new Date(ts).toISOString().split('T')[0];
    prices.set(date, price);
  }
  
  console.log(`Got ${prices.size} daily SOL prices`);
  return prices;
}

// Fetch current token prices from DexScreener
async function fetchCurrentPrices(mints: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  for (let i = 0; i < mints.length; i += 20) {
    const batch = mints.slice(i, i + 20);
    const url = `https://api.dexscreener.com/tokens/v1/solana/${batch.join(',')}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const pair of data) {
          const addr = pair.baseToken?.address;
          if (addr && pair.priceUsd && !prices.has(addr)) {
            prices.set(addr, parseFloat(pair.priceUsd));
          }
        }
      }
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`Got current prices for ${prices.size} tokens`);
  return prices;
}

function tsToDate(ts: number): string {
  return new Date(ts * 1000).toISOString().split('T')[0];
}

// Get USD value of a token amount at a specific time
function getValueAtTime(
  mint: string,
  amount: number,
  tradeDate: string,
  solHistory: Map<string, number>,
  currentPrices: Map<string, number>,
  currentSOLPrice: number,
): number | null {
  if (STABLECOIN_MINTS.has(mint)) return amount; // $1 each
  if (mint === SOL_MINT) {
    const price = solHistory.get(tradeDate) || currentSOLPrice;
    return amount * price;
  }
  // For other tokens, we don't have historical prices — use current as approximation
  // This is a known limitation but better than nothing for swap ROI
  const price = currentPrices.get(mint);
  if (price) return amount * price;
  return null;
}

// Get current USD value of a token amount
function getCurrentValue(
  mint: string,
  amount: number,
  currentPrices: Map<string, number>,
  currentSOLPrice: number,
): number | null {
  if (STABLECOIN_MINTS.has(mint)) return amount;
  if (mint === SOL_MINT) return amount * currentSOLPrice;
  const price = currentPrices.get(mint);
  if (price) return amount * price;
  return null;
}

async function main() {
  const dataDir = join(process.cwd(), 'data');
  
  const wallets: Wallet[] = JSON.parse(readFileSync(join(dataDir, 'whale-wallets.json'), 'utf-8')).wallets;
  const trades: Trade[] = JSON.parse(readFileSync(join(dataDir, 'whale-trades.json'), 'utf-8'));
  
  // Only use SWAP transactions with both sides
  const swapTrades = trades.filter(t => 
    t.isSwap && t.soldMint && t.boughtMint && t.soldAmount && t.boughtAmount
  );
  
  console.log(`Total trades: ${trades.length}`);
  console.log(`Swap trades with both sides: ${swapTrades.length}`);
  
  // Get all unique token mints from swaps
  const allMints = [...new Set([
    ...swapTrades.map(t => t.soldMint!),
    ...swapTrades.map(t => t.boughtMint!),
  ])];
  
  // Fetch prices
  const solHistory = await fetchSOLPriceHistory();
  const currentPrices = await fetchCurrentPrices(allMints);
  
  const currentSOLPrice = currentPrices.get(SOL_MINT) || 0;
  console.log(`Current SOL price: $${currentSOLPrice}`);
  
  // Calculate ROI per wallet from swaps only
  const walletData: Record<string, {
    totalCostBasis: number;   // USD value of what they sold at time of swap
    totalCurrentValue: number; // USD value of what they bought at current prices
    swapCount: number;
    validSwaps: number;       // swaps where we could calculate both sides
  }> = {};
  
  for (const trade of swapTrades) {
    const w = trade.wallet;
    if (!walletData[w]) {
      walletData[w] = { totalCostBasis: 0, totalCurrentValue: 0, swapCount: 0, validSwaps: 0 };
    }
    
    walletData[w].swapCount++;
    
    const tradeDate = tsToDate(trade.timestamp);
    
    // Cost = value of what they gave up at time of swap
    const costBasis = getValueAtTime(
      trade.soldMint!, trade.soldAmount!, tradeDate,
      solHistory, currentPrices, currentSOLPrice
    );
    
    // Current value = what they got, valued at TODAY's price
    const currentValue = getCurrentValue(
      trade.boughtMint!, trade.boughtAmount!,
      currentPrices, currentSOLPrice
    );
    
    if (costBasis !== null && currentValue !== null && costBasis > 0) {
      walletData[w].totalCostBasis += costBasis;
      walletData[w].totalCurrentValue += currentValue;
      walletData[w].validSwaps++;
    }
  }
  
  // Build leaderboard
  const walletMap = new Map(wallets.map(w => [w.address, w]));
  const leaderboard = [];
  
  for (const [addr, data] of Object.entries(walletData)) {
    if (data.validSwaps === 0 || data.totalCostBasis < 10) continue;
    
    const wallet = walletMap.get(addr);
    if (!wallet) continue;
    
    const roiPct = (data.totalCurrentValue - data.totalCostBasis) / data.totalCostBasis;
    
    leaderboard.push({
      address: addr,
      name: wallet.name,
      type: wallet.type,
      totalUSD: wallet.totalUSD,
      totalUSDRaw: wallet.totalUSDRaw,
      topHoldings: wallet.topHoldings,
      tradeCount: data.swapCount,
      buyCount: data.validSwaps,
      sellCount: 0,
      totalCost: Math.round(data.totalCostBasis),
      totalCurrentValue: Math.round(data.totalCurrentValue),
      roiPct: Math.round(roiPct * 1000000) / 1000000,
    });
  }
  
  // Sort by ROI descending, break ties by total wallet value
  leaderboard.sort((a, b) => b.roiPct - a.roiPct || b.totalUSDRaw - a.totalUSDRaw);
  
  console.log(`\nLeaderboard: ${leaderboard.length} wallets with swap ROI data`);
  console.log('Top 5:');
  for (const e of leaderboard.slice(0, 5)) {
    console.log(`  ${(e.roiPct * 100).toFixed(2)}% ROI | ${e.name} | ${e.buyCount} swaps | cost $${e.totalCost.toLocaleString()} → $${e.totalCurrentValue.toLocaleString()}`);
  }
  if (leaderboard.length > 5) {
    console.log('Bottom 5:');
    for (const e of leaderboard.slice(-5)) {
      console.log(`  ${(e.roiPct * 100).toFixed(2)}% ROI | ${e.name} | ${e.buyCount} swaps | cost $${e.totalCost.toLocaleString()} → $${e.totalCurrentValue.toLocaleString()}`);
    }
  }
  
  // Save
  const outPath = join(dataDir, 'crypto-leaderboard.json');
  writeFileSync(outPath, JSON.stringify({ 
    lastUpdated: new Date().toISOString(),
    methodology: 'swap-only',
    entries: leaderboard 
  }, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main().catch(console.error);
