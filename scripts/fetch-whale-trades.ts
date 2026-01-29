/**
 * WhaleScope - Fetch trades from known profitable Solana wallets
 * Uses Helius API to get parsed transactions
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "2bc6aa5c-ec94-4566-9102-18294afa2b14";
const HELIUS_BASE = `https://api.helius.xyz/v0`;

// Known wallets loaded from verified data file
// Labels describe observable behavior, not claimed identity
// See data/known-whales.json for verification status
import { readFileSync } from 'fs';
import { join } from 'path';

const knownWhalesPath = join(process.cwd(), 'data', 'known-whales.json');
const knownWhales = JSON.parse(readFileSync(knownWhalesPath, 'utf-8'));
const SMART_WALLETS = knownWhales.map((w: { address: string; name: string }) => ({
  address: w.address,
  label: w.name,
}));

interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
  tokenStandard?: string;
}

interface ParsedTransaction {
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenTransfers: TokenTransfer[];
  source: string;
}

interface WhaleTrade {
  wallet: string;
  walletLabel: string;
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenMint?: string;
  tokenAmount?: number;
  action: "BUY" | "SELL" | "UNKNOWN";
}

async function fetchWalletTransactions(address: string, limit = 20): Promise<ParsedTransaction[]> {
  const url = `${HELIUS_BASE}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Helius API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch transactions for ${address}:`, err);
    return [];
  }
}

function parseTradeAction(tx: ParsedTransaction, walletAddress: string): WhaleTrade["action"] {
  const desc = tx.description.toLowerCase();
  
  // Look for swap patterns
  if (desc.includes("swapped") || tx.type === "SWAP") {
    // Check token transfers to determine if buy or sell
    const transfers = tx.tokenTransfers || [];
    const received = transfers.find(t => t.toUserAccount === walletAddress);
    const sent = transfers.find(t => t.fromUserAccount === walletAddress);
    
    // If they received a non-SOL token, it's a BUY
    if (received && received.mint !== "So11111111111111111111111111111111111111112") {
      return "BUY";
    }
    if (sent && sent.mint !== "So11111111111111111111111111111111111111112") {
      return "SELL";
    }
  }
  
  return "UNKNOWN";
}

async function fetchAllWhaleTrades(): Promise<WhaleTrade[]> {
  const allTrades: WhaleTrade[] = [];
  
  for (const wallet of SMART_WALLETS) {
    console.log(`Fetching trades for ${wallet.label}...`);
    const txs = await fetchWalletTransactions(wallet.address);
    
    for (const tx of txs) {
      // Filter to only swaps/trades
      if (tx.type === "SWAP" || tx.description?.toLowerCase().includes("swap")) {
        const action = parseTradeAction(tx, wallet.address);
        const relevantTransfer = tx.tokenTransfers?.find(t => 
          t.mint !== "So11111111111111111111111111111111111111112" // Not SOL
        );
        
        allTrades.push({
          wallet: wallet.address,
          walletLabel: wallet.label,
          signature: tx.signature,
          timestamp: tx.timestamp,
          type: tx.type,
          description: tx.description,
          tokenMint: relevantTransfer?.mint,
          tokenAmount: relevantTransfer?.tokenAmount,
          action,
        });
      }
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Sort by timestamp, newest first
  allTrades.sort((a, b) => b.timestamp - a.timestamp);
  
  return allTrades;
}

async function main() {
  console.log("🐋 WhaleScope - Fetching smart money trades...\n");
  
  const trades = await fetchAllWhaleTrades();
  
  console.log(`\n✅ Found ${trades.length} trades\n`);
  
  // Save to file
  const fs = await import("fs");
  const outputPath = "./data/whale-trades.json";
  const publicPath = "./public/whale-trades.json";
  fs.writeFileSync(outputPath, JSON.stringify(trades, null, 2));
  fs.writeFileSync(publicPath, JSON.stringify(trades, null, 2));
  console.log(`💾 Saved to ${outputPath}`);
  console.log(`📂 Copied to ${publicPath} for client-side access`);
  
  // Print recent trades
  console.log("\n📊 Recent trades:");
  for (const trade of trades.slice(0, 10)) {
    const date = new Date(trade.timestamp * 1000).toLocaleString();
    console.log(`  [${trade.action}] ${trade.walletLabel} - ${trade.description?.slice(0, 60)}... (${date})`);
  }
}

main().catch(console.error);
