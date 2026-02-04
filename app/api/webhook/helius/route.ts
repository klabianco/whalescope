/**
 * Helius Webhook Receiver
 * 
 * Receives enhanced transaction data from Helius webhooks for tracked whale wallets.
 * Parses SWAP and TRANSFER events, resolves token symbols + USD prices,
 * stores in Supabase whale_trades table.
 * 
 * Webhook ID: 708a3cdd-f138-438e-ae80-c68493d06b25
 * Endpoint: https://whalescope.app/api/webhook/helius
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Well-known token mints
const KNOWN_TOKENS: Record<string, { symbol: string; price: number | null }> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', price: null }, // fetched live
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', price: 1 },
  'Es9vMFrzaCERmKfrUqBPNSZCwGLJMRME7jBZYCmahUPj': { symbol: 'USDT', price: 1 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', price: null },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'JitoSOL', price: null },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', price: null },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', price: null },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', price: null },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'WETH', price: null },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', price: null },
};

async function fetchSOLPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data?.solana?.usd || 0;
  } catch {
    return 0;
  }
}

async function fetchTokenInfo(mint: string): Promise<{ symbol: string; priceUsd: number } | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${mint}`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    const pairs = Array.isArray(data) ? data : data?.pairs || [];
    if (pairs.length > 0) {
      // Use the pair with highest liquidity
      const best = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      return {
        symbol: best.baseToken?.symbol || 'UNKNOWN',
        priceUsd: parseFloat(best.priceUsd) || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveTokens(mints: string[], solPrice: number): Promise<Record<string, { symbol: string; price: number }>> {
  const resolved: Record<string, { symbol: string; price: number }> = {};

  // Resolve known tokens first
  for (const mint of mints) {
    const known = KNOWN_TOKENS[mint];
    if (known) {
      if (known.price !== null) {
        resolved[mint] = { symbol: known.symbol, price: known.price };
      } else if (known.symbol === 'SOL' || known.symbol === 'mSOL' || known.symbol === 'JitoSOL' || known.symbol === 'bSOL') {
        // SOL-pegged tokens use SOL price (close enough for estimates)
        resolved[mint] = { symbol: known.symbol, price: solPrice };
      } else {
        // Known symbol but unknown price, fetch it
        const info = await fetchTokenInfo(mint);
        resolved[mint] = { symbol: known.symbol, price: info?.priceUsd || 0 };
      }
    }
  }

  // Fetch unknown tokens from DexScreener (batch: max 5 concurrent)
  const unknowns = mints.filter(m => !resolved[m]);
  const batches = [];
  for (let i = 0; i < unknowns.length; i += 5) {
    batches.push(unknowns.slice(i, i + 5));
  }

  for (const batch of batches) {
    const results = await Promise.allSettled(batch.map(m => fetchTokenInfo(m)));
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        resolved[batch[i]] = { symbol: r.value.symbol, price: r.value.priceUsd };
      } else {
        resolved[batch[i]] = { symbol: 'UNKNOWN', price: 0 };
      }
    });
  }

  return resolved;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

// Helius sends an array of enhanced transactions
interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  source: string;
  fee: number;
  feePayer: string;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number; // lamports
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  accountData?: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      userAccount: string;
      tokenAccount: string;
      rawTokenAmount: { tokenAmount: string; decimals: number };
      mint: string;
    }>;
  }>;
  events?: {
    swap?: {
      nativeInput?: { account: string; amount: string };
      nativeOutput?: { account: string; amount: string };
      tokenInputs?: Array<{ userAccount: string; tokenAccount: string; mint: string; rawTokenAmount: { tokenAmount: string; decimals: number } }>;
      tokenOutputs?: Array<{ userAccount: string; tokenAccount: string; mint: string; rawTokenAmount: { tokenAmount: string; decimals: number } }>;
    };
  };
}

function parseSwapAction(tx: HeliusTransaction): { action: string; tokenMint: string; tokenAmount: number; solAmount: number; wallet: string } | null {
  const swap = tx.events?.swap;
  if (!swap) return null;

  const wallet = tx.feePayer;

  // SOL → Token (BUY)
  if (swap.nativeInput && swap.tokenOutputs?.length) {
    const solAmount = parseInt(swap.nativeInput.amount) / 1e9;
    const tokenOut = swap.tokenOutputs[0];
    const decimals = tokenOut.rawTokenAmount.decimals;
    const tokenAmount = parseInt(tokenOut.rawTokenAmount.tokenAmount) / Math.pow(10, decimals);
    return { action: 'BUY', tokenMint: tokenOut.mint, tokenAmount, solAmount, wallet };
  }

  // Token → SOL (SELL)
  if (swap.nativeOutput && swap.tokenInputs?.length) {
    const solAmount = parseInt(swap.nativeOutput.amount) / 1e9;
    const tokenIn = swap.tokenInputs[0];
    const decimals = tokenIn.rawTokenAmount.decimals;
    const tokenAmount = parseInt(tokenIn.rawTokenAmount.tokenAmount) / Math.pow(10, decimals);
    return { action: 'SELL', tokenMint: tokenIn.mint, tokenAmount, solAmount, wallet };
  }

  // Token → Token swap
  if (swap.tokenInputs?.length && swap.tokenOutputs?.length) {
    const tokenIn = swap.tokenInputs[0];
    const tokenOut = swap.tokenOutputs[0];
    const decimals = tokenOut.rawTokenAmount.decimals;
    const tokenAmount = parseInt(tokenOut.rawTokenAmount.tokenAmount) / Math.pow(10, decimals);
    return { action: 'BUY', tokenMint: tokenOut.mint, tokenAmount, solAmount: 0, wallet };
  }

  return null;
}

function parseTransfer(tx: HeliusTransaction): { action: string; tokenMint: string; tokenAmount: number; solAmount: number; wallet: string } | null {
  // Check token transfers first
  if (tx.tokenTransfers?.length) {
    const transfer = tx.tokenTransfers[0];
    return {
      action: 'TRANSFER',
      tokenMint: transfer.mint,
      tokenAmount: transfer.tokenAmount,
      solAmount: 0,
      wallet: transfer.fromUserAccount || tx.feePayer,
    };
  }

  // Native SOL transfer
  if (tx.nativeTransfers?.length) {
    const transfer = tx.nativeTransfers[0];
    return {
      action: 'TRANSFER',
      tokenMint: 'So11111111111111111111111111111111111111112',
      tokenAmount: transfer.amount / 1e9,
      solAmount: transfer.amount / 1e9,
      wallet: transfer.fromUserAccount || tx.feePayer,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Helius sends an array of transactions
    const transactions: HeliusTransaction[] = Array.isArray(body) ? body : [body];
    
    if (transactions.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    const supabase = getSupabase();

    // Step 1: Parse all transactions
    const parsedTrades: Array<{
      tx: HeliusTransaction;
      parsed: { action: string; tokenMint: string; tokenAmount: number; solAmount: number; wallet: string };
    }> = [];

    for (const tx of transactions) {
      if (!tx.signature) continue;

      let parsed = null;

      if (tx.type === 'SWAP' || tx.events?.swap) {
        parsed = parseSwapAction(tx);
      }

      if (!parsed && (tx.type === 'TRANSFER' || tx.tokenTransfers?.length || tx.nativeTransfers?.length)) {
        parsed = parseTransfer(tx);
      }

      if (!parsed) {
        parsed = {
          action: 'UNKNOWN',
          tokenMint: '',
          tokenAmount: 0,
          solAmount: 0,
          wallet: tx.feePayer,
        };
      }

      parsedTrades.push({ tx, parsed });
    }

    // Step 2: Resolve prices (best-effort, never blocks storage)
    let solPrice = 0;
    let tokenInfo: Record<string, { symbol: string; price: number }> = {};
    try {
      const uniqueMints = [...new Set(parsedTrades.map(t => t.parsed.tokenMint).filter(Boolean))];
      solPrice = await fetchSOLPrice();
      tokenInfo = await resolveTokens(uniqueMints, solPrice);
    } catch (e) {
      console.error('[Webhook] Price resolution failed, storing with nulls:', e);
    }

    // Step 3: Build trade records with prices
    const trades: Array<Record<string, unknown>> = [];

    for (const { tx, parsed } of parsedTrades) {
      const info = parsed.tokenMint ? tokenInfo[parsed.tokenMint] : null;
      const symbol = info?.symbol || null;
      const tokenPrice = info?.price || 0;

      // Calculate USD value
      let usdValue: number | null = null;
      if (parsed.solAmount > 0 && solPrice > 0) {
        usdValue = Math.round(parsed.solAmount * solPrice * 100) / 100;
      } else if (parsed.tokenAmount > 0 && tokenPrice > 0) {
        usdValue = Math.round(parsed.tokenAmount * tokenPrice * 100) / 100;
      }

      trades.push({
        signature: tx.signature,
        wallet: parsed.wallet,
        wallet_label: '',
        action: parsed.action,
        token_mint: parsed.tokenMint || null,
        token_symbol: symbol,
        token_amount: parsed.tokenAmount || null,
        sol_amount: parsed.solAmount || null,
        usd_value: usdValue,
        description: tx.description || '',
        timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
        raw_data: JSON.parse(JSON.stringify(tx)),
      });
    }

    if (trades.length > 0) {
      // Use raw fetch to Supabase REST API for maximum CF edge compatibility
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_KEY;
      
      const res = await fetch(`${supabaseUrl}/rest/v1/whale_trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(trades),
      });

      if (!res.ok) {
        const status = res.status;
        // On rate limit, return 200 so Helius doesn't retry immediately
        if (status === 429) {
          console.warn(`[Webhook] Rate limited, ${trades.length} trades dropped`);
          return NextResponse.json({ ok: true, processed: 0, rateLimited: true });
        }
        const errBody = await res.text();
        console.error('[Webhook] Supabase error:', status, errBody);
        return NextResponse.json({ ok: false, error: errBody }, { status: 500 });
      }
    }

    const withPrice = trades.filter(t => t.usd_value !== null).length;
    console.log(`[Webhook] Processed ${trades.length} trades (${withPrice} with USD prices, SOL=$${solPrice})`);
    return NextResponse.json({ ok: true, processed: trades.length, priced: withPrice, solPrice });
  } catch (error: any) {
    console.error('[Webhook] Error:', error?.message || error);
    return NextResponse.json({ ok: false, error: error?.message || 'Internal error' }, { status: 500 });
  }
}

// Helius health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'whalescope-helius-webhook', version: 'v3-price-resolve' });
}
