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

interface WhaleTrade {
  wallet: string;
  walletLabel: string;
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenMint?: string;
  tokenAmount?: number;
  action: "BUY" | "SELL" | "UNKNOWN";
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Home() {
  const [trades, setTrades] = useState<WhaleTrade[]>([]);
  const [congressTrades, setCongressTrades] = useState<CongressTrade[]>([]);

  useEffect(() => {
    fetch('/whale-trades.json')
      .then(res => res.ok ? res.json() : [])
      .then(setTrades)
      .catch(() => setTrades([]));
    fetch('/api/congress-trades?limit=4')
      .then(res => res.ok ? res.json() : [])
      .then((data: any) => {
        // API returns { trades: [...] } or array
        const trades = Array.isArray(data) ? data : (data.trades || []);
        setCongressTrades(trades);
      })
      .catch(() => setCongressTrades([]));
  }, []);
  
  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px' }}>
            🐋 WhaleScope
          </h1>
          <p style={{ fontSize: '20px', color: '#888', marginBottom: '24px' }}>
            Track smart money — crypto whales & Congress trades
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <Link href="/whales" style={{
            background: '#111118',
            border: '1px solid #222',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>Smart Money</div>
            <div style={{ color: '#888', fontSize: '14px' }}>Track crypto whales & Congress trades</div>
          </Link>
          
          <Link href="/search" style={{
            background: '#111118',
            border: '1px solid #222',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>Token Search</div>
            <div style={{ color: '#888', fontSize: '14px' }}>Find top holders for any token</div>
          </Link>
        </div>

        {/* Congress Trades Preview */}
        {congressTrades.length > 0 && (
          <>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '24px', color: '#fff' }}>
                🏛️ Latest Congress Trades
              </h2>
              <Link href="/congress" style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
              marginBottom: '32px'
            }}>
              {congressTrades.slice(0, 4).map((trade, i) => (
                <Link key={i} href={`/congress/${trade.politician.toLowerCase().replace(/ /g, '-')}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#111118',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>
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
                    <div style={{ color: '#ccc', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      {trade.ticker}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                      <span>{trade.amount}</span>
                      <span>{trade.party === 'D' ? '🔵' : trade.party === 'R' ? '🔴' : '⚪'} {trade.chamber}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>
                      Traded {trade.traded} · Filed {trade.filed}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Urgency CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid #1e3a5f',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  ⚡ Pro members got these alerts instantly
                </div>
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                  Don&apos;t miss the next big move. Get real-time alerts.
                </div>
              </div>
              <Link href="/pricing" style={{
                background: '#fbbf24',
                color: '#000',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>
                Get Alerts →
              </Link>
            </div>
          </>
        )}

        {/* Live Feed Header */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '24px', color: '#fff' }}>
            Recent Whale Trades
          </h2>
          <div style={{ 
            background: '#111118',
            border: '1px solid #222',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></span>
            <span style={{ color: '#888', fontSize: '14px' }}>
              Live · Tracking 20 wallets
            </span>
          </div>
        </div>

        {/* Trade Feed */}
        <div style={{ marginBottom: '40px' }}>
          {trades.length === 0 ? (
            <div style={{ 
              background: '#111118', 
              padding: '40px', 
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666'
            }}>
              No trades yet. Checking wallets...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trades.slice(0, 10).map((trade, i) => (
                <div key={i} style={{
                  background: '#111118',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  padding: '20px',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <span style={{
                        background: trade.action === 'BUY' ? '#064e3b' : 
                                   trade.action === 'SELL' ? '#7f1d1d' : '#374151',
                        color: trade.action === 'BUY' ? '#4ade80' : 
                               trade.action === 'SELL' ? '#f87171' : '#9ca3af',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '12px'
                      }}>
                        {trade.action}
                      </span>
                      <Link 
                        href={`/wallet/${trade.wallet}`}
                        style={{ fontWeight: '600', color: '#fff', textDecoration: 'none' }}
                      >
                        {trade.walletLabel} →
                      </Link>
                    </div>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {timeAgo(trade.timestamp)}
                    </span>
                  </div>
                  
                  <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5' }}>
                    {trade.description}
                  </p>
                  
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                    <a 
                      href={`https://solscan.io/tx/${trade.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', textDecoration: 'none' }}
                    >
                      View on Solscan →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Capture */}
        <div style={{ marginBottom: '32px' }}>
          <EmailCapture 
            source="homepage"
            headline="Get free weekly trade alerts"
            subtext="Congress trades + whale moves delivered to your inbox. No spam, no account needed."
            buttonText="Subscribe Free"
          />
        </div>

        {/* CTA */}
        <div style={{
          background: '#111118',
          border: '1px solid #222',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '600' }}>
            Want real-time alerts?
          </h3>
          <p style={{ color: '#666', marginBottom: '24px', fontSize: '16px' }}>
            Get instant Telegram & Discord alerts when Congress trades. From $24/month.
          </p>
          <Link href="/pricing" style={{
            display: 'inline-block',
            background: '#fff',
            color: '#000',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            View Pricing
          </Link>
        </div>

      </main>
      <Footer />
    </>
  );
}
