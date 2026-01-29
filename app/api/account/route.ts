import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

// GET /api/account?wallet=<address> - Fetch account & subscription info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // No profile found - user is on free plan
      return NextResponse.json({
        plan: 'free',
        subscription: null,
      });
    }

    if (profileError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Fetch active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    return NextResponse.json({
      plan: profile.plan || 'free',
      email: profile.email || null,
      subscription: subscription ? {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.current_period_end,
        paymentMethod: subscription.payment_method,
        lastPaymentSignature: subscription.last_payment_signature,
      } : null,
    });
  } catch (error: any) {
    console.error('Account fetch error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
