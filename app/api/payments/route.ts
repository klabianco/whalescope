import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  generatePaymentMemo, 
  verifyTransaction, 
  PRICES, 
  SOL_PRICES,
  TREASURY_WALLET 
} from '../../../lib/payments';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// POST /api/payments - Create a payment intent
export async function POST(request: Request) {
  try {
    const { userId, plan, currency = 'USDC' } = await request.json();

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['pro_monthly', 'pro_yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, plan')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate unique memo for this payment
    const memo = generatePaymentMemo(userId);
    
    // Calculate amount
    const amount = currency === 'USDC' 
      ? (plan === 'pro_yearly' ? PRICES.PRO_YEARLY : PRICES.PRO_MONTHLY)
      : (plan === 'pro_yearly' ? SOL_PRICES.PRO_YEARLY : SOL_PRICES.PRO_MONTHLY);

    // Create payment intent in database
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const { data: paymentIntent, error } = await supabase
      .from('payment_intents')
      .insert({
        user_id: userId,
        plan,
        amount,
        currency,
        memo,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment intent:', error);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    return NextResponse.json({
      paymentId: paymentIntent.id,
      treasury: TREASURY_WALLET,
      amount,
      currency,
      memo,
      expiresAt: expiresAt.toISOString(),
      // Solana Pay URL for easy mobile payments
      solanaPayUrl: `solana:${TREASURY_WALLET}?amount=${amount}&memo=${encodeURIComponent(memo)}`,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/payments - Verify a payment
export async function PUT(request: Request) {
  try {
    const { paymentId, signature } = await request.json();

    if (!paymentId || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get payment intent
    const { data: payment, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 });
    }

    if (new Date(payment.expires_at) < new Date()) {
      await supabase
        .from('payment_intents')
        .update({ status: 'expired' })
        .eq('id', paymentId);
      return NextResponse.json({ error: 'Payment expired' }, { status: 400 });
    }

    // Verify the transaction on-chain
    const { valid, error: verifyError } = await verifyTransaction({
      signature,
      expectedAmount: payment.amount,
      expectedMemo: payment.memo,
      currency: payment.currency,
    });

    if (!valid) {
      return NextResponse.json({ error: verifyError || 'Verification failed' }, { status: 400 });
    }

    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    if (payment.plan === 'pro_yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update payment intent
    await supabase
      .from('payment_intents')
      .update({ 
        status: 'completed',
        transaction_signature: signature,
        completed_at: now.toISOString(),
      })
      .eq('id', paymentId);

    // Create/update subscription
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: payment.user_id,
        plan: 'pro',
        status: 'active',
        current_period_end: endDate.toISOString(),
        payment_method: 'crypto',
        last_payment_signature: signature,
      }, {
        onConflict: 'user_id',
      });

    // Update user's plan
    await supabase
      .from('profiles')
      .update({ plan: 'pro' })
      .eq('id', payment.user_id);

    console.log(`[Payment] User ${payment.user_id} upgraded to Pro via ${payment.currency}`);

    return NextResponse.json({ 
      success: true,
      plan: 'pro',
      expiresAt: endDate.toISOString(),
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
