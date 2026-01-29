import { createClient } from '@supabase/supabase-js';
import CongressClient from './CongressClient';

interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  state: string;
  ticker: string;
  company: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

interface CommitteeData {
  committees: Record<string, {
    sectors: string[];
    tickers: string[];
  }>;
  members: Record<string, string[]>;
}

// Server-side: fetch free-tier trades from Supabase at build time
// This gives Google indexable content while protecting Pro data
async function getFreeTierTrades(): Promise<CongressTrade[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return [];

    const supabase = createClient(url, key);
    
    // Free tier: trades older than 24h, max 25
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('congress_trades')
      .select('*')
      .lte('filed_date', yesterdayStr)
      .order('filed_date', { ascending: false })
      .limit(25);

    if (error || !data) return [];

    return data.map(t => ({
      politician: t.politician,
      party: t.party as 'D' | 'R' | 'I',
      chamber: t.chamber as 'House' | 'Senate',
      state: t.state || '',
      ticker: t.ticker,
      company: t.company || '',
      type: t.trade_type as 'Purchase' | 'Sale',
      amount: t.amount || '',
      filed: t.filed_date,
      traded: t.traded_date || '',
    }));
  } catch {
    return [];
  }
}

function getCommitteeData(): CommitteeData {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'committee-data.json');
    if (!fs.existsSync(dataPath)) return { committees: {}, members: {} };
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch {
    return { committees: {}, members: {} };
  }
}

function calculateTopTraders(trades: CongressTrade[]) {
  const traderMap = new Map<string, { party: string; count: number }>();
  
  for (const trade of trades) {
    const existing = traderMap.get(trade.politician) || { party: trade.party, count: 0 };
    existing.count++;
    traderMap.set(trade.politician, existing);
  }
  
  return Array.from(traderMap.entries())
    .map(([name, data]) => ({ name, party: data.party, trades: data.count }))
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 6);
}

// Get full list of tracked politicians (for the count display)
function getAllPoliticians(): string[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'congress-trades.json');
    if (!fs.existsSync(dataPath)) return [];
    const trades = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    return Array.from(new Set(trades.map((t: any) => t.politician)));
  } catch {
    return [];
  }
}

export default async function CongressPage() {
  const trades = await getFreeTierTrades();
  const topTraders = calculateTopTraders(trades);
  const committeeData = getCommitteeData();
  const politicians = getAllPoliticians();
  
  return <CongressClient trades={trades} topTraders={topTraders} committeeData={committeeData} politicians={politicians} />;
}
