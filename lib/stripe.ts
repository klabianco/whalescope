/**
 * Edge-compatible Stripe helpers using fetch API (no SDK dependency).
 * Works on Cloudflare Pages with nodejs_compat.
 */

const STRIPE_API = 'https://api.stripe.com/v1';

function getStripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return key;
}

function encodeForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function stripeRequest<T = any>(
  path: string,
  params?: Record<string, string>,
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${getStripeSecret()}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers,
    body: params ? encodeForm(params) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe API error: ${res.status}`);
  }
  return data as T;
}

// ----- Checkout Sessions -----

interface CreateCheckoutParams {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
}

interface CheckoutSession {
  id: string;
  url: string;
  customer: string;
  subscription: string;
  client_reference_id: string | null;
  customer_details: { email: string } | null;
  metadata: Record<string, string>;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession> {
  const formParams: Record<string, string> = {
    'mode': 'subscription',
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    'success_url': params.successUrl,
    'cancel_url': params.cancelUrl,
    'allow_promotion_codes': 'true',
  };

  if (params.customerEmail) {
    formParams['customer_email'] = params.customerEmail;
  }
  if (params.clientReferenceId) {
    formParams['client_reference_id'] = params.clientReferenceId;
  }
  if (params.metadata) {
    for (const [key, value] of Object.entries(params.metadata)) {
      formParams[`metadata[${key}]`] = value;
    }
  }

  return stripeRequest<CheckoutSession>('/checkout/sessions', formParams);
}

// ----- Webhook Signature Verification -----

/**
 * Verify Stripe webhook signature (edge-compatible using Web Crypto API).
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<{ valid: boolean; event?: any; error?: string }> {
  try {
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (key === 't') acc.timestamp = value;
      if (key === 'v1') acc.signatures.push(value);
      return acc;
    }, { timestamp: '', signatures: [] as string[] });

    if (!parts.timestamp || parts.signatures.length === 0) {
      return { valid: false, error: 'Invalid signature format' };
    }

    // Check timestamp tolerance (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 300;
    if (Math.abs(now - parseInt(parts.timestamp)) > tolerance) {
      return { valid: false, error: 'Timestamp outside tolerance' };
    }

    // Compute expected signature using Web Crypto
    const signedPayload = `${parts.timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.buffer as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const payloadData = encoder.encode(signedPayload);
    const signatureBytes = await crypto.subtle.sign('HMAC', key, payloadData.buffer as ArrayBuffer);
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = parts.signatures.some(sig => sig === expectedSignature);
    if (!isValid) {
      return { valid: false, error: 'Signature mismatch' };
    }

    const event = JSON.parse(payload);
    return { valid: true, event };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Verification failed' };
  }
}

// ----- Subscription Management -----

interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: { data: Array<{ price: { id: string } }> };
}

export async function getSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, undefined, 'GET');
}

export async function cancelSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, {
    'cancel_at_period_end': 'true',
  });
}

// Retrieve a checkout session with expanded fields
export async function getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
  return stripeRequest<CheckoutSession>(
    `/checkout/sessions/${sessionId}?expand[]=customer&expand[]=subscription`,
    undefined,
    'GET'
  );
}
