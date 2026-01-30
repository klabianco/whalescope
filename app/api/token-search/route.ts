/**
 * Token Search API
 * 
 * Resolves ticker symbols to Solana token mint addresses using DexScreener.
 * GET /api/token-search?q=BONK
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface TokenResult {
  symbol: string;
  name: string;
  mint: string;
  price: string;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  imageUrl?: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  
  if (!query || query.length < 1) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
  }

  // If it looks like a mint address, just redirect info
  if (query.length >= 32 && query.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(query)) {
    return NextResponse.json({
      results: [{ symbol: '—', name: 'Direct Address', mint: query, price: '', priceChange24h: 0, volume24h: 0, liquidity: 0 }],
      type: 'address',
    });
  }

  try {
    // Use DexScreener search API — covers all Solana tokens including memecoins
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Search service unavailable' }, { status: 502 });
    }

    const data = await res.json();
    const pairs = data.pairs || [];

    // Filter to Solana tokens only, deduplicate by mint address
    const seen = new Set<string>();
    const results: TokenResult[] = [];

    for (const pair of pairs) {
      if (pair.chainId !== 'solana') continue;
      
      const bt = pair.baseToken;
      if (!bt?.address || seen.has(bt.address)) continue;
      seen.add(bt.address);

      results.push({
        symbol: bt.symbol || '?',
        name: bt.name || '',
        mint: bt.address,
        price: pair.priceUsd || '0',
        priceChange24h: pair.priceChange?.h24 ?? 0,
        volume24h: pair.volume?.h24 ?? 0,
        liquidity: pair.liquidity?.usd ?? 0,
      });

      // Cap at 10 results
      if (results.length >= 10) break;
    }

    // Sort by liquidity (most liquid first = most relevant)
    results.sort((a, b) => b.liquidity - a.liquidity);

    return NextResponse.json({ results, type: 'search' });
  } catch (error: any) {
    console.error('Token search error:', error?.message || error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
