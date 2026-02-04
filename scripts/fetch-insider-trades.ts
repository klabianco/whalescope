/**
 * WhaleScope - SEC Form 4 Insider Trade Fetcher
 * 
 * Fetches corporate insider trades from SEC EDGAR.
 * Focuses on open market purchases (P) and sales (S) by officers/directors.
 * Filters out planned 10b5-1 trades and option exercises.
 * 
 * Usage: npx tsx scripts/fetch-insider-trades.ts [--days 1] [--min-value 10000] [--store]
 * 
 * SEC EDGAR requires:
 * - User-Agent header with contact info
 * - Max 10 requests/second
 */

import { createClient } from '@supabase/supabase-js';

const USER_AGENT = 'WhaleScope/1.0 wrentheai@proton.me';
const EDGAR_SEARCH = 'https://efts.sec.gov/LATEST/search-index';
const EDGAR_ARCHIVES = 'https://www.sec.gov/Archives/edgar/data';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mamjtxguzewxslbattal.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Transaction codes we care about
const INTERESTING_CODES: Record<string, string> = {
  'P': 'Purchase',    // Open market buy - MOST INTERESTING
  'S': 'Sale',        // Open market sell - INTERESTING
};

// Codes we skip
const SKIP_CODES = new Set(['M', 'A', 'F', 'G', 'C', 'W', 'J', 'K', 'U']);
// M=option exercise, A=grant, F=tax withhold, G=gift, C=conversion, W=expiration

interface InsiderTrade {
  filing_date: string;
  transaction_date: string;
  ticker: string;
  company: string;
  company_cik: string;
  insider_name: string;
  insider_title: string;
  insider_cik: string;
  is_director: boolean;
  is_officer: boolean;
  is_ten_percent_owner: boolean;
  transaction_type: string;  // P or S
  transaction_label: string; // Purchase or Sale
  shares: number;
  price_per_share: number;
  usd_value: number;
  shares_after: number;
  is_10b5_1: boolean;       // Planned trade (less interesting)
  accession: string;
  filing_url: string;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>\\s*<value>([^<]*)</value>`, 's'));
  if (match) return match[1].trim();
  const simple = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return simple ? simple[1].trim() : '';
}

function extractBool(xml: string, tag: string): boolean {
  const val = extractText(xml, tag);
  return val === '1' || val === 'true';
}

function parseTransactions(xml: string): InsiderTrade[] {
  const trades: InsiderTrade[] = [];

  // Extract issuer info
  const issuerBlock = xml.match(/<issuer>(.*?)<\/issuer>/s)?.[1] || '';
  const ticker = extractText(issuerBlock, 'issuerTradingSymbol');
  const company = extractText(issuerBlock, 'issuerName');
  const companyCik = extractText(issuerBlock, 'issuerCik');

  // Extract filing info
  const filingDate = extractText(xml, 'periodOfReport');
  const is10b51 = extractBool(xml, 'aff10b5One');

  // Extract owner info
  const ownerBlock = xml.match(/<reportingOwner>(.*?)<\/reportingOwner>/s)?.[1] || '';
  const ownerIdBlock = ownerBlock.match(/<reportingOwnerId>(.*?)<\/reportingOwnerId>/s)?.[1] || '';
  const insiderName = extractText(ownerIdBlock, 'rptOwnerName');
  const insiderCik = extractText(ownerIdBlock, 'rptOwnerCik');

  const relBlock = ownerBlock.match(/<reportingOwnerRelationship>(.*?)<\/reportingOwnerRelationship>/s)?.[1] || '';
  const isDirector = extractBool(relBlock, 'isDirector');
  const isOfficer = extractBool(relBlock, 'isOfficer');
  const isTenPercent = extractBool(relBlock, 'isTenPercentOwner');
  const officerTitle = extractText(relBlock, 'officerTitle');

  // Extract accession from document
  // Parse non-derivative transactions
  const txnMatches = xml.matchAll(/<nonDerivativeTransaction>(.*?)<\/nonDerivativeTransaction>/gs);

  for (const match of txnMatches) {
    const txn = match[1];

    const codingBlock = txn.match(/<transactionCoding>(.*?)<\/transactionCoding>/s)?.[1] || '';
    const txnCode = extractText(codingBlock, 'transactionCode');

    // Skip uninteresting transaction types
    if (!INTERESTING_CODES[txnCode]) continue;

    const amountsBlock = txn.match(/<transactionAmounts>(.*?)<\/transactionAmounts>/s)?.[1] || '';
    const shares = parseFloat(extractText(amountsBlock, 'transactionShares')) || 0;
    const price = parseFloat(extractText(amountsBlock, 'transactionPricePerShare')) || 0;
    const acquiredDisposed = extractText(amountsBlock, 'transactionAcquiredDisposedCode');
    const txnDate = extractText(txn, 'transactionDate');

    const postBlock = txn.match(/<postTransactionAmounts>(.*?)<\/postTransactionAmounts>/s)?.[1] || '';
    const sharesAfter = parseFloat(extractText(postBlock, 'sharesOwnedFollowingTransaction')) || 0;

    if (shares === 0 || price === 0) continue;

    trades.push({
      filing_date: filingDate,
      transaction_date: txnDate || filingDate,
      ticker,
      company,
      company_cik: companyCik,
      insider_name: insiderName,
      insider_title: officerTitle || (isDirector ? 'Director' : isTenPercent ? '10% Owner' : 'Insider'),
      insider_cik: insiderCik,
      is_director: isDirector,
      is_officer: isOfficer,
      is_ten_percent_owner: isTenPercent,
      transaction_type: txnCode,
      transaction_label: INTERESTING_CODES[txnCode],
      shares,
      price_per_share: price,
      usd_value: Math.round(shares * price * 100) / 100,
      shares_after: sharesAfter,
      is_10b5_1: is10b51,
      accession: '',
      filing_url: '',
    });
  }

  return trades;
}

async function fetchFilingList(days: number): Promise<Array<{ cik: string; accession: string; filename: string; company: string; insider: string; fileDate: string }>> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  console.log(`Searching EDGAR for Form 4 filings from ${startDate} to ${endDate}...`);

  const url = `${EDGAR_SEARCH}?q=4&forms=4&dateRange=custom&startdt=${startDate}&enddt=${endDate}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();

