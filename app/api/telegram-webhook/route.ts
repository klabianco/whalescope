import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

async function sendMessage(chatId: number | string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    console.error('Telegram send error:', await res.text());
  }
  return res;
}

async function handleStart(chatId: number, text: string) {
  const parts = text.split(' ');

  if (parts.length < 2) {
    await sendMessage(chatId, `🐋 <b>Welcome to WhaleScope Alerts!</b>

Get real-time notifications for Congress trades and crypto whale moves.

<b>How to get alerts:</b>

1️⃣ Go to <a href="https://whalescope.app/pricing">whalescope.app/pricing</a> and subscribe to Pro ($24/mo)
2️⃣ Copy your Solana wallet address (the one you paid with)
3️⃣ Come back here and send:

<code>/start YOUR_WALLET_ADDRESS</code>

<b>Example:</b>
<code>/start 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU</code>

We'll verify your Pro subscription and start sending you alerts instantly.

<b>What you'll get:</b>
• 🏛️ Congress trades — Pelosi, Tuberville, 200+ politicians
• 🐋 Whale moves — Large Solana wallet activity
• ⚡ Real-time — No delays, straight to your phone

Questions? Reply here or email wrentheai@proton.me`);
    return;
  }

  const walletAddress = parts[1];

  if (walletAddress.length < 32 || walletAddress.length > 44) {
    await sendMessage(chatId, `❌ <b>Invalid wallet address</b>

Please send a valid Solana wallet address:
<code>/start YOUR_WALLET_ADDRESS</code>`);
    return;
  }

  // Check if wallet has a Pro subscription
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_address, plan')
    .eq('wallet_address', walletAddress)
    .single();

  if (!profile) {
    await sendMessage(chatId, `❌ <b>Wallet not found</b>

We couldn't find a WhaleScope account for this wallet. Make sure you've subscribed at <a href="https://whalescope.app/pricing">whalescope.app/pricing</a> first.`);
    return;
  }

  if (profile.plan !== 'pro' && profile.plan !== 'enterprise') {
    await sendMessage(chatId, `⚠️ <b>Pro subscription required</b>

Telegram alerts are a Pro feature. Upgrade at <a href="https://whalescope.app/pricing">whalescope.app/pricing</a> to get real-time alerts.`);
    return;
  }

  // Link Telegram chat ID to profile
  const { error } = await supabase
    .from('profiles')
    .update({ telegram_chat_id: chatId.toString() })
    .eq('wallet_address', walletAddress);

  if (error) {
    console.error('Telegram link error:', error);
    await sendMessage(chatId, '❌ Error linking account. Please try again later.');
    return;
  }

  await sendMessage(chatId, `✅ <b>Account connected!</b>

Your wallet <code>${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</code> is now linked.

You'll receive real-time trade alerts right here. 🐋

<b>Commands:</b>
/status — Check your subscription
/help — Show help
/stop — Stop receiving alerts`);
}

async function handleStatus(chatId: number) {
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_address, plan')
    .eq('telegram_chat_id', chatId.toString())
    .single();

  if (!profile) {
    await sendMessage(chatId, `❌ <b>Account not connected</b>

Link your wallet first:
<code>/start YOUR_WALLET_ADDRESS</code>`);
    return;
  }

  await sendMessage(chatId, `📊 <b>WhaleScope Status</b>

Wallet: <code>${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}</code>
Plan: ${profile.plan === 'pro' ? '✨ Pro' : profile.plan === 'enterprise' ? '🏢 Enterprise' : '🆓 Free'}
Alerts: ${profile.plan === 'pro' || profile.plan === 'enterprise' ? '✅ Active' : '❌ Upgrade needed'}

Manage at <a href="https://whalescope.app/account">whalescope.app/account</a>`);
}

async function handleStop(chatId: number) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({ telegram_chat_id: null })
    .eq('telegram_chat_id', chatId.toString());

  if (error) {
    console.error('Telegram unlink error:', error);
    await sendMessage(chatId, '❌ Error unlinking account.');
    return;
  }

  await sendMessage(chatId, `🔇 <b>Alerts stopped</b>

You won't receive any more trade alerts here. To re-enable, send:
<code>/start YOUR_WALLET_ADDRESS</code>`);
}

async function handleHelp(chatId: number) {
  await sendMessage(chatId, `🐋 <b>WhaleScope Alerts — Help</b>

<b>Commands:</b>
/start &lt;wallet&gt; — Link your Solana wallet to get alerts
/status — Check your subscription status
/stop — Stop receiving alerts
/help — Show this message

<b>How to get started:</b>
1. Subscribe at <a href="https://whalescope.app/pricing">whalescope.app/pricing</a>
2. Send: <code>/start YOUR_WALLET_ADDRESS</code>

<b>What are the alerts?</b>
• Congress stock trades (from STOCK Act disclosures)
• Crypto whale wallet activity on Solana
• Sent in real-time — no 24-hour delay for Pro

Need help? Email wrentheai@proton.me`);
}

export async function POST(request: Request) {
  try {
    const update = await request.json();

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const { chat, text } = update.message;
    const chatId = chat.id;
    const command = text.split(' ')[0].toLowerCase().replace(/@\w+$/, ''); // strip @botname

    switch (command) {
      case '/start':
        await handleStart(chatId, text);
        break;
      case '/status':
        await handleStatus(chatId);
        break;
      case '/stop':
        await handleStop(chatId);
        break;
      case '/help':
        await handleHelp(chatId);
        break;
      default:
        if (text.startsWith('/')) {
          await sendMessage(chatId, 'Unknown command. Try /help');
        }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true }); // Always 200 so Telegram doesn't retry
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', bot: 'WhaleScopeAlerts_bot' });
}
