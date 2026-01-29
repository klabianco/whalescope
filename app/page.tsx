'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EmailCapture } from './components/EmailCapture';

interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

export default function Home() {
  const [congressTrades, setCongressTrades] = useState<CongressTrade[]>([]);

  useEffect(() => {
    fetch('/api/congress-trades?limit=6')
      .then(res => res.ok ? res.json() : [])
      .then((data: any) => {
        const trades = Array.isArray(data) ? data : (data.trades || []);
        setCongressTrades(trades);
      })
      .catch(() => setCongressTrades([]));
  }, []);
  
  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {/* Hero — tight, action-oriented */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '12px', lineHeight: '1.2' }}>
            See what smart money is buying.
          </h1>
          <p style={{ fontSize: '17px', color: '#888', marginBottom: '24px' }}>
            125 politicians · 157 whale wallets · updated daily
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/congress" style={{
              background: '#fff',
              color: '#000',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              🏛️ Politician Trades
            </Link>
            <Link href="/whales" style={{
              background: '#111118',
              color: '#fff',
              border: '1px solid #333',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              🐋 Crypto Whales
            </Link>
          </div>
        </div>

        {/* Latest trades — the data IS the homepage */}
        {congressTrades.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{ fontSize: '20px', color: '#fff', margin: 0 }}>
                Latest filings
              </h2>
              <Link href="/congress" style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}>
                View all 125 →
              </Link>
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px',
            }}>
              {congressTrades.slice(0, 6).map((trade, i) => (
                <Link key={i} href={`/congress/${trade.politician.toLowerCase().replace(/ /g, '-')}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                        {trade.politician}
                      </span>
                      <span style={{
                        background: trade.type === 'Purchase' ? '#064e3b' : '#7f1d1d',
                        color: trade.type === 'Purchase' ? '#4ade80' : '#f87171',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {trade.type === 'Purchase' ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: '#ccc', fontSize: '15px', fontWeight: '600' }}>{trade.ticker}</span>
                      <span style={{ color: '#555', fontSize: '12px' }}>{trade.amount}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                      Filed {trade.filed} · {trade.party === 'D' ? '🔵' : trade.party === 'R' ? '🔴' : '⚪'} {trade.chamber}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Single CTA */}
        <EmailCapture 
          source="homepage"
          headline="Get free weekly alerts"
          subtext="Top politician trades + crypto whale moves. No spam."
          buttonText="Subscribe Free"
          compact={false}
        />

      </main>
      <Footer />
    </>
  );
}
