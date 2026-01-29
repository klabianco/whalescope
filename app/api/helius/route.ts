/**
 * Helius API Proxy
 * 
 * Proxies requests to Helius API so the API key stays server-side.
 * Supports: wallet transactions, token metadata, token holders (RPC)
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC_KEY = process.env.HELIUS_RPC_KEY || '';

// Rate limiting (basic in-memory, resets on deploy)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute per IP
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

  if (!HELIUS_API_KEY) {
    return NextResponse.json({ error: 'Helius not configured' }, { status: 500 });
  }

  try {
    switch (action) {
      case 'wallet-txns': {
        const address = searchParams.get('address');
        if (!address || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
          return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
        
        const res = await fetch(
          `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`
        );
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'token-metadata': {
        const mint = searchParams.get('mint');
        if (!mint) return NextResponse.json({ error: 'Missing mint' }, { status: 400 });
        
        const res = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mintAccounts: [mint] }),
        });
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'token-txns': {
        const mintAddress = searchParams.get('mint');
        if (!mintAddress) return NextResponse.json({ error: 'Missing mint' }, { status: 400 });
        
        const res = await fetch(
          `https://api.helius.xyz/v0/addresses/${mintAddress}/transactions?api-key=${HELIUS_API_KEY}&type=SWAP`
        );
        const data = await res.json();
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Helius proxy error:', error);
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 502 });
  }
}

// RPC proxy for things like getTokenLargestAccounts
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  if (!HELIUS_RPC_KEY) {
    return NextResponse.json({ error: 'Helius RPC not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    // Only allow specific RPC methods
    const allowedMethods = ['getTokenLargestAccounts', 'getBalance', 'getTokenAccountsByOwner'];
    if (!allowedMethods.includes(body.method)) {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 403 });
    }

    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_RPC_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Helius RPC proxy error:', error);
    return NextResponse.json({ error: 'RPC request failed' }, { status: 502 });
  }
}
