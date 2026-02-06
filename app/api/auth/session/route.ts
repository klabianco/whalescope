/**
 * GET /api/auth/session — Get current session info.
 * POST /api/auth/session — Logout (clear session).
 * 
 * Returns user profile if logged in via magic link.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('ws_session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false });
  }

  const supabase = getSupabase();

  try {
    // Find session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', sessionToken)
      .single();

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from('sessions').delete().eq('token', sessionToken);
      return NextResponse.json({ authenticated: false });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, plan, wallet_address')
      .eq('id', session.profile_id)
      .single();

    if (!profile) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        plan: profile.plan,
        walletAddress: profile.wallet_address,
      },
    });

  } catch (error: any) {
    console.error('[Auth Session] Error:', error?.message || error);
    return NextResponse.json({ authenticated: false });
  }
}

/**
 * POST /api/auth/session — Logout
 */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('ws_session')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://whalescope.app';

  if (sessionToken) {
    const supabase = getSupabase();
    await supabase.from('sessions').delete().eq('token', sessionToken);
  }

  const response = NextResponse.json({ success: true });
  
  // Clear cookies
  response.cookies.set('ws_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
  
  response.cookies.set('ws_logged_in', '', {
    secure: true,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });

  return response;
}
