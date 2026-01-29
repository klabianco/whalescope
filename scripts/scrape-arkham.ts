// Arkham Intel Entity Data - Scraped from browser DOM
// This data powers WhaleScope's whale tracking
// Run: npx tsx scripts/scrape-arkham.ts

import { writeFileSync } from 'fs';

// Top whale entities to track - curated from Arkham Intel homepage
const WHALE_ENTITIES = [
  // Major Funds & Trading Firms
  { slug: 'jump-trading', name: 'Jump Crypto', type: 'fund' },
  { slug: 'wintermute', name: 'Wintermute', type: 'fund' },
  { slug: 'alameda-research', name: 'Alameda Research', type: 'fund' },
  { slug: 'three-arrows-capital', name: 'Three Arrows Capital', type: 'fund' },
  { slug: 'ark-invest', name: 'ARK Invest', type: 'fund' },
  { slug: 'abraxas-capital-heka-funds', name: 'Abraxas Capital', type: 'fund' },
  { slug: 'trend-research', name: 'Trend Research', type: 'fund' },
  
  // Institutions
  { slug: 'blackrock', name: 'BlackRock', type: 'institution' },
  { slug: 'grayscale', name: 'Grayscale', type: 'institution' },
  { slug: 'bitwise', name: 'Bitwise', type: 'institution' },
  { slug: 'purpose-investments', name: 'Purpose Investments', type: 'institution' },
  { slug: 'microstrategy', name: 'Strategy (MicroStrategy)', type: 'institution' },
  { slug: 'metaplanet-2', name: 'MetaPlanet', type: 'institution' },
  
  // Notable Individuals
  { slug: 'vitalik-buterin', name: 'Vitalik Buterin', type: 'individual' },
  { slug: 'arthur-hayes', name: 'Arthur Hayes', type: 'individual' },
  { slug: 'justin-sun', name: 'Justin Sun', type: 'individual' },
  { slug: 'kylesamani', name: 'Kyle Samani (Multicoin)', type: 'individual' },
  { slug: 'muststopmurad', name: 'Murad', type: 'individual' },
  { slug: 'donald-trump', name: 'Donald Trump', type: 'individual' },
  { slug: 'reid-hoffman', name: 'Reid Hoffman', type: 'individual' },
  
  // DeFi / Protocols
  { slug: 'worldlibertyfi', name: 'World Liberty Fi', type: 'protocol' },
  { slug: 'ethereum-foundation', name: 'Ethereum Foundation', type: 'protocol' },
  { slug: 'kamino-finance', name: 'Kamino Finance', type: 'protocol' },
  { slug: 'drift-protocol', name: 'Drift Protocol', type: 'protocol' },
  
  // Exchanges (for flow tracking)
  { slug: 'binance', name: 'Binance', type: 'exchange' },
  { slug: 'coinbase', name: 'Coinbase', type: 'exchange' },
  { slug: 'okx', name: 'OKX', type: 'exchange' },
  { slug: 'kraken', name: 'Kraken', type: 'exchange' },
  { slug: 'robinhood', name: 'Robinhood', type: 'exchange' },
  
  // Government
  { slug: 'usg', name: 'U.S. Government', type: 'government' },
  
  // Hackers/Exploiters (notable)
  { slug: 'ftx-exploiter', name: 'FTX Exploiter', type: 'hacker' },
  { slug: 'satoshi-nakamoto', name: 'Satoshi Nakamoto', type: 'individual' },
];

// This is the entity list for WhaleScope - the actual balance data
// will be scraped from Arkham Intel browser sessions
const output = {
  lastUpdated: new Date().toISOString(),
  source: 'Arkham Intel (intel.arkm.com)',
  entities: WHALE_ENTITIES,
  note: 'Balance data scraped from browser DOM. API access pending approval.',
};

writeFileSync(
  'data/arkham-entities.json',
  JSON.stringify(output, null, 2)
);

console.log(`✅ Saved ${WHALE_ENTITIES.length} whale entities to data/arkham-entities.json`);
