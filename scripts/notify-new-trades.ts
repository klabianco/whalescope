// Detect new trades and send alerts to subscribers
// Run with: npx tsx scripts/notify-new-trades.ts

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

interface Subscriber {
  email: string;
  subscribedAt: string;
  expiresAt: string;
}

interface Config {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
}

function getConfig(): Config {
  try {
    const configPath = join(process.env.HOME || '', '.config', 'whalescope', 'config.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch {}
  return {};
}

function getTradeId(trade: CongressTrade): string {
  return `${trade.politician}-${trade.ticker}-${trade.traded}-${trade.type}-${trade.amount}`;
}

function loadSeenTrades(): Set<string> {
  try {
    const seenPath = join(process.cwd(), 'data', 'seen-trades.json');
    if (existsSync(seenPath)) {
      return new Set(JSON.parse(readFileSync(seenPath, 'utf-8')));
    }
  } catch {}
  return new Set();
}

function saveSeenTrades(seen: Set<string>): void {
  const seenPath = join(process.cwd(), 'data', 'seen-trades.json');
  writeFileSync(seenPath, JSON.stringify([...seen], null, 2));
}

function loadCurrentTrades(): CongressTrade[] {
  const tradesPath = join(process.cwd(), 'data', 'congress-trades.json');
  if (existsSync(tradesPath)) {
    return JSON.parse(readFileSync(tradesPath, 'utf-8'));
  }
  return [];
}

function loadActiveSubscribers(): Subscriber[] {
  const subsPath = join(process.cwd(), 'data', 'subscribers.json');
  if (!existsSync(subsPath)) return [];
  
  try {
    const all: Subscriber[] = JSON.parse(readFileSync(subsPath, 'utf-8'));
    const now = new Date();
    return all.filter(s => new Date(s.expiresAt) > now);
  } catch {
    return [];
  }
}

function formatTradeForEmail(trade: CongressTrade): string {
  const emoji = trade.type === 'Purchase' ? '🟢' : '🔴';
  return `${emoji} ${trade.politician} (${trade.party}) - ${trade.type} $${trade.ticker}
   Amount: ${trade.amount}
   Traded: ${trade.traded}`;
}

async function sendEmailAlerts(subscribers: Subscriber[], trades: CongressTrade[]): Promise<number> {
  if (subscribers.length === 0) {
    console.log('  [SKIP] No active subscribers');
    return 0;
  }

  const subject = `🐋 WhaleScope Alert: ${trades.length} new Congress trade${trades.length > 1 ? 's' : ''}`;
  
  const body = `New congressional trading activity detected:

${trades.map(formatTradeForEmail).join('\n\n')}

---
View all trades: https://whalescope.app/congress

To unsubscribe, reply to this email.`;

  let sent = 0;
  
  for (const sub of subscribers) {
    try {
      // Escape quotes in body for shell
      const escapedBody = body.replace(/"/g, '\\"');
      execSync(`gog gmail send --to "${sub.email}" --subject "${subject}" --body "${escapedBody}"`, {
        stdio: 'pipe'
      });
      console.log(`  ✉️  Email sent to ${sub.email}`);
      sent++;
    } catch (err) {
      console.error(`  ❌ Failed to email ${sub.email}`);
    }
  }
  
  return sent;
}

async function sendTelegramAlert(config: Config, trade: CongressTrade): Promise<boolean> {
  if (!config.telegram_bot_token || !config.telegram_chat_id) {
    return false;
  }

  const emoji = trade.type === 'Purchase' ? '🟢' : '🔴';
  const partyEmoji = trade.party === 'D' ? '🔵' : '🔴';
  
  const message = `${emoji} *${trade.type.toUpperCase()}* Alert!

${partyEmoji} *${trade.politician}* (${trade.party}-${trade.chamber})

📈 Ticker: *$${trade.ticker}*
💰 Amount: ${trade.amount}
📅 Traded: ${trade.traded}
📋 Filed: ${trade.filed}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegram_chat_id,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔔 WhaleScope Trade Alert System\n');
  
  const config = getConfig();
  const seenTrades = loadSeenTrades();
  const currentTrades = loadCurrentTrades();
  const subscribers = loadActiveSubscribers();
  
  console.log(`📊 Current trades: ${currentTrades.length}`);
  console.log(`📝 Previously seen: ${seenTrades.size}`);
  console.log(`👥 Active subscribers: ${subscribers.length}\n`);
  
  // Find new trades
  const newTrades: CongressTrade[] = [];
  for (const trade of currentTrades) {
    const id = getTradeId(trade);
    if (!seenTrades.has(id)) {
      newTrades.push(trade);
      seenTrades.add(id);
    }
  }
  
  console.log(`🆕 New trades found: ${newTrades.length}\n`);
  
  if (newTrades.length === 0) {
    console.log('No new trades to alert.');
    saveSeenTrades(seenTrades);
    return;
  }
  
  // Limit to 10 most recent trades
  const tradesToAlert = newTrades.slice(0, 10);
  
  // Log what we're alerting
  for (const trade of tradesToAlert) {
    console.log(`📢 ${trade.politician} ${trade.type} $${trade.ticker}`);
  }
  console.log('');
  
  // Send email alerts (batched - one email with all trades)
  const emailsSent = await sendEmailAlerts(subscribers, tradesToAlert);
  
  // Send Telegram alerts (if configured)
  let telegramSent = 0;
  if (config.telegram_bot_token && config.telegram_chat_id) {
    for (const trade of tradesToAlert) {
      if (await sendTelegramAlert(config, trade)) {
        telegramSent++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  // Save seen trades
  saveSeenTrades(seenTrades);
  
  console.log(`\n✅ Done!`);
  console.log(`   Emails sent: ${emailsSent}`);
  if (telegramSent > 0) console.log(`   Telegram alerts: ${telegramSent}`);
}

main().catch(console.error);
