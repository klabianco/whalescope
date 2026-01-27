// Detect new trades and send Telegram alerts
// Run with: npx tsx scripts/notify-new-trades.ts
// Config: ~/.config/whalescope/config.json needs:
//   { "quiver_api_key": "...", "telegram_bot_token": "...", "telegram_chat_id": "..." }

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

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

interface Config {
  quiver_api_key?: string;
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
  // Create unique ID for a trade
  return `${trade.politician}-${trade.ticker}-${trade.traded}-${trade.type}-${trade.amount}`;
}

function loadSeenTrades(): Set<string> {
  try {
    const seenPath = join(process.cwd(), 'data', 'seen-trades.json');
    if (existsSync(seenPath)) {
      const data = JSON.parse(readFileSync(seenPath, 'utf-8'));
      return new Set(data);
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

async function sendTelegramAlert(config: Config, trade: CongressTrade): Promise<boolean> {
  if (!config.telegram_bot_token || !config.telegram_chat_id) {
    console.log('  [SKIP] No Telegram config');
    return false;
  }

  const emoji = trade.type === 'Purchase' ? '🟢' : '🔴';
  const partyEmoji = trade.party === 'D' ? '🔵' : '🔴';
  
  const message = `${emoji} *${trade.type.toUpperCase()}* Alert!

${partyEmoji} *${trade.politician}* (${trade.party}-${trade.chamber})

📈 Ticker: *$${trade.ticker}*
💰 Amount: ${trade.amount}
📅 Traded: ${trade.traded}
📋 Filed: ${trade.filed}

[View on WhaleScope](https://whalescope.app/congress)`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegram_chat_id,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      }
    );
    
    if (!res.ok) {
      console.error('  Telegram error:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('  Telegram error:', err);
    return false;
  }
}

async function main() {
  console.log('🔔 WhaleScope Trade Alert System\n');
  
  const config = getConfig();
  const seenTrades = loadSeenTrades();
  const currentTrades = loadCurrentTrades();
  
  console.log(`📊 Current trades: ${currentTrades.length}`);
  console.log(`📝 Previously seen: ${seenTrades.size}\n`);
  
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
    return;
  }
  
  // Send alerts for new trades (limit to 10 most recent to avoid spam)
  const tradesToAlert = newTrades.slice(0, 10);
  let alertsSent = 0;
  
  for (const trade of tradesToAlert) {
    console.log(`📢 Alerting: ${trade.politician} ${trade.type} $${trade.ticker}`);
    const sent = await sendTelegramAlert(config, trade);
    if (sent) {
      alertsSent++;
      // Rate limit: wait 1 second between messages
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  // Save seen trades
  saveSeenTrades(seenTrades);
  
  console.log(`\n✅ Done! Sent ${alertsSent} alerts.`);
  if (newTrades.length > 10) {
    console.log(`   (${newTrades.length - 10} more trades not alerted to avoid spam)`);
  }
}

main().catch(console.error);
