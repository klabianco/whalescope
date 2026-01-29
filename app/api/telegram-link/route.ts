/**
 * Telegram Linking API
 * 
 * POST /api/telegram-link
 * Body: { wallet: string, telegram_chat_id: string }
 * 
 * Links a Telegram chat ID to a Pro subscriber's profile.
 * Called by the Telegram bot when a user sends /start <wallet>.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { wallet, telegram_chat_id } = await request.json();

    if (!wallet || !telegram_chat_id) {
      return NextResponse.json(
        { error: 'wallet and telegram_chat_id required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }

    // Check if wallet has a Pro subscription
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?wallet_address=eq.${wallet}&select=id,plan,telegram_chat_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const profiles = await profileRes.json();

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: 'No account found for this wallet. Subscribe at whalescope.app/pricing first.' },
        { status: 404 }
      );
    }

    const profile = profiles[0];

    if (profile.plan !== 'pro' && profile.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'Telegram alerts are a Pro feature. Upgrade at whalescope.app/pricing' },
        { status: 403 }
      );
    }

    // Update profile with Telegram chat ID
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?wallet_address=eq.${wallet}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ telegram_chat_id: telegram_chat_id.toString() }),
      }
    );

    if (!updateRes.ok) {
      return NextResponse.json(
        { error: 'Failed to link Telegram' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram linked! You will now receive trade alerts.',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// GET - health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'telegram-link' });
}
