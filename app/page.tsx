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
    fetch('/api/congress-trades?limit=4')
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
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.2' }}>
            Follow the smart money.<br />
            <span style={{ color: '#60a5fa' }}>See what they&apos;re buying.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#888', marginBottom: '24px' }}>
            Track politician stock trades and crypto whale wallets — all in one place, free.
          </p>
        </div>

        {/* Quick Links — 3 cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <Link href="/congress" style={{
            background: '#111118',
            border: '1px solid #222',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>🏛️ Politicians</div>
            <div style={{ color: '#888', fontSize: '14px' }}>125 members of Congress tracked. See their stock trades as filings drop.</div>
          </Link>

          <Link href="/whales" style={{
            background: '#111118',
            border: '1px solid #222',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>🐋 Crypto</div>
            <div style={{ color: '#888', fontSize: '14px' }}>157 whale wallets monitored on Solana. On-chain swaps and transfers.</div>
          </Link>
          
          <Link href="/leaderboard" style={{
            background: '#111118',
            border: '1px solid #222',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>📊 Leaderboard</div>
            <div style={{ color: '#888', fontSize: '14px' }}>Who&apos;s beating the market? Ranked by actual returns.</div>
          </Link>
        </div>

        {/* Follow & Track Value Prop */}
        <div style={{
          background: 'linear-gradient(135deg, #0f1a12 0%, #111118 100%)',
          border: '1px solid #1a3a1a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
        }}>
          <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>
            Build your watchlist
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            <div>
              <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>👤 Follow politicians</div>
              <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
                Get notified when specific politicians file new trades. See their full history and performance.
              </div>
            </div>
            <div>
              <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>💰 Track wallets</div>
              <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
                Follow whale wallets on Solana. See every swap, transfer, and position change.
              </div>
            </div>
            <div>
              <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>🔔 Get alerts</div>
              <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
                Pro members get Telegram and Discord alerts when their followed wallets or politicians make moves.
              </div>
            </div>
          </div>
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
                🏛️ Latest Politician Trades
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

            {/* Upgrade CTA */}
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
                  ⚡ Free users see filings 24h delayed
                </div>
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                  Pro members see new filings the moment they drop — plus Telegram &amp; Discord alerts.
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

        {/* Crypto Whale CTA — links to filtered /whales page */}
        <div style={{
          background: '#111118',
          border: '1px solid #222',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '40px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '24px', color: '#fff', marginBottom: '12px' }}>
            🐋 Crypto Whale Activity
          </h2>
          <p style={{ color: '#888', fontSize: '15px', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
            157 whale wallets tracked on Solana. See filtered swaps and transfers — no bots, no dust.
          </p>
          <Link href="/whales" style={{
            display: 'inline-block',
            background: '#1e3a5f',
            color: '#60a5fa',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            textDecoration: 'none',
          }}>
            View Whale Trades →
          </Link>
        </div>

        {/* Email Capture */}
        <div style={{ marginBottom: '32px' }}>
          <EmailCapture 
            source="homepage"
            headline="Get free weekly trade alerts"
            subtext="Politician stock trades + crypto whale moves delivered to your inbox. No spam, no account needed."
            buttonText="Subscribe Free"
          />
        </div>

        {/* Bottom CTA */}
        <div style={{
          background: '#111118',
          border: '1px solid #222',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '600' }}>
            Want faster alerts?
          </h3>
          <p style={{ color: '#666', marginBottom: '24px', fontSize: '16px' }}>
            Pro members get Telegram &amp; Discord alerts the moment new filings and whale trades hit. No 24h delay.
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
