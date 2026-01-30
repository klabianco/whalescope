/**
 * Helius Webhook Receiver
 * 
 * Receives enhanced transaction data from Helius webhooks for tracked whale wallets.
 * Parses SWAP and TRANSFER events, stores in Supabase whale_trades table.
 * 
 * Webhook ID: 53fe862c-a69d-4bca-857b-68de2cb77741
 * Endpoint: https://whalescope.app/api/webhook/helius
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

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
    const trades: Array<Record<string, unknown>> = [];

    for (const tx of transactions) {
      if (!tx.signature) continue;

      let parsed = null;

      // Try parsing as swap first
      if (tx.type === 'SWAP' || tx.events?.swap) {
        parsed = parseSwapAction(tx);
      }

      // Fall back to transfer
      if (!parsed && (tx.type === 'TRANSFER' || tx.tokenTransfers?.length || tx.nativeTransfers?.length)) {
        parsed = parseTransfer(tx);
      }

      // If we couldn't parse it, store as UNKNOWN
      if (!parsed) {
        parsed = {
          action: 'UNKNOWN',
          tokenMint: '',
          tokenAmount: 0,
          solAmount: 0,
          wallet: tx.feePayer,
        };
      }

      trades.push({
        signature: tx.signature,
        wallet: parsed.wallet,
        wallet_label: '',
        action: parsed.action,
        token_mint: parsed.tokenMint || null,
        token_symbol: null, // Will be resolved client-side via DexScreener
        token_amount: parsed.tokenAmount || null,
        sol_amount: parsed.solAmount || null,
        usd_value: null, // Will be resolved client-side
        description: tx.description || '',
        timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
        raw_data: tx,
      });
    }

    if (trades.length > 0) {
      // Upsert to avoid duplicates on signature
      const { error } = await supabase
        .from('whale_trades')
        .upsert(trades, { onConflict: 'signature', ignoreDuplicates: true });

      if (error) {
        console.error('[Webhook] Supabase insert error:', error.message);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
    }

    console.log(`[Webhook] Processed ${trades.length} whale trades from Helius`);
    return NextResponse.json({ ok: true, processed: trades.length });
  } catch (error: any) {
    console.error('[Webhook] Error:', error?.message || error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

// Helius also does a GET health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'whalescope-helius-webhook' });
}
