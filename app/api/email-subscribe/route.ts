import { NextResponse } from 'next/server';

export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
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

    const supabase = getSupabase();

    // Upsert — if they already subscribed, just update the source/timestamp
    const { error } = await supabase
      .from('email_subscribers')
      .upsert(
        { 
          email: email.toLowerCase().trim(),
          source: source || 'website',
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Email subscribe error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email subscribe error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
