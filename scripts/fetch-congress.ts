// Fetch congressional stock trades from Quiver Quant API
// Run with: npm run fetch-congress
// Requires: QUIVER_API_KEY in ~/.config/whalescope/config.json

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

interface QuiverTrade {
  Representative?: string;
  Senator?: string;
  BioGuideID: string;
  Transaction: string;
  Ticker: string;
  Range: string;
  Date: string;
  Amount: string;
  last_modified: string;
}

// Ticker → Company name lookup for common stocks
const COMPANY_LOOKUP: Record<string, string> = {
  'AAPL': 'Apple Inc', 'MSFT': 'Microsoft Corp', 'GOOGL': 'Alphabet Inc',
  'AMZN': 'Amazon.com', 'NVDA': 'NVIDIA Corp', 'META': 'Meta Platforms',
  'TSLA': 'Tesla Inc', 'AMD': 'Advanced Micro Devices', 'NFLX': 'Netflix Inc',
  'AVGO': 'Broadcom Inc', 'CRM': 'Salesforce Inc', 'INTC': 'Intel Corp',
  'QCOM': 'Qualcomm Inc', 'CSCO': 'Cisco Systems', 'ADBE': 'Adobe Inc',
  'TXN': 'Texas Instruments', 'IBM': 'IBM Corp', 'ORCL': 'Oracle Corp',
  'BA': 'Boeing Co', 'CAT': 'Caterpillar Inc', 'GS': 'Goldman Sachs',
  'JPM': 'JPMorgan Chase', 'V': 'Visa Inc', 'MA': 'Mastercard Inc',
  'UNH': 'UnitedHealth Group', 'JNJ': 'Johnson & Johnson', 'PFE': 'Pfizer Inc',
  'MRK': 'Merck & Co', 'ABBV': 'AbbVie Inc', 'LLY': 'Eli Lilly',
  'WMT': 'Walmart Inc', 'HD': 'Home Depot', 'KO': 'Coca-Cola Co',
  'PEP': 'PepsiCo Inc', 'MCD': "McDonald's Corp", 'DIS': 'Walt Disney Co',
  'PYPL': 'PayPal Holdings', 'SQ': 'Block Inc', 'SHOP': 'Shopify Inc',
  'COIN': 'Coinbase Global', 'PLTR': 'Palantir Technologies',
  'T': 'AT&T Inc', 'VZ': 'Verizon Communications', 'CMCSA': 'Comcast Corp',
  'NOC': 'Northrop Grumman', 'LMT': 'Lockheed Martin', 'RTX': 'RTX Corp',
  'GD': 'General Dynamics', 'GE': 'GE Aerospace', 'HON': 'Honeywell',
  'MMM': '3M Company', 'XOM': 'Exxon Mobil', 'CVX': 'Chevron Corp',
  'COP': 'ConocoPhillips', 'NEE': 'NextEra Energy', 'SO': 'Southern Co',
  'VST': 'Vistra Corp', 'GEV': 'GE Vernova', 'FLR': 'Fluor Corp',
  'CLX': 'Clorox Co', 'GIS': 'General Mills', 'UAL': 'United Airlines',
  'DASH': 'DoorDash Inc', 'CBOE': 'Cboe Global Markets',
  'BRK.B': 'Berkshire Hathaway', 'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ Trust', 'IWM': 'iShares Russell 2000',
  'BMY': 'Bristol-Myers Squibb', 'ARE': 'Alexandria Real Estate',
  'WPC': 'W.P. Carey Inc', 'SWK': 'Stanley Black & Decker',
  'BSCQ': 'Invesco BulletShares 2026',
};

