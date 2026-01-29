import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '../../lib/send-email';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, email } = await request.json();

    if (!walletAddress || !email) {
      return NextResponse.json(
        { error: 'walletAddress and email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Update the profile's alert_email
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ alert_email: email })
      .eq('wallet_address', walletAddress);

    if (updateError) {
      console.error('Failed to update alert_email:', updateError);
      return NextResponse.json(
        { error: 'Failed to update email' },
        { status: 500 }
      );
    }

    // Send welcome email
    const emailResult = await sendWelcomeEmail(email);

    if (!emailResult.success) {
      console.error('Welcome email failed:', emailResult.error);
      // Still return success since the email was saved — email delivery is best-effort
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: 'Email saved but welcome email failed to send',
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: 'Email saved and welcome email sent',
    });
  } catch (err: any) {
    console.error('update-email error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
