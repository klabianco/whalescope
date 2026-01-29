import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

// GET /api/check-expired - Check and downgrade expired subscriptions (called by cron)
export async function GET(request: Request) {
  // Optional: verify cron secret to prevent unauthorized calls
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    // Find all subscriptions that have expired (past current_period_end)
    // Include both 'active' and 'canceled' — active ones that expired without renewal,
    // and canceled ones whose grace period has ended
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id, status, current_period_end')
      .in('status', ['active', 'canceled'])
      .lt('current_period_end', now);

    if (fetchError) {
      console.error('Check expired fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      return NextResponse.json({ expired: 0, message: 'No expired subscriptions found' });
    }

    let downgraded = 0;

    for (const sub of expiredSubs) {
      // Update subscription status to expired
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({ status: 'expired' as any })
        .eq('user_id', sub.user_id);

      if (subUpdateError) {
        console.error(`Failed to expire subscription for user ${sub.user_id}:`, subUpdateError.message);
        continue;
      }

      // Downgrade profile to free
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', sub.user_id);

      if (profileUpdateError) {
        console.error(`Failed to downgrade profile for user ${sub.user_id}:`, profileUpdateError.message);
        continue;
      }

      downgraded++;
    }

    console.log(`[Check Expired] Downgraded ${downgraded}/${expiredSubs.length} expired subscriptions`);

    return NextResponse.json({
      expired: expiredSubs.length,
      downgraded,
      timestamp: now,
    });
  } catch (error: any) {
    console.error('Check expired error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
