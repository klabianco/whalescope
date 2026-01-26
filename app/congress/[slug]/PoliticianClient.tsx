'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Trade {
  ticker: string;
  company: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

interface Politician {
  name: string;
  party: 'D' | 'R';
  chamber: 'House' | 'Senate';
  state: string;
  trades: Trade[];
  stats: {
    totalTrades: number;
    totalVolume: string;
    topHolding: string;
  };
}

// Sample data - will replace with real API
const POLITICIANS: Record<string, Politician> = {
  'nancy-pelosi': {
    name: 'Nancy Pelosi',
    party: 'D',
    chamber: 'House',
    state: 'CA-11',
    stats: {
      totalTrades: 47,
      totalVolume: '$12.5M',
      topHolding: 'NVDA'
    },
    trades: [
      { ticker: 'NVDA', company: 'NVIDIA Corp', type: 'Purchase', amount: '$1,000,001 - $5,000,000', filed: '2026-01-20', traded: '2026-01-15' },
      { ticker: 'AAPL', company: 'Apple Inc', type: 'Purchase', amount: '$500,001 - $1,000,000', filed: '2026-01-12', traded: '2026-01-05' },
      { ticker: 'GOOGL', company: 'Alphabet Inc', type: 'Purchase', amount: '$250,001 - $500,000', filed: '2025-12-20', traded: '2025-12-14' },
      { ticker: 'MSFT', company: 'Microsoft Corp', type: 'Sale', amount: '$100,001 - $250,000', filed: '2025-12-05', traded: '2025-11-28' },
      { ticker: 'TSLA', company: 'Tesla Inc', type: 'Purchase', amount: '$500,001 - $1,000,000', filed: '2025-11-15', traded: '2025-11-08' },
    ]
  },
  'tommy-tuberville': {
    name: 'Tommy Tuberville',
    party: 'R',
    chamber: 'Senate',
    state: 'AL',
    stats: {
      totalTrades: 132,
      totalVolume: '$8.2M',
      topHolding: 'Various'
    },
    trades: [
      { ticker: 'TSLA', company: 'Tesla Inc', type: 'Sale', amount: '$250,001 - $500,000', filed: '2026-01-18', traded: '2026-01-10' },
      { ticker: 'META', company: 'Meta Platforms', type: 'Purchase', amount: '$50,001 - $100,000', filed: '2026-01-10', traded: '2026-01-03' },
      { ticker: 'AMZN', company: 'Amazon.com', type: 'Purchase', amount: '$100,001 - $250,000', filed: '2025-12-28', traded: '2025-12-20' },
    ]
  },
  'dan-crenshaw': {
    name: 'Dan Crenshaw',
    party: 'R',
    chamber: 'House',
    state: 'TX-2',
    stats: {
      totalTrades: 28,
      totalVolume: '$3.1M',
      topHolding: 'MSFT'
    },
    trades: [
      { ticker: 'MSFT', company: 'Microsoft Corp', type: 'Purchase', amount: '$15,001 - $50,000', filed: '2026-01-15', traded: '2026-01-08' },
      { ticker: 'AAPL', company: 'Apple Inc', type: 'Purchase', amount: '$15,001 - $50,000', filed: '2025-12-20', traded: '2025-12-12' },
    ]
  }
};

export default function PoliticianClient({ slug }: { slug: string }) {
  const [following, setFollowing] = useState(false);
  
  const politician = POLITICIANS[slug];

  useEffect(() => {
    const saved = localStorage.getItem('followedPoliticians');
    const list = saved ? JSON.parse(saved) : [];
    setFollowing(list.includes(slug));
  }, [slug]);

  function toggleFollow() {
    const saved = localStorage.getItem('followedPoliticians');
    const list = saved ? JSON.parse(saved) : [];
    const newList = following
      ? list.filter((s: string) => s !== slug)
      : [...list, slug];
    localStorage.setItem('followedPoliticians', JSON.stringify(newList));
    setFollowing(!following);
  }

  if (!politician) {
    return (
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <Link href="/congress" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          ← Back to Congress Tracker
        </Link>
        <div style={{ marginTop: '40px', color: '#888' }}>
          Politician not found. Data coming soon.
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/congress" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Congress Tracker
        </Link>
      </div>

      {/* Politician Info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '40px' 
      }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
            {politician.name}
          </h1>
          <p style={{ color: '#888' }}>
            <span style={{ 
              color: politician.party === 'D' ? '#60a5fa' : '#f87171',
              fontWeight: '600'
            }}>
              {politician.party === 'D' ? 'Democrat' : 'Republican'}
            </span>
            {' · '}
            {politician.chamber}
            {' · '}
            {politician.state}
          </p>
        </div>
        <button
          onClick={toggleFollow}
          style={{
            padding: '12px 24px',
            background: following ? '#4ade80' : '#333',
            color: following ? '#000' : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {following ? '✓ Following' : '+ Follow'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px',
        marginBottom: '40px'
      }}>
        <div style={{ background: '#111118', padding: '20px', borderRadius: '12px' }}>
          <div style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>Total Trades</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: '600' }}>{politician.stats.totalTrades}</div>
        </div>
        <div style={{ background: '#111118', padding: '20px', borderRadius: '12px' }}>
          <div style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>Volume (2024)</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: '600' }}>{politician.stats.totalVolume}</div>
        </div>
        <div style={{ background: '#111118', padding: '20px', borderRadius: '12px' }}>
          <div style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>Top Holding</div>
          <div style={{ color: '#4ade80', fontSize: '24px', fontWeight: '600' }}>{politician.stats.topHolding}</div>
        </div>
      </div>

      {/* Trades */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#fff' }}>
        Recent Trades
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {politician.trades.map((trade, i) => (
          <div key={i} style={{
            background: '#111118',
            border: '1px solid #222',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: trade.type === 'Purchase' ? '#064e3b' : '#7f1d1d',
                color: trade.type === 'Purchase' ? '#4ade80' : '#f87171',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {trade.type === 'Purchase' ? 'BUY' : 'SELL'}
              </span>
              <div>
                <span style={{ color: '#4ade80', fontWeight: '600' }}>{trade.ticker}</span>
                <span style={{ color: '#888', marginLeft: '8px' }}>{trade.company}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff' }}>{trade.amount}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>Filed {trade.filed}</div>
            </div>
          </div>
        ))}
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
  );
}
