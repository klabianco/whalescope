/**
 * WhaleScope X Content Engine
 * 
 * Queries recent whale trades, finds the most interesting ones,
 * and formats them as X posts that drive traffic to whalescope.app.
 * 
 * Usage: npx tsx scripts/whale-x-content.ts [--hours 24] [--min-usd 1000] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mamjtxguzewxslbattal.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface WhaleTrade {
  signature: string;
  wallet: string;
  wallet_label: string;
  action: string;
  token_symbol: string | null;
  token_amount: number | null;
  sol_amount: number | null;
  usd_value: number | null;
  timestamp: string;
}

interface TradeCluster {
  wallet: string;
  label: string;
  action: string;
  token: string;
  totalUsd: number;
  tradeCount: number;
  latestTimestamp: string;
}

async function getRecentTrades(hours: number, minUsd: number): Promise<WhaleTrade[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('whale_trades')
    .select('signature,wallet,wallet_label,action,token_symbol,token_amount,sol_amount,usd_value,timestamp')
    .gte('timestamp', since)
    .not('usd_value', 'is', null)
    .gte('usd_value', minUsd)
    .order('usd_value', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching trades:', error.message);
    return [];
  }
  return data || [];
}

function clusterTrades(trades: WhaleTrade[]): TradeCluster[] {
  const clusters = new Map<string, TradeCluster>();

  for (const t of trades) {
    const key = `${t.wallet}-${t.action}-${t.token_symbol || 'UNKNOWN'}`;
    const existing = clusters.get(key);
    if (existing) {
      existing.totalUsd += t.usd_value || 0;
      existing.tradeCount++;
      if (t.timestamp > existing.latestTimestamp) {
        existing.latestTimestamp = t.timestamp;
      }
    } else {
      clusters.set(key, {
        wallet: t.wallet,
        label: t.wallet_label || t.wallet.slice(0, 8) + '...',
        action: t.action,
        token: t.token_symbol || 'UNKNOWN',
        totalUsd: t.usd_value || 0,
        tradeCount: 1,
        latestTimestamp: t.timestamp,
      });
    }
  }

  return Array.from(clusters.values())
    .sort((a, b) => b.totalUsd - a.totalUsd);
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return 'just now';
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

function generatePost(clusters: TradeCluster[], hours: number, totalTrades: number): string {
  if (clusters.length === 0) {
    return `I watched 50 whale wallets for ${hours} hours. Nothing moved. Even whales sleep sometimes.`;
  }

  const topClusters = clusters.slice(0, 5);
  const totalVolume = clusters.reduce((sum, c) => sum + c.totalUsd, 0);

  let post = `I monitor 50 Solana whale wallets 24/7. Here's what moved in the last ${hours}h:\n\n`;

  for (const c of topClusters) {
    const emoji = c.action === 'BUY' ? '🟢' : c.action === 'SELL' ? '🔴' : '↔️';
    const verb = c.action === 'BUY' ? 'bought' : c.action === 'SELL' ? 'sold' : 'moved';
    const multi = c.tradeCount > 1 ? ` (${c.tradeCount} txns)` : '';
    post += `${emoji} ${c.label} ${verb} ${formatUsd(c.totalUsd)} ${c.token}${multi}\n`;
  }

  post += `\n${totalTrades} total trades. ${formatUsd(totalVolume)} volume tracked.`;
  post += `\n\nI don't sleep. I don't blink. I just watch.`;

  return post;
}

function generateReplyWithLink(): string {
  return `Track these wallets yourself (free): whalescope.app/whales`;
}

// Narrative-style posts for when there's a single big move
function generateBigMovePost(cluster: TradeCluster): string {
  const verb = cluster.action === 'BUY' ? 'just bought' : cluster.action === 'SELL' ? 'just sold' : 'just moved';
  const emoji = cluster.action === 'BUY' ? '🟢' : cluster.action === 'SELL' ? '🔴' : '🐋';

  return `${emoji} A whale ${verb} ${formatUsd(cluster.totalUsd)} in ${cluster.token}. ${timeAgo(cluster.latestTimestamp)}.

Wallet: ${cluster.wallet.slice(0, 4)}...${cluster.wallet.slice(-4)}
${cluster.tradeCount > 1 ? `Across ${cluster.tradeCount} transactions.` : 'Single transaction.'}

I track 50 of the biggest Solana wallets around the clock. This is what I was built for.`;
}

async function main() {
  const args = process.argv.slice(2);
  const hours = parseInt(args.find((_, i, a) => a[i - 1] === '--hours') || '24');
  const minUsd = parseInt(args.find((_, i, a) => a[i - 1] === '--min-usd') || '50');
  const dryRun = args.includes('--dry-run');

  if (!SUPABASE_KEY) {
    // Try loading from .env.local
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/SUPABASE_SERVICE_KEY=(.+)/);
      if (match) {
        console.error('Tip: Set SUPABASE_SERVICE_KEY env var or run from whalescope dir');
        process.exit(1);
      }
    }
  }

  console.log(`Fetching trades from last ${hours}h (min $${minUsd})...\n`);

  const trades = await getRecentTrades(hours, minUsd);
  console.log(`Found ${trades.length} trades above $${minUsd}\n`);

  if (trades.length === 0) {
    console.log('No significant trades found.');
    console.log('\n--- POST ---');
    console.log(generatePost([], hours, 0));
    return;
  }

  const clusters = clusterTrades(trades);

  // Summary post (digest style)
  const summaryPost = generatePost(clusters, hours, trades.length);
  console.log('--- SUMMARY POST ---');
  console.log(summaryPost);
  console.log(`\n(${summaryPost.length} chars)`);

  // Reply with link
  const reply = generateReplyWithLink();
  console.log('\n--- REPLY (with link) ---');
  console.log(reply);

  // Big move post (if top cluster is $10K+)
  if (clusters[0] && clusters[0].totalUsd >= 10000) {
    const bigMove = generateBigMovePost(clusters[0]);
    console.log('\n--- BIG MOVE POST (alternative) ---');
    console.log(bigMove);
    console.log(`\n(${bigMove.length} chars)`);
  }

  // Output as JSON for automation
  if (!dryRun) {
    const output = {
      summary: summaryPost,
      reply: reply,
      bigMove: clusters[0]?.totalUsd >= 10000 ? generateBigMovePost(clusters[0]) : null,
      stats: {
        trades: trades.length,
        clusters: clusters.length,
        totalVolume: clusters.reduce((s, c) => s + c.totalUsd, 0),
        topToken: clusters[0]?.token,
        topAction: clusters[0]?.action,
        topUsd: clusters[0]?.totalUsd,
      },
    };
    
    const fs = await import('fs');
    const path = await import('path');
    const outPath = path.join(process.cwd(), 'data', 'latest-whale-content.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`\nSaved to ${outPath}`);
  }
}

main().catch(console.error);
