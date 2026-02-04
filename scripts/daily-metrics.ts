#!/usr/bin/env npx tsx

/**
 * Daily WhaleScope Metrics
 * Run: npx tsx scripts/daily-metrics.ts
 * 
 * Logs: email subs, page views, conversion rates to memory file
 */

import { createClient } from '@supabase/supabase-js';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getEmailStats() {
  const { data, error } = await supabase
    .from('email_subscribers')
    .select('subscribed_at, source')
    .order('subscribed_at', { ascending: false });

  if (error) throw error;

  const total = data.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCount = data.filter(d => new Date(d.subscribed_at) >= today).length;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayCount = data.filter(d => {
    const date = new Date(d.subscribed_at);
    return date >= yesterday && date < today;
  }).length;

  const bySource: Record<string, number> = {};
  data.forEach(d => {
    bySource[d.source] = (bySource[d.source] || 0) + 1;
  });

  return { total, todayCount, yesterdayCount, bySource };
}

async function getProSubscribers() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active');
  
  return data?.length || 0;
}

async function main() {
  const email = await getEmailStats();
  const proSubs = await getProSubscribers();
  
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  console.log(`\n📊 WhaleScope Daily Metrics - ${date} ${time}\n`);
  console.log(`📧 Email Subscribers: ${email.total} total`);
  console.log(`   Today: +${email.todayCount}`);
  console.log(`   Yesterday: +${email.yesterdayCount}`);
  console.log(`   By source: ${JSON.stringify(email.bySource)}`);
  console.log(`\n💰 Pro Subscribers: ${proSubs}`);
  
  // Log to memory file
  const memoryDir = join(process.env.HOME!, 'clawd', 'memory');
  const memoryFile = join(memoryDir, `${date}.md`);
  
  const entry = `
## WhaleScope Metrics (${time})
- **Email subs:** ${email.total} total (+${email.todayCount} today, +${email.yesterdayCount} yesterday)
- **By source:** ${Object.entries(email.bySource).map(([k,v]) => `${k}: ${v}`).join(', ')}
- **Pro subs:** ${proSubs}
`;

  if (!existsSync(memoryDir)) mkdirSync(memoryDir, { recursive: true });
  appendFileSync(memoryFile, entry);
  console.log(`\n✅ Logged to ${memoryFile}`);
}

main().catch(console.error);