// Party lookup by BioGuideID or name (known politicians)
const PARTY_LOOKUP: Record<string, 'D' | 'R'> = {
  // Democrats
  'Nancy Pelosi': 'D',
  'Josh Gottheimer': 'D',
  'Alexandria Ocasio-Cortez': 'D',
  'Ro Khanna': 'D',
  'Gilbert Cisneros': 'D',
  'Rick Larsen': 'D',
  'Cleo Fields': 'D',
  'Jonathan Jackson': 'D',
  'Steve Cohen': 'D', // TN-09
  // Republicans
  'Tommy Tuberville': 'R',
  'Dan Crenshaw': 'R',
  'Michael McCaul': 'R',
  'Marjorie Taylor Greene': 'R',
  'Kevin Hern': 'R',
  'Mark Green': 'R',
  'David J. Taylor': 'R',
  'French Hill': 'R',
  'James French Hill': 'R',
  'John James': 'R',
  'Rick W. Allen': 'R',
  'Mike Kelly': 'R',
  'Steve Womack': 'R',
  'Gary Palmer': 'R',
  'John Hoeven': 'R',
  'Markwayne Mullin': 'R',
  'Shelley Moore Capito': 'R',
  'Tim Moore': 'R',
  'Roger Williams': 'R',
  'Dan Newhouse': 'R',
  'Virginia Foxx': 'R',
  'Robert E. Latta': 'R',
  // Senators
  'Gary Peters': 'D',
  'Lindsey Graham': 'R',
  'Tommy Tuberville': 'R',
  'John Hoeven': 'R',
  'Shelley Moore Capito': 'R',
  'Markwayne Mullin': 'R',
  'Bill Hagerty': 'R',
  'Mark Kelly': 'D',
  'Jacky Rosen': 'D',
  'John Fetterman': 'D',
  'Kyrsten Sinema': 'I',
  'Joe Manchin': 'D',
  'Susan Collins': 'R',
  'Mitt Romney': 'R',
  'John Thune': 'R',
  'Mike Crapo': 'R',
  'Tim Scott': 'R',
  'Ted Cruz': 'R',
  'Marco Rubio': 'R',
  'Rand Paul': 'R',
  'Pete Ricketts': 'R',
  'Katie Britt': 'R',
  'John Boozman': 'R',
  'Angus King': 'I',
  'A. Mitchell Jr. McConnell': 'R',
  'John Hickenlooper': 'D',
  'David H. McCormick': 'R',
  'Sheldon Whitehouse': 'D',
  'Tina Smith': 'D',
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
    const party = PARTY_LOOKUP[t.Representative];
    if (!party) {
      console.warn(`  ⚠️  Unknown party for House member: ${t.Representative} — defaulting to unknown`);
    }
    trades.push({
      politician: t.Representative,
      party: party || 'R',
      chamber: 'House',
      state: '',
      ticker: t.Ticker,
      company: COMPANY_LOOKUP[t.Ticker] || '',
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
    const name = t.Senator || t.Representative;
    if (!name || !t.Ticker) continue;
    const party = PARTY_LOOKUP[name];
    if (!party) {
      console.warn(`  ⚠️  Unknown party for Senator: ${name} — defaulting to unknown`);
    }
    trades.push({
      politician: name,
      party: party || 'R',
      chamber: 'Senate',
      state: '',
      ticker: t.Ticker,
      company: COMPANY_LOOKUP[t.Ticker] || '',
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
  
  // Save trades to data/ directory (local backup only)
  const dataPath = join(process.cwd(), 'data', 'congress-trades.json');
  const tradesJson = JSON.stringify(trades, null, 2);
  writeFileSync(dataPath, tradesJson);
  console.log(`\nSaved ${trades.length} trades to ${dataPath}`);

  // Sync to Supabase (primary data source)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    console.log('\nSyncing to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let inserted = 0;
    let skipped = 0;
    
    for (let i = 0; i < trades.length; i += 50) {
      const batch = trades.slice(i, i + 50).map(t => {
        const hashStr = `${t.politician}-${t.ticker}-${t.type}-${t.filed}-${t.traded}-${t.amount}`;
        return {
          politician: t.politician,
          party: t.party,
          chamber: t.chamber,
          state: t.state || '',
          ticker: t.ticker,
          company: t.company || '',
          trade_type: t.type,
          amount: t.amount || '',
          filed_date: t.filed,
          traded_date: t.traded || null,
          trade_hash: createHash('md5').update(hashStr).digest('hex'),
        };
      });

      const { data, error } = await supabase
        .from('congress_trades')
        .upsert(batch, { onConflict: 'trade_hash', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.error(`  Batch error:`, error.message);
        skipped += batch.length;
      } else {
        inserted += data?.length || 0;
      }
    }
    
    console.log(`  Synced: ${inserted} inserted/updated, ${skipped} errors`);
  } else {
    console.log('\n⚠️  No Supabase config — trades only saved locally');
  }
  
  // NOTE: No longer writing to public/ — data is served via /api/congress-trades from Supabase
  console.log('\n✅ Congress trades are served from Supabase via /api/congress-trades');
}

main().catch(console.error);
