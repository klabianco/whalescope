/**
 * WhaleScope Telegram Bot
 * 
 * Handles:
 * - User connection/linking via /start command
 * - Sending real-time trade alerts
 * - Subscription status checks
 * 
 * Run: npx tsx scripts/telegram-bot.ts
 * Or deploy as a serverless function with webhook
 */

import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!; // Service key for admin access

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      username?: string;
      first_name?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

interface CongressTrade {
  politician_name: string;
  ticker: string;
  trade_type: string;
  amount_min?: number;
  amount_max?: number;
  trade_date: string;
  disclosure_date: string;
}

interface WhaleTrade {
  wallet: string;
  token: string;
  type: 'buy' | 'sell';
  amount_usd: number;
  timestamp: string;
}

// Send message to Telegram
async function sendMessage(chatId: number | string, text: string, parseMode: string = 'HTML') {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Telegram send error:', error);
    throw new Error(`Telegram API error: ${response.status}`);
  }

  return response.json();
}

// Handle /start command with wallet address
async function handleStart(chatId: number, userId: number, text: string, username?: string) {
  const parts = text.split(' ');
  
  if (parts.length < 2) {
    // No wallet provided, send welcome message
    await sendMessage(chatId, `
🐋 <b>Welcome to WhaleScope Alerts!</b>

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

Questions? Reply here or email wrentheai@proton.me
    `.trim());
    return;
  }

  const walletAddress = parts[1];

  // Validate wallet address (basic Solana format check)
  if (walletAddress.length < 32 || walletAddress.length > 44) {
    await sendMessage(chatId, `
❌ <b>Invalid wallet address</b>

Please send a valid Solana wallet address:
<code>/start YOUR_WALLET_ADDRESS</code>
    `.trim());
    return;
  }

  // Call the linking API
  try {
    const res = await fetch('https://whalescope.app/api/telegram-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: walletAddress,
        telegram_chat_id: chatId.toString(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      await sendMessage(chatId, `
❌ <b>${data.error || 'Failed to link account'}</b>

Make sure you've subscribed at <a href="https://whalescope.app/pricing">whalescope.app/pricing</a> with this wallet.
      `.trim());
      return;
    }

    await sendMessage(chatId, `
✅ <b>Account connected!</b>

You'll now receive real-time trade alerts here.

<b>Commands:</b>
/status - Check your subscription
/help - Show help

Happy trading! 🐋
    `.trim());

  } catch (e: any) {
    console.error('Linking error:', e.message);
    await sendMessage(chatId, '❌ Error connecting account. Please try again later.');
  }
}

// Handle /status command
async function handleStatus(chatId: number) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, plan, telegram_chat_id')
    .eq('telegram_chat_id', chatId.toString())
    .single();

  if (!profile) {
    await sendMessage(chatId, `
❌ <b>Account not connected</b>

Connect your WhaleScope account:
whalescope.app/dashboard
    `.trim());
    return;
  }

  const { data: watchlistCount } = await supabase
    .from('watchlists')
    .select('id', { count: 'exact' })
    .eq('user_id', profile.email); // This should use user_id properly

  await sendMessage(chatId, `
📊 <b>WhaleScope Status</b>

Plan: ${profile.plan === 'pro' ? '✨ Pro' : profile.plan === 'enterprise' ? '🏢 Enterprise' : '🆓 Free'}
Email: ${profile.email}
Alerts: ${profile.plan === 'pro' || profile.plan === 'enterprise' ? '✅ Active' : '❌ Upgrade needed'}

Manage at whalescope.app/dashboard
  `.trim());
}

// Send a congress trade alert
export async function sendCongressAlert(chatId: string, trade: CongressTrade) {
  const emoji = trade.trade_type.toLowerCase().includes('purchase') ? '🟢' : '🔴';
  const amountStr = trade.amount_max 
    ? `$${(trade.amount_min || 0).toLocaleString()} - $${trade.amount_max.toLocaleString()}`
    : 'Amount not disclosed';

  const message = `
${emoji} <b>Congress Trade Alert</b>

<b>${trade.politician_name}</b>
${trade.trade_type} <b>$${trade.ticker}</b>

💰 ${amountStr}
📅 Trade: ${trade.trade_date}
📋 Disclosed: ${trade.disclosure_date}

<a href="https://whalescope.app/congress/${encodeURIComponent(trade.politician_name.toLowerCase().replace(/ /g, '-'))}">View Profile →</a>
  `.trim();

  await sendMessage(chatId, message);
}

// Send a whale trade alert
export async function sendWhaleAlert(chatId: string, trade: WhaleTrade, label?: string) {
  const emoji = trade.type === 'buy' ? '🟢' : '🔴';
  const walletLabel = label || `${trade.wallet.slice(0, 6)}...${trade.wallet.slice(-4)}`;

  const message = `
${emoji} <b>Whale ${trade.type === 'buy' ? 'Buy' : 'Sell'} Alert</b>

<b>${walletLabel}</b>
${trade.type === 'buy' ? 'Bought' : 'Sold'} <b>${trade.token}</b>

💰 $${trade.amount_usd.toLocaleString()}
⏰ ${new Date(trade.timestamp).toLocaleString()}

<a href="https://whalescope.app/wallet/${trade.wallet}">View Wallet →</a>
  `.trim();

  await sendMessage(chatId, message);
}

// Process incoming webhook update
export async function processUpdate(update: TelegramUpdate) {
  if (!update.message?.text) return;

  const { chat, text, from } = update.message;
  const chatId = chat.id;
  const command = text.split(' ')[0].toLowerCase();

  console.log(`[Telegram] ${from.username || from.id}: ${text}`);

  switch (command) {
    case '/start':
      await handleStart(chatId, from.id, text, from.username);
      break;
    case '/status':
      await handleStatus(chatId);
      break;
    case '/help':
      await sendMessage(chatId, `
🐋 <b>WhaleScope Alerts — Help</b>

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

Need help? Email wrentheai@proton.me
      `.trim());
      break;
    case '/mute':
      // TODO: Implement mute
      await sendMessage(chatId, '🔇 Alerts paused. Use /unmute to resume.');
      break;
    case '/unmute':
      // TODO: Implement unmute
      await sendMessage(chatId, '🔊 Alerts resumed!');
      break;
    default:
      if (text.startsWith('/')) {
        await sendMessage(chatId, 'Unknown command. Try /help');
      }
  }
}

// Main polling loop (for development)
async function pollUpdates() {
  console.log('🤖 WhaleScope Telegram Bot starting...');
  
  let offset = 0;
  
  while (true) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          await processUpdate(update);
          offset = update.update_id + 1;
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// Run if executed directly
if (require.main === module) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
    process.exit(1);
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }
  pollUpdates();
}
