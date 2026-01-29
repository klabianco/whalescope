'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Header: FC = () => {
  const { publicKey } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/whales', label: 'Crypto' },
    { href: '/congress', label: 'Politicians' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/search', label: 'Search' },
    { href: '/firehose', label: '🔥 Firehose' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/watchlist', label: 'Watchlist' },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .ws-nav-desktop { display: none !important; }
          .ws-nav-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .ws-nav-desktop { display: flex !important; }
          .ws-nav-hamburger { display: none !important; }
          .ws-nav-mobile { display: none !important; }
        }
      `}</style>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #222',
        marginBottom: '24px',
        position: 'relative',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
            🐋 WhaleScope
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ws-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
              {link.label}
            </Link>
          ))}
          <WalletMultiButton style={{
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            height: '40px'
          }} />
        </nav>

        {/* Mobile hamburger button */}
        <button
          className="ws-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '24px',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            padding: 0,
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav
          className="ws-nav-mobile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#111118',
            borderBottom: '1px solid #222',
            padding: '8px 24px 16px',
            gap: '4px',
          }}
        >
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: '#ccc',
                textDecoration: 'none',
                fontSize: '16px',
                padding: '12px 0',
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ paddingTop: '12px' }}>
            <WalletMultiButton style={{
              backgroundColor: '#fff',
              color: '#000',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              height: '40px',
              width: '100%',
            }} />
          </div>
        </nav>
      )}
    </>
  );
};
