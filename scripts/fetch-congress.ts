// Fetch congressional stock trades from Quiver Quant API
// Run with: npm run fetch-congress
// Requires: QUIVER_API_KEY in ~/.config/whalescope/config.json

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface QuiverTrade {
  Representative: string;
  BioGuideID: string;
  Transaction: string;
  Ticker: string;
  Range: string;
  Date: string;
  Amount: string;
  last_modified: string;
}

// Party lookup by BioGuideID or name (known politicians)
const PARTY_LOOKUP: Record<string, 'D' | 'R'> = {
  'Nancy Pelosi': 'D',
  'Tommy Tuberville': 'R',
  'Dan Crenshaw': 'R',
  'Michael McCaul': 'R',
  'Josh Gottheimer': 'D',
  'Marjorie Taylor Greene': 'R',
  'Alexandria Ocasio-Cortez': 'D',
  'Ro Khanna': 'D',
  'Kevin Hern': 'R',
  'Mark Green': 'R',
  'David J. Taylor': 'R',
  'French Hill': 'R',
  'John James': 'R',
  'Rick W. Allen': 'R',
  'Mike Kelly': 'R',
  'Steve Womack': 'R',
  'Gary Palmer': 'R',
  'Tommy Tuberville': 'R',
  'John Hoeven': 'R',
  'Markwayne Mullin': 'R',
  'Shelley Moore Capito': 'R',
  // Add more as needed
};

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

