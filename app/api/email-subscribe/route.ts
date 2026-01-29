import { NextResponse } from 'next/server';

export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

async function sendWelcomeEmail(email: string, source: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set, skipping welcome email');
    return;
  }

  const sourceLabel = source === 'homepage' ? 'the homepage' 
    : source === 'congress' ? 'the Congress trades page'
    : source === 'pricing' ? 'the pricing page'
    : 'WhaleScope';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WhaleScope <alerts@whalescope.app>',
        to: [email],
        subject: '🐋 Welcome to WhaleScope — You\'re In',
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #e0e0e0; background: #0a0a0a;">
          <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 8px;">🐋 Welcome to WhaleScope</h1>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">You signed up from ${sourceLabel}</p>
          
          <p>Hey — thanks for subscribing. You'll get weekly alerts on:</p>
          
          <ul style="line-height: 1.8;">
            <li><strong>Congress trades</strong> — What Pelosi, Tuberville, and 200+ politicians are buying and selling</li>
            <li><strong>Crypto whale moves</strong> — Large Solana wallet activity from known smart money</li>
            <li><strong>Notable patterns</strong> — Unusual timing, clustering, or sector bets</li>
          </ul>
          
          <p>In the meantime, check out what's happening right now:</p>
          
          <div style="margin: 24px 0;">
            <a href="https://whalescope.app/congress" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 12px;">View Congress Trades</a>
            <a href="https://whalescope.app" style="display: inline-block; padding: 12px 24px; background: #1f2937; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; border: 1px solid #374151;">Explore WhaleScope</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px;">
            Want real-time alerts instead of weekly? <a href="https://whalescope.app/pricing" style="color: #3b82f6;">Upgrade to Pro</a> for instant Discord + Telegram notifications.<br><br>
            Reply to this email anytime — a real person (well, a real AI) reads every one.<br><br>
            — Wren, WhaleScope
          </p>
        </div>
      `,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Resend API error:', res.status, errBody);
    }
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    // Don't throw — subscription still succeeded even if email fails
  }
}

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabase();

    // Check if already subscribed (don't re-send welcome email)
    const { data: existing } = await supabase
      .from('email_subscribers')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    const isNew = !existing;

    // Upsert — if they already subscribed, just update the source/timestamp
    const { error } = await supabase
      .from('email_subscribers')
      .upsert(
        { 
          email: normalizedEmail,
          source: source || 'website',
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Email subscribe error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    // Send welcome email only to new subscribers
    if (isNew) {
      await sendWelcomeEmail(normalizedEmail, source || 'website');
    }

    return NextResponse.json({ success: true, isNew });
  } catch (err: any) {
    console.error('Email subscribe error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
