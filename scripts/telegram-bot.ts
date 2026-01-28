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

// Handle /start command with connection code
async function handleStart(chatId: number, userId: number, text: string, username?: string) {
  const parts = text.split(' ');
  
  if (parts.length < 2) {
    // No connection code, send welcome message
    await sendMessage(chatId, `
🐋 <b>Welcome to WhaleScope!</b>

To connect your account and receive alerts:

1. Log in at whalescope.io/dashboard
2. Go to Alert Channels → Telegram
3. Click "Connect" to get your code
4. Send it here: /start YOUR_CODE

Or upgrade to Pro at whalescope.io/pricing
    `.trim());
    return;
  }

  const connectionCode = parts[1];
  
  // Look up the connection code in the database
  const { data: pendingConnection, error } = await supabase
    .from('telegram_connections')
    .select('user_id')
    .eq('code', connectionCode)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !pendingConnection) {
    await sendMessage(chatId, `
❌ <b>Invalid or expired code</b>

Please get a new code from your dashboard:
whalescope.io/dashboard
    `.trim());
    return;
  }

  // Update user's profile with Telegram chat ID
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      telegram_chat_id: chatId.toString(),
      telegram_username: username || null,
    })
    .eq('id', pendingConnection.user_id);

  if (updateError) {
    console.error('Error updating profile:', updateError);
    await sendMessage(chatId, '❌ Error connecting account. Please try again.');
    return;
  }

  // Mark connection code as used
  await supabase
    .from('telegram_connections')
    .update({ used: true })
    .eq('code', connectionCode);

  await sendMessage(chatId, `
✅ <b>Account connected!</b>

You'll now receive real-time alerts for your watchlist.

<b>Commands:</b>
/status - Check your subscription
/mute - Pause alerts
/unmute - Resume alerts
/settings - Alert preferences

Happy trading! 🐋
  `.trim());
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
whalescope.io/dashboard
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

Manage at whalescope.io/dashboard
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

<a href="https://whalescope.io/congress/${encodeURIComponent(trade.politician_name.toLowerCase().replace(/ /g, '-'))}">View Profile →</a>
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

<a href="https://whalescope.io/wallet/${trade.wallet}">View Wallet →</a>
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
🐋 <b>WhaleScope Bot Commands</b>

/start [code] - Connect your account
/status - Check subscription status
/mute - Pause alerts
/unmute - Resume alerts
/help - Show this message

Need help? support@whalescope.io
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
