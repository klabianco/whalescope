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

// --- Trade Detection ---
function getTradeId(trade: CongressTrade): string {
  return `${trade.politician}-${trade.ticker}-${trade.traded}-${trade.type}-${trade.amount}`;
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

function detectNewTrades(): CongressTrade[] {
  const seen = loadSeenTrades();
  const current = loadCurrentTrades();
  const newTrades: CongressTrade[] = [];

  for (const trade of current) {
    const id = getTradeId(trade);
    if (!seen.has(id)) {
      newTrades.push(trade);
      seen.add(id);
    }
  }

  saveSeenTrades(seen);
  return newTrades;
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
    content: `🐋 **WhaleScope Alert** — ${trades.length} new Congress trade${trades.length > 1 ? 's' : ''}`,
    embeds,
  };
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

  // Detect new trades
  const newTrades = detectNewTrades();
  console.log(`🆕 New trades: ${newTrades.length}`);

  if (newTrades.length === 0) {
    console.log('No new trades. Done.');
    return;
  }

  // Log new trades
  for (const t of newTrades) {
    console.log(`  ${formatTradeText(t)}`);
  }
  console.log('');

  // Get Pro subscribers
  const subscribers = await getProSubscribers();
  const telegramSubs = subscribers.filter(s => s.telegram_chat_id);
  const discordSubs = subscribers.filter(s => s.discord_user_id);
  
  console.log(`👥 Pro subscribers: ${subscribers.length} (${telegramSubs.length} Telegram, ${discordSubs.length} Discord)`);

  // Send Telegram alerts
  let telegramSent = 0;
  if (TELEGRAM_BOT_TOKEN && telegramSubs.length > 0) {
    const message = formatTelegramMessage(newTrades);
    for (const sub of telegramSubs) {
      if (sub.telegram_chat_id && await sendTelegram(sub.telegram_chat_id, message)) {
        telegramSent++;
      }
      // Rate limit: max 30 messages/second for Telegram
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // Send Discord webhook (single channel, not per-user)
  let discordSent = 0;
  if (DISCORD_WEBHOOK_URL) {
    const message = formatDiscordMessage(newTrades);
    if (await sendDiscord(message)) {
      discordSent = 1;
    }
  }

  console.log(`\n✅ Alerts sent:`);
  console.log(`   Telegram: ${telegramSent}/${telegramSubs.length}`);
  console.log(`   Discord: ${discordSent}`);
}

main().catch(console.error);
