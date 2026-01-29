/**
 * WhaleScope — Send Web Push Notifications
 *
 * Usage:
 *   npx tsx scripts/send-push-notification.ts "Title" "Body text" "https://whalescope.app/congress"
 *
 * Also exports sendPushNotifications() for use from other scripts.
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// --- Config ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mamjtxguzewxslbattal.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:wrentheai@proton.me';

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  wallet_address: string;
}

function getSupabase() {
  if (!SUPABASE_KEY) throw new Error('Missing SUPABASE_SERVICE_KEY');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Send a push notification to all subscribers.
 * Returns { sent, failed, cleaned } counts.
 */
export async function sendPushNotifications(
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; failed: number; cleaned: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('⚠️  VAPID keys not configured — skipping push notifications');
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  webpush.setVapidDetails(
    VAPID_EMAIL.startsWith('mailto:') ? VAPID_EMAIL : `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  const supabase = getSupabase();

  // Fetch all push subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, wallet_address');

  if (error) {
    console.error('Failed to fetch push subscriptions:', error.message);
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('  No push subscribers found');
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || 'https://whalescope.app',
  });

  let sent = 0;
  let failed = 0;
  let cleaned = 0;
  const expiredIds: string[] = [];

  for (const sub of subscriptions as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
      sent++;
    } catch (err: any) {
      failed++;
      // 404 or 410 = subscription expired/invalid — clean up
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredIds.push(sub.id);
      } else {
        console.error(`  Push failed for ${sub.endpoint.slice(0, 50)}...:`, err.statusCode || err.message);
      }
    }
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);

    if (deleteError) {
      console.error('  Failed to clean expired subs:', deleteError.message);
    } else {
      cleaned = expiredIds.length;
    }
  }

  return { sent, failed, cleaned };
}

// --- CLI entry point ---
async function main() {
  const [, , title, body, url] = process.argv;

  if (!title || !body) {
    console.log('Usage: npx tsx scripts/send-push-notification.ts "Title" "Body" ["URL"]');
    process.exit(1);
  }

  console.log(`📤 Sending push notification...`);
  console.log(`   Title: ${title}`);
  console.log(`   Body: ${body}`);
  if (url) console.log(`   URL: ${url}`);

  const result = await sendPushNotifications(title, body, url);

  console.log(`\n✅ Push results:`);
  console.log(`   Sent: ${result.sent}`);
  console.log(`   Failed: ${result.failed}`);
  console.log(`   Cleaned (expired): ${result.cleaned}`);
}

// Only run CLI if executed directly
if (process.argv[1]?.includes('send-push-notification')) {
  main().catch(console.error);
}
