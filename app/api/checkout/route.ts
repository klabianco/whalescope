/**
 * POST /api/checkout — Create a Stripe Checkout Session for Pro subscription.
 * 
 * Body: { plan: 'monthly' | 'yearly', email?: string, walletAddress?: string }
 * Returns: { url: string } — redirect user to this Stripe hosted checkout URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '../../../lib/stripe';

export const runtime = 'edge';

const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://whalescope.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan = 'monthly', email, walletAddress } = body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Use "monthly" or "yearly".' }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      console.error(`[Checkout] Missing STRIPE_PRICE_${plan.toUpperCase()} env var`);
      return NextResponse.json({ error: 'Stripe not configured for this plan' }, { status: 500 });
    }

    const metadata: Record<string, string> = { plan };
    if (walletAddress) {
      metadata.wallet_address = walletAddress;
    }

    const session = await createCheckoutSession({
      priceId,
      successUrl: `${APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${APP_URL}/pricing`,
      customerEmail: email || undefined,
      clientReferenceId: walletAddress || undefined,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Checkout] Error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
