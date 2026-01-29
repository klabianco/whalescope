/**
 * WhaleScope Alert System
 * 
 * Detects new congress trades and sends alerts to Pro subscribers.
 * Supports: Telegram, Discord webhook
 * 
 * Usage: npx tsx scripts/send-alerts.ts
 * Runs as part of the data fetch pipeline.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendPushNotifications } from './send-push-notification';

// --- Load local config ---
function loadLocalConfig(): Record<string, string> {
  try {
    const configPath = join(process.env.HOME || '', '.config', 'whalescope', 'config.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch {}
  return {};
}

const localConfig = loadLocalConfig();

// --- Config (env vars override local config) ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mamjtxguzewxslbattal.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || localConfig.telegram_bot_token || '';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || localConfig.discord_webhook_url || '';

let supabase: SupabaseClient | null = null;
if (SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// --- Types ---
interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  company?: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

interface WhaleTrade {
  wallet: string;
  walletLabel?: string;
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenMint?: string;
  tokenAmount?: number;
  action: 'BUY' | 'SELL';
}

// --- Trade Detection ---
function getTradeId(trade: CongressTrade): string {
  return `${trade.politician}-${trade.ticker}-${trade.traded}-${trade.type}-${trade.amount}`;
}

function getWhaleTradeId(trade: WhaleTrade): string {
  return trade.signature;
}

function loadSeenTrades(): Set<string> {
  try {
    const path = join(process.cwd(), 'data', 'seen-trades.json');
    if (existsSync(path)) {
      return new Set(JSON.parse(readFileSync(path, 'utf-8')));
    }
  } catch {}
  return new Set();
}

function saveSeenTrades(seen: Set<string>): void {
  const path = join(process.cwd(), 'data', 'seen-trades.json');
  writeFileSync(path, JSON.stringify([...seen], null, 2));
}

function loadCurrentTrades(): CongressTrade[] {
  const path = join(process.cwd(), 'data', 'congress-trades.json');
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return [];
}

function loadCurrentWhaleTrades(): WhaleTrade[] {
  const path = join(process.cwd(), 'data', 'whale-trades.json');
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return [];
}

function detectNewTrades(): { congress: CongressTrade[]; whales: WhaleTrade[] } {
  const seen = loadSeenTrades();
  
  // Congress trades
  const currentCongress = loadCurrentTrades();
  const newCongress: CongressTrade[] = [];
  for (const trade of currentCongress) {
    const id = getTradeId(trade);
    if (!seen.has(id)) {
      newCongress.push(trade);
      seen.add(id);
    }
  }

  // Whale trades
  const currentWhales = loadCurrentWhaleTrades();
  const newWhales: WhaleTrade[] = [];
  for (const trade of currentWhales) {
    const id = `whale-${getWhaleTradeId(trade)}`;
    if (!seen.has(id)) {
      newWhales.push(trade);
      seen.add(id);
    }
  }

  saveSeenTrades(seen);
  return { congress: newCongress, whales: newWhales };
}

// --- Formatting ---
function formatTradeText(trade: CongressTrade): string {
  const emoji = trade.type === 'Purchase' ? '🟢' : '🔴';
  const partyEmoji = trade.party === 'D' ? '🔵' : trade.party === 'R' ? '🔴' : '⚪';
  const company = trade.company ? ` (${trade.company})` : '';
  
  return `${emoji} ${trade.type.toUpperCase()}: $${trade.ticker}${company}
${partyEmoji} ${trade.politician} (${trade.party}-${trade.chamber})
💰 ${trade.amount}
📅 Traded: ${trade.traded} | Filed: ${trade.filed}`;
}

function formatTelegramMessage(trades: CongressTrade[]): string {
  const header = `🐋 <b>WhaleScope Alert</b> — ${trades.length} new Congress trade${trades.length > 1 ? 's' : ''}\n\n`;
  
  const tradeLines = trades.slice(0, 10).map(trade => {
    const emoji = trade.type === 'Purchase' ? '🟢' : '🔴';
    const partyEmoji = trade.party === 'D' ? '🔵' : trade.party === 'R' ? '🔴' : '⚪';
    const company = trade.company ? ` (${trade.company})` : '';
    
    return `${emoji} <b>${trade.type}</b>: <b>$${trade.ticker}</b>${company}
${partyEmoji} ${trade.politician} (${trade.party}-${trade.chamber})
💰 ${trade.amount} | 📅 ${trade.traded}`;
  }).join('\n\n');

  const footer = trades.length > 10 
    ? `\n\n... and ${trades.length - 10} more`
    : '';

  return header + tradeLines + footer + '\n\n<a href="https://whalescope.app/congress">View all trades →</a>';
}

function formatDiscordMessage(trades: CongressTrade[]): object {
  const embeds = trades.slice(0, 10).map(trade => {
    const emoji = trade.type === 'Purchase' ? '🟢' : '🔴';
    return {
      title: `${emoji} ${trade.politician} — ${trade.type} $${trade.ticker}`,
      description: `**Amount:** ${trade.amount}\n**Traded:** ${trade.traded}\n**Filed:** ${trade.filed}`,
      color: trade.type === 'Purchase' ? 0x22c55e : 0xef4444,
      footer: { text: `${trade.party}-${trade.chamber}` },
    };
  });

  return {
    content: `🏛️ **WhaleScope Alert** — ${trades.length} new Congress trade${trades.length > 1 ? 's' : ''}`,
    embeds,
  };
}

// --- Whale Trade Formatting ---
function formatWhaleDiscordMessage(trades: WhaleTrade[]): object {
  const embeds = trades.slice(0, 10).map(trade => {
    const emoji = trade.action === 'BUY' ? '🟢' : '🔴';
    const label = trade.walletLabel || `${trade.wallet.slice(0, 6)}...${trade.wallet.slice(-4)}`;
    const time = new Date(trade.timestamp * 1000).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const desc = trade.description || `${trade.action} ${trade.tokenAmount?.toLocaleString() || '?'} tokens`;
    
    return {
      title: `${emoji} ${label} — ${trade.action}`,
      description: `${desc}\n**Time:** ${time}`,
      color: trade.action === 'BUY' ? 0x22c55e : 0xef4444,
      footer: { text: `Wallet: ${trade.wallet.slice(0, 8)}...` },
    };
  });

  return {
    content: `🐋 **Whale Alert** — ${trades.length} new whale trade${trades.length > 1 ? 's' : ''}`,
    embeds,
  };
}

function formatWhaleTelegramMessage(trades: WhaleTrade[]): string {
  const header = `🐋 <b>Whale Alert</b> — ${trades.length} new trade${trades.length > 1 ? 's' : ''}\n\n`;

  const lines = trades.slice(0, 10).map(trade => {
    const emoji = trade.action === 'BUY' ? '🟢' : '🔴';
    const label = trade.walletLabel || `${trade.wallet.slice(0, 6)}...${trade.wallet.slice(-4)}`;
    const desc = trade.description || `${trade.action} ${trade.tokenAmount?.toLocaleString() || '?'} tokens`;

    return `${emoji} <b>${label}</b>\n${desc}`;
  }).join('\n\n');

  return header + lines + '\n\n<a href="https://whalescope.app">View on WhaleScope →</a>';
}

// --- Delivery ---
async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error(`  Telegram error for ${chatId}:`, err);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error(`  Telegram error for ${chatId}:`, e.message);
    return false;
  }
}

async function sendDiscord(message: object): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) return false;
  
  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return res.ok;
  } catch (e: any) {
    console.error('  Discord error:', e.message);
    return false;
  }
}

// --- Subscriber Lookup ---
async function getProSubscribers(): Promise<{ telegram_chat_id: string | null; discord_user_id: string | null }[]> {
  if (!supabase || !SUPABASE_KEY) {
    console.log('  No Supabase key — skipping subscriber lookup');
    return [];
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('telegram_chat_id, discord_user_id')
    .eq('plan', 'pro');

  if (error) {
    console.error('  Supabase error:', error.message);
    return [];
  }

  return data || [];
}

// --- Main ---
async function main() {
  console.log('🔔 WhaleScope Alert System\n');

  // Detect new trades (both congress and whale)
  const { congress: newCongress, whales: newWhales } = detectNewTrades();
  console.log(`🏛️  New congress trades: ${newCongress.length}`);
  console.log(`🐋 New whale trades: ${newWhales.length}`);

  if (newCongress.length === 0 && newWhales.length === 0) {
    console.log('No new trades. Done.');
    return;
  }

  // Log new congress trades
  if (newCongress.length > 0) {
    console.log('\n--- Congress Trades ---');
    for (const t of newCongress) {
      console.log(`  ${formatTradeText(t)}`);
    }
  }

  // Log new whale trades
  if (newWhales.length > 0) {
    console.log('\n--- Whale Trades ---');
    for (const t of newWhales) {
      const label = t.walletLabel || `${t.wallet.slice(0, 8)}...`;
      console.log(`  ${t.action === 'BUY' ? '🟢' : '🔴'} ${label}: ${t.description || t.action}`);
    }
  }
  console.log('');

  // Get Pro subscribers
  const subscribers = await getProSubscribers();
  const telegramSubs = subscribers.filter(s => s.telegram_chat_id);
  
  console.log(`👥 Pro subscribers: ${subscribers.length} (${telegramSubs.length} Telegram)`);

  let telegramSent = 0;
  let discordSent = 0;

  // --- Congress alerts ---
  if (newCongress.length > 0) {
    // Telegram
    if (TELEGRAM_BOT_TOKEN && telegramSubs.length > 0) {
      const message = formatTelegramMessage(newCongress);
      for (const sub of telegramSubs) {
        if (sub.telegram_chat_id && await sendTelegram(sub.telegram_chat_id, message)) {
          telegramSent++;
        }
        await new Promise(r => setTimeout(r, 50));
      }
    }

    // Discord
    if (DISCORD_WEBHOOK_URL) {
      const message = formatDiscordMessage(newCongress);
      if (await sendDiscord(message)) discordSent++;
    }
  }

  // --- Whale alerts ---
  if (newWhales.length > 0) {
    // Telegram
    if (TELEGRAM_BOT_TOKEN && telegramSubs.length > 0) {
      const message = formatWhaleTelegramMessage(newWhales);
      for (const sub of telegramSubs) {
        if (sub.telegram_chat_id && await sendTelegram(sub.telegram_chat_id, message)) {
          telegramSent++;
        }
        await new Promise(r => setTimeout(r, 50));
      }
    }

    // Discord
    if (DISCORD_WEBHOOK_URL) {
      const message = formatWhaleDiscordMessage(newWhales);
      if (await sendDiscord(message)) discordSent++;
    }
  }

  // --- Web Push notifications ---
  let pushResult = { sent: 0, failed: 0, cleaned: 0 };

  if (newCongress.length > 0) {
    const pushTitle = `🏛️ ${newCongress.length} New Congress Trade${newCongress.length > 1 ? 's' : ''}`;
    const first = newCongress[0];
    const pushBody = newCongress.length === 1
      ? `${first.politician}: ${first.type} $${first.ticker} (${first.amount})`
      : `${first.politician} ${first.type.toLowerCase()}d $${first.ticker} and ${newCongress.length - 1} more`;
    pushResult = await sendPushNotifications(pushTitle, pushBody, 'https://whalescope.app/congress');
  }

  if (newWhales.length > 0) {
    const pushTitle = `🐋 ${newWhales.length} New Whale Trade${newWhales.length > 1 ? 's' : ''}`;
    const first = newWhales[0];
    const label = first.walletLabel || `${first.wallet.slice(0, 6)}...`;
    const pushBody = newWhales.length === 1
      ? `${label}: ${first.description || first.action}`
      : `${label} and ${newWhales.length - 1} more whale trades`;
    const whalePush = await sendPushNotifications(pushTitle, pushBody, 'https://whalescope.app');
    pushResult.sent += whalePush.sent;
    pushResult.failed += whalePush.failed;
    pushResult.cleaned += whalePush.cleaned;
  }

  console.log(`\n✅ Alerts sent:`);
  console.log(`   Telegram: ${telegramSent}`);
  console.log(`   Discord: ${discordSent}`);
  console.log(`   Push: ${pushResult.sent} (${pushResult.failed} failed, ${pushResult.cleaned} cleaned)`);
}

main().catch(console.error);
