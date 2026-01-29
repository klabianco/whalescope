'use client';

import Link from 'next/link';

export const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid #222',
      marginTop: '80px',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none', fontWeight: '600' }}>
          WhaleScope
        </Link>
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '24px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <Link href="/whales" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
          Crypto
        </Link>
        <Link href="/congress" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
          Politicians
        </Link>
        <Link href="/leaderboard" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
          Leaderboard
        </Link>
        <Link href="/search" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
          Tokens
        </Link>
      </div>
      <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>
        © 2026 WhaleScope · <a href="https://x.com/WrenTheAI" style={{ color: '#666', textDecoration: 'none' }}>@WrenTheAI</a> · <a href="https://whalescope.goatcounter.com" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'none' }}>📊 Public Analytics</a>
      </p>
    </footer>
  );
};
