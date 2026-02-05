/**
 * POST /api/webhooks/stripe — Handle Stripe webhook events.
 * 
 * Events handled:
 *   - checkout.session.completed → Activate Pro subscription
 *   - customer.subscription.deleted → Downgrade to free
 *   - customer.subscription.updated → Handle status changes
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '../../../../lib/stripe';

export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Read raw body for signature verification
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Verify signature if webhook secret is configured
  let event: any;
  if (webhookSecret && webhookSecret !== 'whsec_placeholder') {
    const result = await verifyWebhookSignature(payload, signature, webhookSecret);
    if (!result.valid) {
      console.error('[Stripe Webhook] Signature verification failed:', result.error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    event = result.event;
  } else {
    // No webhook secret configured — parse but log warning
    console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
    event = JSON.parse(payload);
  }

  const supabase = getSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(supabase, event.data.object);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, error?.message || error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed — activate Pro subscription.
 */
async function handleCheckoutCompleted(supabase: any, session: any) {
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const walletAddress = session.metadata?.wallet_address || session.client_reference_id;

  console.log(`[Stripe Webhook] Checkout completed: customer=${customerId}, email=${customerEmail}, wallet=${walletAddress}`);

  if (!customerId) {
    console.error('[Stripe Webhook] No customer ID in checkout session');
    return;
  }

  // Try to find existing profile by wallet address or email
  let profile = null;

  if (walletAddress) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    profile = data;
  }

  if (!profile && customerEmail) {
    // Try finding by email in auth.users via profiles
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', customerEmail)
      .single();
    profile = data;
  }

  if (profile) {
    // Update existing profile
    await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', profile.id);

    // Upsert subscription record
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: profile.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan: 'pro',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: 'stripe',
      }, {
        onConflict: 'user_id',
      });

    console.log(`[Stripe Webhook] Activated Pro for existing profile ${profile.id}`);
  } else {
    // Create new profile for this Stripe customer
    const newId = crypto.randomUUID();
    
    await supabase
      .from('profiles')
      .insert({
        id: newId,
        email: customerEmail,
        wallet_address: walletAddress || null,
        plan: 'pro',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      });

    await supabase
      .from('subscriptions')
      .insert({
        user_id: newId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan: 'pro',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: 'stripe',
      });

    console.log(`[Stripe Webhook] Created new Pro profile ${newId} for ${customerEmail}`);
  }
}

/**
 * Handle customer.subscription.deleted — downgrade to free.
 */
async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  console.log(`[Stripe Webhook] Subscription deleted: ${subscriptionId}, customer=${customerId}`);

  // Find profile by stripe_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', profile.id);

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', profile.id);

    console.log(`[Stripe Webhook] Downgraded profile ${profile.id} to free`);
  } else {
    console.warn(`[Stripe Webhook] No profile found for customer ${customerId}`);
  }
}

/**
 * Handle customer.subscription.updated — track status changes.
 */
async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const periodEnd = subscription.current_period_end;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Update subscription status
  const supabaseStatus = status === 'active' ? 'active' 
    : status === 'past_due' ? 'past_due' 
    : status === 'canceled' ? 'canceled' 
    : 'active';

  await supabase
    .from('subscriptions')
    .update({
      status: supabaseStatus,
      current_period_end: new Date(periodEnd * 1000).toISOString(),
    })
    .eq('user_id', profile.id);

  // If subscription is no longer active, downgrade
  if (['canceled', 'unpaid', 'incomplete_expired'].includes(status)) {
    await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', profile.id);
    console.log(`[Stripe Webhook] Downgraded profile ${profile.id} due to status: ${status}`);
  }
}