function getConfig(): { quiver_api_key?: string } {
  try {
    const configPath = join(process.env.HOME || '', '.config', 'whalescope', 'config.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch {}
  return {};
}

async function fetchFromQuiver(apiKey: string): Promise<CongressTrade[]> {
  const trades: CongressTrade[] = [];
  
  // Fetch House trades
  console.log('Fetching House trades...');
  const houseRes = await fetch('https://api.quiverquant.com/beta/live/housetrading', {
    headers: { 'Authorization': `Token ${apiKey}` }
  });
  
  if (!houseRes.ok) {
    throw new Error(`House API error: ${houseRes.status} ${await houseRes.text()}`);
  }
  
  const houseTrades: QuiverTrade[] = await houseRes.json();
  console.log(`  Got ${houseTrades.length} House trades`);
  
  for (const t of houseTrades.slice(0, 100)) {
    if (!t.Representative || !t.Ticker) continue;
    trades.push({
      politician: t.Representative,
      party: PARTY_LOOKUP[t.Representative] || 'R', // Default to R if unknown
      chamber: 'House',
      state: '',
      ticker: t.Ticker,
      company: '',
      type: t.Transaction?.toLowerCase()?.includes('sale') ? 'Sale' : 'Purchase',
      amount: t.Range || 'Unknown',
      filed: t.last_modified || '',
      traded: t.Date || ''
    });
  }
  
  // Fetch Senate trades
  console.log('Fetching Senate trades...');
  const senateRes = await fetch('https://api.quiverquant.com/beta/live/senatetrading', {
    headers: { 'Authorization': `Token ${apiKey}` }
  });
  
  if (!senateRes.ok) {
    throw new Error(`Senate API error: ${senateRes.status}`);
  }
  
  const senateTrades: QuiverTrade[] = await senateRes.json();
  console.log(`  Got ${senateTrades.length} Senate trades`);
  
  for (const t of senateTrades.slice(0, 100)) {
    if (!t.Representative || !t.Ticker) continue;
    trades.push({
      politician: t.Representative,
      party: PARTY_LOOKUP[t.Representative] || 'R', // Default to R if unknown
      chamber: 'Senate',
      state: '',
      ticker: t.Ticker,
      company: '',
      type: t.Transaction?.toLowerCase()?.includes('sale') ? 'Sale' : 'Purchase',
      amount: t.Range || 'Unknown',
      filed: t.last_modified || '',
      traded: t.Date || ''
    });
  }
  
  // Sort by filed date descending
  return trades.sort((a, b) => new Date(b.filed).getTime() - new Date(a.filed).getTime());
}

// Fallback: generate sample data if no API key
function generateSampleData(): CongressTrade[] {
  const now = new Date();
  const trades: CongressTrade[] = [];
  
  const politicians = [
    { name: 'Nancy Pelosi', party: 'D' as const, chamber: 'House' as const },
    { name: 'Tommy Tuberville', party: 'R' as const, chamber: 'Senate' as const },
    { name: 'Dan Crenshaw', party: 'R' as const, chamber: 'House' as const },
    { name: 'Michael McCaul', party: 'R' as const, chamber: 'House' as const },
    { name: 'Josh Gottheimer', party: 'D' as const, chamber: 'House' as const },
    { name: 'Marjorie Taylor Greene', party: 'R' as const, chamber: 'House' as const },
  ];
  
  const stocks = [
    { ticker: 'NVDA', company: 'NVIDIA Corp' },
    { ticker: 'AAPL', company: 'Apple Inc' },
    { ticker: 'MSFT', company: 'Microsoft Corp' },
    { ticker: 'GOOGL', company: 'Alphabet Inc' },
    { ticker: 'TSLA', company: 'Tesla Inc' },
    { ticker: 'META', company: 'Meta Platforms' },
    { ticker: 'AMZN', company: 'Amazon.com' },
    { ticker: 'AMD', company: 'Advanced Micro Devices' },
  ];
  
  const amounts = [
    '$1,001 - $15,000',
    '$15,001 - $50,000',
    '$50,001 - $100,000',
    '$100,001 - $250,000',
    '$250,001 - $500,000',
    '$500,001 - $1,000,000',
    '$1,000,001 - $5,000,000',
  ];
  
  for (let i = 0; i < 25; i++) {
    const politician = politicians[Math.floor(Math.random() * politicians.length)];
    const stock = stocks[Math.floor(Math.random() * stocks.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const type = Math.random() > 0.4 ? 'Purchase' : 'Sale';
    
    const tradedDaysAgo = Math.floor(Math.random() * 30) + 5;
    const filedDaysAgo = tradedDaysAgo - Math.floor(Math.random() * 5);
    
    const tradedDate = new Date(now);
    tradedDate.setDate(tradedDate.getDate() - tradedDaysAgo);
    
    const filedDate = new Date(now);
    filedDate.setDate(filedDate.getDate() - filedDaysAgo);
    
    trades.push({
      politician: politician.name,
      party: politician.party,
      chamber: politician.chamber,
      state: '',
      ticker: stock.ticker,
      company: stock.company,
      type: type as 'Purchase' | 'Sale',
      amount,
      filed: filedDate.toISOString().split('T')[0],
      traded: tradedDate.toISOString().split('T')[0],
    });
  }
  
  return trades.sort((a, b) => new Date(b.filed).getTime() - new Date(a.filed).getTime());
}

async function main() {
  console.log('Fetching congressional trades...\n');
  
  const config = getConfig();
  let trades: CongressTrade[];
  
  if (config.quiver_api_key) {
    console.log('Using Quiver Quant API\n');
    try {
      trades = await fetchFromQuiver(config.quiver_api_key);
      console.log(`\nFetched ${trades.length} total trades from Quiver`);
    } catch (err) {
      console.error('Quiver API error:', err);
      console.log('Falling back to sample data...');
      trades = generateSampleData();
    }
  } else {
    console.log('No Quiver API key found. Using sample data.');
    console.log('Add your key to ~/.config/whalescope/config.json:');
    console.log('  { "quiver_api_key": "YOUR_KEY" }\n');
    trades = generateSampleData();
  }
  
  // Save trades to both data/ and public/ directories
  const dataPath = join(process.cwd(), 'data', 'congress-trades.json');
  const publicPath = join(process.cwd(), 'public', 'congress-trades.json');
  const tradesJson = JSON.stringify(trades, null, 2);
  writeFileSync(dataPath, tradesJson);
  writeFileSync(publicPath, tradesJson);
  console.log(`\nSaved ${trades.length} trades to ${dataPath}`);
  console.log(`Copied to ${publicPath} for client-side access`);
}

main().catch(console.error);
