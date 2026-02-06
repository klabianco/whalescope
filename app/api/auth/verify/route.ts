/**
 * GET /api/auth/verify?token=xxx — Verify magic link and set session.
 * 
 * Validates token, marks it used, sets session cookie, redirects to account.
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

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://whalescope.app';

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=missing_token`);
  }

  const supabase = getSupabase();

  try {
    // Find the magic link
    const { data: magicLink, error: findError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !magicLink) {
      console.error('[Auth Verify] Token not found:', token.slice(0, 10) + '...');
      return NextResponse.redirect(`${baseUrl}/auth/login?error=invalid_token`);
    }

    // Check if already used
    if (magicLink.used) {
      return NextResponse.redirect(`${baseUrl}/auth/login?error=token_used`);
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.redirect(`${baseUrl}/auth/login?error=token_expired`);
    }

    // Mark token as used
    await supabase
      .from('magic_links')
      .update({ used: true })
      .eq('token', token);

    // Get the profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', magicLink.profile_id)
      .single();

    if (!profile) {
      return NextResponse.redirect(`${baseUrl}/auth/login?error=profile_not_found`);
    }

    // Create a session token
    const sessionToken = generateSessionToken();
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store session
    await supabase
      .from('sessions')
      .insert({
        token: sessionToken,
        profile_id: profile.id,
        email: profile.email,
        expires_at: sessionExpires.toISOString(),
      });

    // Create response with redirect
    const response = NextResponse.redirect(`${baseUrl}/account`);

    // Set session cookie
    response.cookies.set('ws_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: sessionExpires,
      path: '/',
    });

    // Also set a non-httpOnly cookie for client-side checks
    response.cookies.set('ws_logged_in', 'true', {
      secure: true,
      sameSite: 'lax',
      expires: sessionExpires,
      path: '/',
    });

    console.log(`[Auth Verify] Session created for ${profile.email}`);

    return response;

  } catch (error: any) {
    console.error('[Auth Verify] Error:', error?.message || error);
    return NextResponse.redirect(`${baseUrl}/auth/login?error=server_error`);
  }
}
