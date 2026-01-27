import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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

function getTrades(): CongressTrade[] {
  try {
    const dataPath = join(process.cwd(), 'data', 'congress-trades.json');
    if (!existsSync(dataPath)) return [];
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getCommitteeData(): CommitteeData {
  try {
    const dataPath = join(process.cwd(), 'data', 'committee-data.json');
    if (!existsSync(dataPath)) return { committees: {}, members: {} };
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
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

export default function CongressPage() {
  const trades = getTrades();
  const topTraders = calculateTopTraders(trades);
  const committeeData = getCommitteeData();
  const politicians = Array.from(new Set(trades.map(t => t.politician)));
  
  return <CongressClient trades={trades} topTraders={topTraders} committeeData={committeeData} politicians={politicians} />;
}
