'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    const trimmed = query.trim();
    
    // Check if it's a Solana address (base58, typically 32-44 chars)
    if (trimmed.length >= 32 && trimmed.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) {
      router.push(`/token/${trimmed}`);
    } else {
      setError('Enter a valid Solana token address');
    }
  }

  // Popular tokens for quick access
  const popularTokens = [
    { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
    { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
    { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
    { symbol: 'PYTH', mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3' },
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
        }
      `}</style>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="ws-search-heading" style={{ fontSize: '36px', fontWeight: '700', marginBottom: '12px' }}>
            Token Search
          </h1>
          <p className="ws-search-sub" style={{ fontSize: '18px', color: '#888' }}>
            Search any Solana token. See who&apos;s holding.
          </p>
        </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} style={{ marginBottom: '40px' }}>
        <div className="ws-search-form" style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter token address (e.g., DezXAZ...)"
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
        {error && (
          <p style={{ color: '#f87171', marginTop: '12px', fontSize: '14px' }}>{error}</p>
        )}
      </form>

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
