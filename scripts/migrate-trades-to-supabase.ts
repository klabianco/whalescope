/**
 * One-time migration: Load congress-trades.json into Supabase
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mamjtxguzewxslbattal.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Trade {
  politician: string;
  party: string;
  chamber: string;
  state: string;
  ticker: string;
  company: string;
  type: string;
  amount: string;
  filed: string;
  traded: string;
}

function makeHash(t: Trade): string {
  const str = `${t.politician}-${t.ticker}-${t.type}-${t.filed}-${t.traded}-${t.amount}`;
  return createHash('md5').update(str).digest('hex');
}

async function main() {
  const dataPath = join(process.cwd(), 'data', 'congress-trades.json');
  if (!existsSync(dataPath)) {
    console.error('No data/congress-trades.json found');
    process.exit(1);
  }

  const trades: Trade[] = JSON.parse(readFileSync(dataPath, 'utf-8'));
  console.log(`Loading ${trades.length} trades into Supabase...`);

  let inserted = 0;
  let skipped = 0;

  // Batch insert in chunks of 50
  for (let i = 0; i < trades.length; i += 50) {
    const batch = trades.slice(i, i + 50).map(t => ({
      politician: t.politician,
      party: t.party,
      chamber: t.chamber,
      state: t.state || '',
      ticker: t.ticker,
      company: t.company || '',
      trade_type: t.type === 'Purchase' ? 'Purchase' : 'Sale',
      amount: t.amount || '',
      filed_date: t.filed,
      traded_date: t.traded || null,
      trade_hash: makeHash(t),
    }));

    const { data, error } = await supabase
      .from('congress_trades')
      .upsert(batch, { onConflict: 'trade_hash', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error(`Batch ${i} error:`, error.message);
      skipped += batch.length;
    } else {
      inserted += data?.length || 0;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);

  // Verify
  const { count } = await supabase
    .from('congress_trades')
    .select('*', { count: 'exact', head: true });
  console.log(`Total trades in Supabase: ${count}`);
}

main().catch(console.error);
