import { NextResponse } from 'next/server';

export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';
import { verifyTransaction, PRICES, TREASURY_WALLET } from '../../../lib/payments';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    throw new Error(`Missing env vars: URL=${!!url}, KEY=${!!key}`);
  }
  
  return createClient(url, key);
}

// GET /api/subscribe - Health check (no sensitive info)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
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

    if (!TREASURY_WALLET) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // ============================
    // VERIFY TRANSACTION ON-CHAIN
    // ============================
    const expectedAmount = plan === 'pro_yearly' ? PRICES.PRO_YEARLY : PRICES.PRO_MONTHLY;

    const { valid, error: verifyError } = await verifyTransaction({
      signature: txSignature,
      expectedAmount,
      expectedMemo: `subscribe-${walletAddress.substring(0, 8)}`,
      currency: 'USDC',
    });

    if (!valid) {
      console.warn(`[Subscribe] Verification failed for tx ${txSignature}: ${verifyError}`);
      return NextResponse.json(
        { error: verifyError || 'Transaction verification failed' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check for replay attacks — has this tx already been used?
    const { data: existingPayment } = await supabase
      .from('payment_intents')
      .select('id')
      .eq('transaction_signature', txSignature)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Transaction already used for a subscription' },
        { status: 400 }
      );
    }

    // Find or create profile by wallet address
    let { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!profile) {
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

    // Record payment
    const { error: paymentError } = await supabase
      .from('payment_intents')
      .insert({
        user_id: profile.id,
        plan,
        amount: expectedAmount,
        currency: 'USDC',
        memo: `subscribe-${walletAddress.substring(0, 8)}`,
        status: 'completed',
        transaction_signature: txSignature,
        completed_at: now.toISOString(),
        expires_at: endDate.toISOString(),
      });

    if (paymentError) {
      console.error('Payment recording error:', paymentError.message);
    }

    // Create/update subscription
    await supabase
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

    // Update profile to pro
    await supabase
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', profile.id);

    console.log(`[Subscribe] Wallet ${walletAddress} upgraded to Pro (${plan}) via verified tx ${txSignature}`);

    return NextResponse.json({
      success: true,
      plan: 'pro',
      expiresAt: endDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Subscribe error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
