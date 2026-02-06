/**
 * POST /api/auth/magic-link — Send a magic login link to email.
 * 
 * Body: { email: string }
 * 
 * Creates a token, stores it in Supabase, sends email via Resend.
 * Token expires in 15 minutes.
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

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabase();

    // Check if this email has a profile (Pro user)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, plan')
      .eq('email', normalizedEmail)
      .single();

    if (!profile) {
      // Don't reveal if email exists or not for security
      // But still return success (we just won't send an email)
      console.log(`[Magic Link] No profile found for ${normalizedEmail}`);
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with this email, a login link has been sent.' 
      });
    }

    // Generate token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // Store token in magic_links table
    const { error: insertError } = await supabase
      .from('magic_links')
      .insert({
        token,
        email: normalizedEmail,
        profile_id: profile.id,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      // Table might not exist, try to create it inline or log error
      console.error('[Magic Link] Failed to insert token:', insertError);
      return NextResponse.json({ error: 'Failed to create login link' }, { status: 500 });
    }

    // Send email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error('[Magic Link] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://whalescope.app';
    const loginUrl = `${baseUrl}/api/auth/verify?token=${token}`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WhaleScope <alerts@whalescope.app>',
        to: normalizedEmail,
        subject: 'Your WhaleScope Login Link',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; margin-bottom: 24px;">🐋 WhaleScope Login</h1>
            <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
              Click the button below to log in to your WhaleScope account. This link expires in 15 minutes.
            </p>
            <a href="${loginUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Log In to WhaleScope
            </a>
            <p style="font-size: 14px; color: #666; margin-top: 32px;">
              If you didn't request this link, you can safely ignore this email.
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 24px;">
              — The WhaleScope Team
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('[Magic Link] Resend error:', errText);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log(`[Magic Link] Sent login link to ${normalizedEmail}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with this email, a login link has been sent.' 
    });

  } catch (error: any) {
    console.error('[Magic Link] Error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
