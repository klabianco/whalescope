/**
 * Server-side congress trades API — reads from Supabase
 * 
 * Free users: trades older than 24h, max 25 results
 * Pro users: all trades, no limits
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
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
    const supabase = getSupabase();
    const plan = await getUserPlan(request);
    const isPro = plan === 'pro' || plan === 'enterprise';

    // Get total count
    const { count: totalCount } = await supabase
      .from('congress_trades')
      .select('*', { count: 'exact', head: true });

    // Check for politician slug filter (used by politician detail pages)
    const politicianSlug = request.nextUrl.searchParams.get('politician');
    const limitParam = request.nextUrl.searchParams.get('limit');

    let query = supabase
      .from('congress_trades')
      .select('*')
      .order('filed_date', { ascending: false });

    if (politicianSlug) {
      // Politician detail page: return all trades for this politician (no plan restriction)
      // We filter client-side by slug since Supabase doesn't have a slug column
      // But we can use ilike on politician name (slug = name lowercased with dashes)
      const nameGuess = politicianSlug.replace(/-/g, ' ');
      query = query.ilike('politician', `%${nameGuess}%`);
    } else if (!isPro) {
      // Free users on main feed: exclude trades filed in last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      query = query
        .lte('filed_date', yesterdayStr)
        .limit(limitParam ? parseInt(limitParam) : FREE_TRADE_LIMIT);
    }

    const { data: trades, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to load trades' }, { status: 500 });
    }

    // Transform to match the client-expected format
    const formattedTrades = (trades || []).map(t => ({
      politician: t.politician,
      party: t.party,
      chamber: t.chamber,
      state: t.state || '',
      ticker: t.ticker,
      company: t.company || '',
      type: t.trade_type,
      amount: t.amount || '',
      filed: t.filed_date,
      traded: t.traded_date || '',
    }));

    // Calculate hidden count for free users
    let hiddenCount = 0;
    if (!isPro && totalCount) {
      hiddenCount = totalCount - formattedTrades.length;
    }

    return NextResponse.json({
      trades: formattedTrades,
      total: totalCount || 0,
      hiddenCount,
      isPro,
    });
  } catch (error: any) {
    console.error('Congress trades API error:', error);
    return NextResponse.json({ error: 'Failed to load trades' }, { status: 500 });
  }
}
