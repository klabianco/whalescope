import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  const email = req.nextUrl.searchParams.get('email');
  
  if (!wallet && !email) {
    return NextResponse.json({ isPro: false });
  }

  let data = null;

  // Check by wallet first
  if (wallet) {
    const result = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('wallet_address', wallet)
      .single();
    data = result.data;
  }

  // Fall back to email lookup (for Stripe card-paying users)
  if (!data && email) {
    const result = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('email', email)
      .single();
    data = result.data;
  }

  if (!data) {
    return NextResponse.json({ isPro: false });
  }

  const isPro = data.plan === 'pro' || data.plan === 'enterprise';
  return NextResponse.json({ isPro });
}