  const hits = data.hits?.hits || [];
  console.log(`Found ${data.hits?.total?.value || 0} total filings (fetched ${hits.length})`);

  const filings = hits.map((h: any) => {
    const src = h._source;
    const accession = src.adsh;
    const fileId = h._id;
    const cik = src.ciks?.[0] || '';
    const filename = fileId.split(':')?.[1] || '';

    return {
      cik,
      accession,
      filename,
      company: src.display_names?.find((n: string) => n.includes('(Issuer)') || !n.includes('CIK'))?.replace(/\s*\(CIK.*/, '') || src.display_names?.[1]?.replace(/\s*\(CIK.*/, '') || '',
      insider: src.display_names?.[0]?.replace(/\s*\(CIK.*/, '') || '',
      fileDate: src.file_date,
    };
  });

  return filings;
}

async function fetchAndParseFiling(cik: string, accession: string, filename: string): Promise<InsiderTrade[]> {
  const accessionFormatted = accession.replace(/-/g, '');
  const url = `${EDGAR_ARCHIVES}/${cik.replace(/^0+/, '')}/${accessionFormatted}/${filename}`;

  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const trades = parseTransactions(xml);

    // Set accession and URL on each trade
    for (const t of trades) {
      t.accession = accession;
      t.filing_url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=4&dateb=&owner=include&count=10`;
    }

    return trades;
  } catch {
    return [];
  }
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

async function main() {
  const args = process.argv.slice(2);
  const days = parseInt(args.find((_, i, a) => a[i - 1] === '--days') || '1');
  const minValue = parseInt(args.find((_, i, a) => a[i - 1] === '--min-value') || '10000');
  const shouldStore = args.includes('--store');
  const limit = parseInt(args.find((_, i, a) => a[i - 1] === '--limit') || '100');

  const filings = await fetchFilingList(days);

  console.log(`\nFetching and parsing ${Math.min(filings.length, limit)} filings (limit: ${limit})...`);

  const allTrades: InsiderTrade[] = [];
  const toProcess = filings.slice(0, limit);

  for (let i = 0; i < toProcess.length; i++) {
    const f = toProcess[i];
    const trades = await fetchAndParseFiling(f.cik, f.accession, f.filename);
    allTrades.push(...trades);

    // Respect SEC rate limit: 10 req/sec
    if (i % 10 === 9) {
      process.stdout.write(`  ${i + 1}/${toProcess.length} processed (${allTrades.length} trades found)\r`);
      await sleep(1100);
    }
  }

  console.log(`\nTotal trades parsed: ${allTrades.length}`);

  // Filter by minimum value and sort
  const significant = allTrades
    .filter(t => t.usd_value >= minValue)
    .sort((a, b) => b.usd_value - a.usd_value);

  // Separate planned vs discretionary
  const discretionary = significant.filter(t => !t.is_10b5_1);
  const planned = significant.filter(t => t.is_10b5_1);

  console.log(`\nSignificant trades (>= ${formatUsd(minValue)}):`);
  console.log(`  Discretionary: ${discretionary.length} (THE INTERESTING ONES)`);
  console.log(`  Planned (10b5-1): ${planned.length}`);

  if (discretionary.length > 0) {
    console.log('\n=== DISCRETIONARY INSIDER TRADES (most interesting) ===\n');
    for (const t of discretionary.slice(0, 20)) {
      const emoji = t.transaction_type === 'P' ? '🟢 BUY' : '🔴 SELL';
      console.log(`${emoji}  ${t.ticker.padEnd(6)} ${formatUsd(t.usd_value).padEnd(10)} ${t.insider_name}`);
      console.log(`       ${t.insider_title} at ${t.company}`);
      console.log(`       ${t.shares.toLocaleString()} shares @ $${t.price_per_share.toFixed(2)} on ${t.transaction_date}`);
      console.log('');
    }
  }

  if (planned.length > 0) {
    console.log('\n=== PLANNED (10b5-1) TRADES ===\n');
    for (const t of planned.slice(0, 10)) {
      const emoji = t.transaction_type === 'P' ? '🟢 BUY' : '🔴 SELL';
      console.log(`${emoji}  ${t.ticker.padEnd(6)} ${formatUsd(t.usd_value).padEnd(10)} ${t.insider_name} (${t.insider_title})`);
    }
  }

  // Output summary
  const totalBuyValue = significant.filter(t => t.transaction_type === 'P').reduce((s, t) => s + t.usd_value, 0);
  const totalSellValue = significant.filter(t => t.transaction_type === 'S').reduce((s, t) => s + t.usd_value, 0);

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total insider buying: ${formatUsd(totalBuyValue)}`);
  console.log(`Total insider selling: ${formatUsd(totalSellValue)}`);
  console.log(`Buy/Sell ratio: ${totalBuyValue > 0 && totalSellValue > 0 ? (totalBuyValue / totalSellValue).toFixed(2) : 'N/A'}`);

  // Save results
  const fs = await import('fs');
  const path = await import('path');
  const outPath = path.join(process.cwd(), 'data', 'insider-trades.json');
  fs.writeFileSync(outPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    days,
    minValue,
    totalFilings: filings.length,
    totalTrades: allTrades.length,
    significantTrades: significant.length,
    discretionary: discretionary,
    planned: planned,
    summary: { totalBuyValue, totalSellValue },
  }, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main().catch(console.error);
