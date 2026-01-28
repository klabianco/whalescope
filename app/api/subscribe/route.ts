import { NextResponse } from 'next/server';

export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// POST /api/subscribe - Record a crypto payment and activate subscription
export async function POST(request: Request) {
  try {
    const { walletAddress, plan, txSignature } = await request.json();

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
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

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
        console.error('Error creating profile:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
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
        expires_at: endDate.toISOString(), // not really used for completed
      });

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      // Don't fail — the payment already happened on-chain
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
      console.error('Error creating subscription:', subError);
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
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
