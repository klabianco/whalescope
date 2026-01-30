/**
 * Whale Trades API
 * 
 * Returns recent whale trades from Supabase (live webhook data).
 * Falls back to static JSON if Supabase has no data yet.
 * 
 * GET /api/whale-trades?limit=50&action=BUY
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const action = searchParams.get('action'); // BUY, SELL, TRANSFER, or null for all
  const wallet = searchParams.get('wallet');

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ trades: [], source: 'none', error: 'Supabase not configured' });
  }

  try {
    let query = supabase
      .from('whale_trades')
      .select('signature, wallet, wallet_label, action, token_mint, token_symbol, token_amount, sol_amount, usd_value, description, timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq('action', action.toUpperCase());
    }
    if (wallet) {
      query = query.eq('wallet', wallet);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[whale-trades] Supabase error:', error.message);
      return NextResponse.json({ trades: [], source: 'error', error: error.message }, { status: 500 });
    }

    // Map to frontend format
    const trades = (data || []).map((row: Record<string, unknown>) => ({
      wallet: row.wallet,
      walletLabel: row.wallet_label || '',
      walletValue: '',
      signature: row.signature,
      timestamp: Math.floor(new Date(row.timestamp as string).getTime() / 1000),
      type: row.action === 'BUY' || row.action === 'SELL' ? 'SWAP' : 'TRANSFER',
      description: row.description || '',
      tokenMint: row.token_mint || undefined,
      tokenSymbol: row.token_symbol || undefined,
      tokenAmount: row.token_amount ? Number(row.token_amount) : undefined,
      solAmount: row.sol_amount ? Number(row.sol_amount) : undefined,
      action: row.action,
    }));

    return NextResponse.json({
      trades,
      source: 'live',
      count: trades.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('[whale-trades] Error:', error?.message || error);
    return NextResponse.json({ trades: [], source: 'error', error: 'Internal error' }, { status: 500 });
  }
}
