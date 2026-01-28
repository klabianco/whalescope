import { NextResponse } from 'next/server';

export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    throw new Error(`Missing env vars: URL=${!!url}, KEY=${!!key}`);
  }
  
  return createClient(url, key);
}

// GET /api/subscribe - Health check
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    return NextResponse.json({
      status: 'ok',
      hasUrl: !!url,
      hasKey: !!key,
      urlPrefix: url ? url.substring(0, 20) + '...' : 'missing',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/subscribe - Record a crypto payment and activate subscription
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, plan, txSignature } = body;

    if (!walletAddress || !plan || !txSignature) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, plan, txSignature' },
        { status: 400 }
      );
    }

    if (!['pro_monthly', 'pro_yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Find or create profile by wallet address
    let { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new users
      return NextResponse.json({ error: `Find profile error: ${findError.message}` }, { status: 500 });
    }

    if (!profile) {
      // Create a new profile for this wallet (no auth user needed)
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          wallet_address: walletAddress,
          plan: 'pro',
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: `Create profile error: ${createError.message}` }, { status: 500 });
      }
      profile = newProfile;
    }

    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    if (plan === 'pro_yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Record payment intent
    const { error: paymentError } = await supabase
      .from('payment_intents')
      .insert({
        user_id: profile.id,
        plan,
        amount: plan === 'pro_yearly' ? 240 : 24,
        currency: 'USDC',
        memo: `subscribe-${walletAddress.substring(0, 8)}`,
        status: 'completed',
        transaction_signature: txSignature,
        completed_at: now.toISOString(),
        expires_at: endDate.toISOString(),
      });

    if (paymentError) {
      console.error('Payment recording error (non-fatal):', paymentError.message);
    }

    // Create/update subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: profile.id,
        plan: 'pro',
        status: 'active',
        current_period_end: endDate.toISOString(),
        payment_method: 'crypto',
        last_payment_signature: txSignature,
      }, {
        onConflict: 'user_id',
      });

    if (subError) {
      console.error('Subscription error (non-fatal):', subError.message);
    }

    // Update profile to pro
    await supabase
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', profile.id);

    console.log(`[Subscribe] Wallet ${walletAddress} upgraded to Pro (${plan}) via tx ${txSignature}`);

    return NextResponse.json({
      success: true,
      plan: 'pro',
      expiresAt: endDate.toISOString(),
      walletAddress,
    });
  } catch (error: any) {
    console.error('Subscribe error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
