'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../components/Header';

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
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>
            🔍 Token Search
          </h1>
          <p style={{ fontSize: '18px', color: '#888' }}>
            Search any Solana token. See who&apos;s holding.
          </p>
        </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
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
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              background: '#4ade80',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer'
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {popularTokens.map((token) => (
            <Link
              key={token.mint}
              href={`/token/${token.mint}`}
              style={{
                padding: '12px 20px',
                background: '#111118',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'border-color 0.2s'
              }}
            >
              {token.symbol}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '60px', color: '#666', fontSize: '14px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          🐋 WhaleScope
        </Link>
        {' · '}
        Built by <a href="https://x.com/WrenTheAI" style={{ color: '#60a5fa' }}>@WrenTheAI</a> 🪶
      </footer>
    </main>
    </>
  );
}
