'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface TokenResult {
  symbol: string;
  name: string;
  mint: string;
  price: string;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
}

function formatPrice(price: string): string {
  const n = parseFloat(price);
  if (!n) return '$0';
  if (n >= 1) return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 0.01) return '$' + n.toFixed(4);
  if (n >= 0.0001) return '$' + n.toFixed(6);
  return '$' + n.toExponential(2);
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K';
  return '$' + v.toFixed(0);
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 1) {
      setResults([]);
      setSearched(false);
      return;
    }

    // If it's clearly a mint address, go directly
    if (trimmed.length >= 32 && trimmed.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/token-search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
      setSearching(false);
      setSearched(true);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Direct mint address → go to token page
    if (trimmed.length >= 32 && trimmed.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) {
      router.push(`/token/${trimmed}`);
      return;
    }

    // If we have search results, go to the first one
    if (results.length > 0) {
      router.push(`/token/${results[0].mint}`);
    }
  }

  // Popular tokens for quick access
  const popularTokens = [
    { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
    { symbol: 'TRUMP', mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN' },
    { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
    { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
    { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
    { symbol: 'PENGU', mint: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv' },
    { symbol: 'RAY', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
  ];

  return (
    <>
      <Header />
      <style>{`
        @media (max-width: 640px) {
          .ws-search-form { flex-direction: column !important; }
          .ws-search-btn { width: 100% !important; }
          .ws-search-heading { font-size: 28px !important; }
          .ws-search-sub { font-size: 16px !important; }
          .ws-popular-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; }
          .ws-popular-link { text-align: center !important; padding: 14px 12px !important; }
          .ws-result-row { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
          .ws-result-right { margin-left: 0 !important; }
        }
      `}</style>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="ws-search-heading" style={{ fontSize: '36px', fontWeight: '700', marginBottom: '12px' }}>
            Token Search
          </h1>
          <p className="ws-search-sub" style={{ fontSize: '18px', color: '#888' }}>
            Search any Solana token by name, ticker, or mint address.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
          <div className="ws-search-form" style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ticker (BONK) or paste a mint address..."
              style={{
                flex: 1,
                padding: '16px 20px',
                fontSize: '16px',
                background: '#111118',
                border: '1px solid #333',
                borderRadius: '12px',
                color: '#fff',
                outline: 'none',
                minWidth: 0,
              }}
            />
            <button
              className="ws-search-btn"
              type="submit"
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searching && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            Searching...
          </div>
        )}

        {!searching && results.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '16px', color: '#888', marginBottom: '12px' }}>
              Results
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((token) => (
                <Link
                  key={token.mint}
                  href={`/token/${token.mint}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="ws-result-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: '#111118',
                      border: '1px solid #222',
                      borderRadius: '10px',
                      transition: 'border-color 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#444')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>
                        {token.symbol}
                      </span>
                      <span style={{ color: '#888', fontSize: '14px' }}>
                        {token.name}
                      </span>
                    </div>
                    <div className="ws-result-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                        {formatPrice(token.price)}
                      </span>
                      {token.priceChange24h !== 0 && (
                        <span style={{
                          color: token.priceChange24h > 0 ? '#4ade80' : '#f87171',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}>
                          {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                        </span>
                      )}
                      {token.volume24h > 0 && (
                        <span style={{ color: '#888', fontSize: '13px' }}>
                          Vol {formatVolume(token.volume24h)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!searching && searched && results.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#888',
            marginBottom: '40px',
          }}>
            No tokens found for &quot;{query}&quot;. Try a different name or paste a mint address.
          </div>
        )}

        {/* Popular Tokens */}
        <div>
          <h2 style={{ fontSize: '18px', color: '#888', marginBottom: '16px' }}>
            Popular Tokens
          </h2>
          <div className="ws-popular-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {popularTokens.map((token) => (
              <Link
                key={token.mint}
                href={`/token/${token.mint}`}
                className="ws-popular-link"
                style={{
                  padding: '14px 24px',
                  background: '#111118',
                  border: '1px solid #333',
                  borderRadius: '10px',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '15px',
                  transition: 'border-color 0.2s',
                }}
              >
                {token.symbol}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
