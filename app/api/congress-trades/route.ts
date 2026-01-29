/**
 * Server-side congress trades API
 * 
 * Free users: trades older than 24h, max 25 results
 * Pro users: all trades, no limits
 * 
 * Auth via wallet address query param checked against Supabase
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

interface CongressTrade {
  politician: string;
  party: string;
  chamber: string;
  state?: string;
  ticker: string;
  company: string;
  type: string;
  amount: string;
  filed: string;
  traded: string;
}

function isRecentTrade(trade: CongressTrade): boolean {
  const filedDate = new Date(trade.filed + 'T00:00:00');
  const now = new Date();
  const hoursSinceFiled = (now.getTime() - filedDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceFiled < 24;
}

async function getUserPlan(request: NextRequest): Promise<string> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) return 'free';

    const walletAddress = request.nextUrl.searchParams.get('wallet');
    if (walletAddress) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (profile?.plan === 'pro' || profile?.plan === 'enterprise') {
        return profile.plan;
      }
    }

    // Check for Supabase auth token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!anonKey) return 'free';
      
      const supabase = createClient(supabaseUrl, anonKey);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const serviceSupabase = createClient(supabaseUrl, supabaseKey);
        const { data: profile } = await serviceSupabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        
        return profile?.plan || 'free';
      }
    }

    return 'free';
  } catch {
    return 'free';
  }
}

const FREE_TRADE_LIMIT = 25;

export async function GET(request: NextRequest) {
  try {
    // Fetch trades from the public static file (same origin)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whalescope.app';
    const tradesRes = await fetch(`${appUrl}/congress-trades.json`, {
      headers: { 'User-Agent': 'WhaleScope-API/1.0' },
    });

    if (!tradesRes.ok) {
      return NextResponse.json({ trades: [], total: 0 });
    }

    const allTrades: CongressTrade[] = await tradesRes.json();

    const plan = await getUserPlan(request);
    const isPro = plan === 'pro' || plan === 'enterprise';

    let trades: CongressTrade[];
    let hiddenCount = 0;

    if (isPro) {
      trades = allTrades;
    } else {
      const nonRecentTrades = allTrades.filter(t => !isRecentTrade(t));
      const recentCount = allTrades.length - nonRecentTrades.length;
      trades = nonRecentTrades.slice(0, FREE_TRADE_LIMIT);
      hiddenCount = nonRecentTrades.length - trades.length + recentCount;
    }

    return NextResponse.json({
      trades,
      total: allTrades.length,
      hiddenCount,
      isPro,
    });
  } catch (error: any) {
    console.error('Congress trades API error:', error);
    return NextResponse.json({ error: 'Failed to load trades' }, { status: 500 });
  }
}
