import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ isPro: false });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('wallet_address', wallet)
    .single();

  if (error || !data) {
    return NextResponse.json({ isPro: false });
  }

  const isPro = data.plan === 'pro' || data.plan === 'enterprise';
  return NextResponse.json({ isPro });
}
