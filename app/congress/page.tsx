'use client';

import { useState } from 'react';
import Link from 'next/link';

// Sample congressional trades data (will replace with real API)
const SAMPLE_TRADES = [
  {
    politician: "Nancy Pelosi",
    party: "D",
    chamber: "House",
    ticker: "NVDA",
    company: "NVIDIA Corp",
    type: "Purchase",
    amount: "$1,000,001 - $5,000,000",
    filed: "2026-01-20",
    traded: "2026-01-15"
  },
  {
    politician: "Tommy Tuberville", 
    party: "R",
    chamber: "Senate",
    ticker: "TSLA",
    company: "Tesla Inc",
    type: "Sale",
    amount: "$250,001 - $500,000",
    filed: "2026-01-18",
    traded: "2026-01-10"
  },
  {
    politician: "Dan Crenshaw",
    party: "R", 
    chamber: "House",
    ticker: "MSFT",
    company: "Microsoft Corp",
    type: "Purchase",
    amount: "$15,001 - $50,000",
    filed: "2026-01-15",
    traded: "2026-01-08"
  },
  {
    politician: "Nancy Pelosi",
    party: "D",
    chamber: "House", 
    ticker: "AAPL",
    company: "Apple Inc",
    type: "Purchase",
    amount: "$500,001 - $1,000,000",
    filed: "2026-01-12",
    traded: "2026-01-05"
  },
  {
    politician: "Josh Gottheimer",
    party: "D",
    chamber: "House",
    ticker: "GOOGL",
    company: "Alphabet Inc",
    type: "Purchase", 
    amount: "$100,001 - $250,000",
    filed: "2026-01-10",
    traded: "2026-01-03"
  },
  {
    politician: "Mark Green",
    party: "R",
    chamber: "House",
    ticker: "AMD",
    company: "Advanced Micro Devices",
    type: "Purchase",
    amount: "$15,001 - $50,000",
    filed: "2026-01-08",
    traded: "2025-12-28"
  }
];

const TOP_TRADERS = [
  { name: "Nancy Pelosi", party: "D", trades: 47, volume: "$12.5M" },
  { name: "Tommy Tuberville", party: "R", trades: 132, volume: "$8.2M" },
  { name: "Dan Crenshaw", party: "R", trades: 28, volume: "$3.1M" },
  { name: "Josh Gottheimer", party: "D", trades: 24, volume: "$2.8M" },
  { name: "Mark Green", party: "R", trades: 19, volume: "$1.9M" },
];

export default function CongressPage() {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  
  const filteredTrades = SAMPLE_TRADES.filter(t => {
    if (filter === 'buy') return t.type === 'Purchase';
    if (filter === 'sell') return t.type === 'Sale';
    return true;
  });

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to WhaleScope
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
          🏛️ Congress Tracker
        </h1>
        <p style={{ color: '#888' }}>
          See what politicians are buying and selling
        </p>
      </div>

      {/* Top Traders */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#fff' }}>
          Top Traders (2024)
        </h2>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {TOP_TRADERS.map((trader) => (
            <Link 
              key={trader.name}
              href={`/congress/${encodeURIComponent(trader.name.toLowerCase().replace(' ', '-'))}`}
              style={{
                background: '#111118',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '16px 20px',
                minWidth: '160px',
                textDecoration: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>{trader.name}</span>
                <span style={{ 
                  color: trader.party === 'D' ? '#60a5fa' : '#f87171',
                  fontSize: '12px'
                }}>
                  ({trader.party})
                </span>
              </div>
              <div style={{ color: '#888', fontSize: '13px' }}>
                {trader.trades} trades · {trader.volume}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px'
      }}>
        {(['all', 'buy', 'sell'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              background: filter === f ? '#4ade80' : '#222',
              color: filter === f ? '#000' : '#888',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {f === 'all' ? 'All Trades' : f === 'buy' ? '🟢 Buys' : '🔴 Sells'}
          </button>
        ))}
      </div>

      {/* Trades Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredTrades.map((trade, i) => (
          <div key={i} style={{
            background: '#111118',
            border: '1px solid #222',
            borderRadius: '12px',
            padding: '16px 20px',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
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
                  <span style={{ color: '#fff', fontWeight: '600' }}>{trade.politician}</span>
                  <span style={{ 
                    color: trade.party === 'D' ? '#60a5fa' : '#f87171',
                    fontSize: '12px',
                    marginLeft: '8px'
                  }}>
                    ({trade.party}) · {trade.chamber}
                  </span>
                </div>
              </div>
              <span style={{ color: '#666', fontSize: '13px' }}>
                Filed {trade.filed}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '18px' }}>
                  {trade.ticker}
                </span>
                <span style={{ color: '#888', marginLeft: '8px' }}>
                  {trade.company}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontWeight: '500' }}>
                  {trade.amount}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  Traded {trade.traded}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Notice */}
      <div style={{
        background: '#1a1a2e',
        padding: '16px 20px',
        borderRadius: '12px',
        marginTop: '40px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#888', fontSize: '13px' }}>
          📊 Data from STOCK Act disclosures. Politicians must report trades within 45 days.
          <br />
          <span style={{ color: '#666' }}>Sample data shown — live feed coming soon.</span>
        </p>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#666', fontSize: '14px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          🐋 WhaleScope
        </Link>
        {' · '}
        Built by <a href="https://x.com/WrenTheAI" style={{ color: '#60a5fa' }}>@WrenTheAI</a> 🪶
      </footer>
    </main>
  );
}
