/**
 * WhaleScope - Fetch trades from top Solana whale wallets
 * Uses Helius API to get parsed transactions
 * Focuses on real whales only (not exchanges/protocols/institutions)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "2bc6aa5c-ec94-4566-9102-18294afa2b14";
const HELIUS_BASE = `https://api.helius.xyz/v0`;

// Load whale wallets - only unknown_whale type, sorted by value
const walletsPath = join(process.cwd(), 'data', 'whale-wallets.json');
const walletData = JSON.parse(readFileSync(walletsPath, 'utf-8'));
const WHALE_WALLETS = walletData.wallets
  .filter((w: any) => w.type === 'unknown_whale')
  .sort((a: any, b: any) => b.totalUSDRaw - a.totalUSDRaw)
  .slice(0, 50) // Top 50 whales by value
  .map((w: any) => ({
    address: w.address,
    label: w.name,
    totalUSD: w.totalUSD,
    totalUSDRaw: w.totalUSDRaw,
  }));

interface ParsedTransaction {
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
  }[];
  source: string;
  nativeTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }[];
}

export interface WhaleTrade {
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
  action: "BUY" | "SELL" | "TRANSFER" | "UNKNOWN";
}

// Known token mints to symbols
const TOKEN_SYMBOLS: Record<string, string> = {
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "JUP",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "BONK",
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": "WIF",
  "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN": "TRUMP",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY",
  "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL": "JTO",
  "So11111111111111111111111111111111111111112": "SOL",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": "ETH",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "mSOL",
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": "jitoSOL",
  "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1": "bSOL",
};

async function fetchWalletTransactions(address: string, limit = 15): Promise<ParsedTransaction[]> {
  const url = `${HELIUS_BASE}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        console.log(`  Rate limited, waiting 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        const retry = await fetch(url);
        if (!retry.ok) throw new Error(`Helius API error: ${retry.status}`);
        return await retry.json();
      }
      throw new Error(`Helius API error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch for ${address}:`, err);
    return [];
  }
}

function parseTradeAction(tx: ParsedTransaction, walletAddress: string): WhaleTrade["action"] {
  const desc = (tx.description || '').toLowerCase();
  
  if (desc.includes("swapped") || tx.type === "SWAP") {
    const transfers = tx.tokenTransfers || [];
    const received = transfers.find(t => t.toUserAccount === walletAddress && t.mint !== "So11111111111111111111111111111111111111112");
    const sent = transfers.find(t => t.fromUserAccount === walletAddress && t.mint !== "So11111111111111111111111111111111111111112");
    
    if (received && !sent) return "BUY";
    if (sent && !received) return "SELL";
    if (received && sent) return "BUY";
  }
  
  // Classify transfers by direction (outbound = sell, inbound = buy)
  if (tx.type === "TRANSFER" || desc.includes("transfer")) {
    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];
    
    const sentToken = tokenTransfers.find(t => t.fromUserAccount === walletAddress);
    const receivedToken = tokenTransfers.find(t => t.toUserAccount === walletAddress);
    const sentNative = nativeTransfers.find(t => t.fromUserAccount === walletAddress);
    const receivedNative = nativeTransfers.find(t => t.toUserAccount === walletAddress);
    
    if (sentToken && !receivedToken) return "SELL";
    if (receivedToken && !sentToken) return "BUY";
    if (sentNative && !receivedNative) return "SELL";
    if (receivedNative && !sentNative) return "BUY";
  }
  
  return "UNKNOWN";
}

function getTokenInfo(tx: ParsedTransaction, walletAddress: string): { mint?: string; symbol?: string; amount?: number; solAmount?: number } {
  const transfers = tx.tokenTransfers || [];
  
  // For swaps, find the non-SOL token involved
  const nonSolTransfer = transfers.find(t => 
    t.mint !== "So11111111111111111111111111111111111111112" &&
    (t.toUserAccount === walletAddress || t.fromUserAccount === walletAddress)
  );
  
  // Get SOL amount from native transfers
  const nativeTransfers = tx.nativeTransfers || [];
  const solTransfer = nativeTransfers.find(t => 
    t.toUserAccount === walletAddress || t.fromUserAccount === walletAddress
  );
  const solAmount = solTransfer ? solTransfer.amount / 1e9 : undefined;
  
  if (nonSolTransfer) {
    return {
      mint: nonSolTransfer.mint,
      symbol: TOKEN_SYMBOLS[nonSolTransfer.mint] || undefined,
      amount: nonSolTransfer.tokenAmount,
      solAmount,
    };
  }
  
  // If only SOL transfers
  if (solTransfer) {
    return {
      mint: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      amount: solTransfer.amount / 1e9,
    };
  }
  
  return {};
}

async function fetchAllWhaleTrades(): Promise<WhaleTrade[]> {
  const allTrades: WhaleTrade[] = [];
  
  console.log(`Fetching trades for ${WHALE_WALLETS.length} whale wallets...\n`);
  
  for (let i = 0; i < WHALE_WALLETS.length; i++) {
    const wallet = WHALE_WALLETS[i];
    console.log(`[${i + 1}/${WHALE_WALLETS.length}] ${wallet.label} (${wallet.totalUSD})...`);
    
    const txs = await fetchWalletTransactions(wallet.address);
    let tradeCount = 0;
    
    for (const tx of txs) {
      // Include swaps and significant transfers
      if (tx.type === "SWAP" || tx.type === "TRANSFER" || 
          (tx.description || '').toLowerCase().includes("swap")) {
        const action = parseTradeAction(tx, wallet.address);
        const tokenInfo = getTokenInfo(tx, wallet.address);
        
        // Skip unknown/trivial transactions
        if (action === "UNKNOWN") continue;
        
        allTrades.push({
          wallet: wallet.address,
          walletLabel: wallet.label,
          walletValue: wallet.totalUSD,
          signature: tx.signature,
          timestamp: tx.timestamp,
          type: tx.type,
          description: tx.description || '',
          tokenMint: tokenInfo.mint,
          tokenSymbol: tokenInfo.symbol,
          tokenAmount: tokenInfo.amount,
          solAmount: tokenInfo.solAmount,
          action,
        });
        tradeCount++;
      }
    }
    
    console.log(`  → ${tradeCount} trades found`);
    
    // Rate limiting - 200ms between wallets
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Sort by timestamp, newest first
  allTrades.sort((a, b) => b.timestamp - a.timestamp);
  
  return allTrades;
}

async function main() {
  console.log("🐋 WhaleScope - Fetching whale trades...\n");
  
  const trades = await fetchAllWhaleTrades();
  
  console.log(`\n✅ Found ${trades.length} total trades from ${WHALE_WALLETS.length} wallets\n`);
  
  // Save
  const outputPath = join(process.cwd(), 'data', 'whale-trades.json');
  const publicPath = join(process.cwd(), 'public', 'whale-trades.json');
  writeFileSync(outputPath, JSON.stringify(trades, null, 2));
  writeFileSync(publicPath, JSON.stringify(trades, null, 2));
  console.log(`💾 Saved to ${outputPath}`);
  console.log(`📂 Copied to ${publicPath}`);
  
  // Summary
  const buys = trades.filter(t => t.action === 'BUY').length;
  const sells = trades.filter(t => t.action === 'SELL').length;
  const transfers = trades.filter(t => t.action === 'TRANSFER').length;
  console.log(`\n📊 Summary: ${buys} buys, ${sells} sells, ${transfers} transfers`);
  
  // Print recent
  console.log("\n🕐 Most recent trades:");
  for (const trade of trades.slice(0, 10)) {
    const date = new Date(trade.timestamp * 1000).toLocaleString();
    const symbol = trade.tokenSymbol || trade.tokenMint?.slice(0, 8) || '???';
    const amt = trade.tokenAmount ? trade.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '?';
    console.log(`  [${trade.action}] ${trade.walletLabel} — ${amt} ${symbol} (${date})`);
  }
}

main().catch(console.error);
