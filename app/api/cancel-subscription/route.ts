import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

// POST /api/cancel-subscription - Cancel a subscription (keeps access until period end)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing required field: walletAddress' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Find profile by wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No account found for this wallet' },
        { status: 404 }
      );
    }

    // Find active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled', expiresAt: subscription.current_period_end },
        { status: 400 }
      );
    }

    // Set subscription status to 'canceled' — user keeps access until current_period_end
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', profile.id);

    if (updateError) {
      console.error('Cancel subscription error:', updateError.message);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    // NOTE: Profile plan stays 'pro' until current_period_end passes.
    // The /api/check-expired cron job handles downgrading expired subscriptions.

    console.log(`[Cancel] Wallet ${walletAddress} canceled subscription. Access until ${subscription.current_period_end}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled. You will retain Pro access until the end of your billing period.',
      expiresAt: subscription.current_period_end,
    });
  } catch (error: any) {
    console.error('Cancel error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
