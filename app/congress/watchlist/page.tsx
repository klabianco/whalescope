'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Trade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  traded: string;
}

interface FollowedPolitician {
  slug: string;
  name: string;
  party: string;
  chamber: string;
  recentTrades: Trade[];
}

export default function CongressWatchlistPage() {
  const [followed, setFollowed] = useState<FollowedPolitician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    try {
      const saved = localStorage.getItem('followedPoliticians');
      const slugs: string[] = saved ? JSON.parse(saved) : [];
      
      if (slugs.length === 0) {
        setFollowed([]);
        setLoading(false);
        return;
      }

      // Fetch trades data
      const res = await fetch('/congress-trades.json');
      const allTrades: Trade[] = await res.json();

      // Build followed list with their trades
      const followedList: FollowedPolitician[] = [];
      
      for (const slug of slugs) {
        const trades = allTrades.filter(t => 
          t.politician.toLowerCase().replace(/ /g, '-') === slug
        );
        
        if (trades.length > 0) {
          followedList.push({
            slug,
            name: trades[0].politician,
            party: trades[0].party,
            chamber: trades[0].chamber,
            recentTrades: trades.slice(0, 3)
          });
        }
      }

      setFollowed(followedList);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  }

  function unfollow(slug: string) {
    const saved = localStorage.getItem('followedPoliticians');
    const list: string[] = saved ? JSON.parse(saved) : [];
    const newList = list.filter(s => s !== slug);
    localStorage.setItem('followedPoliticians', JSON.stringify(newList));
    setFollowed(followed.filter(f => f.slug !== slug));
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/congress" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Congress Tracker
        </Link>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
          👀 Your Congress Watchlist
        </h1>
        <p style={{ color: '#888' }}>
          Politicians you&apos;re following. See their latest trades.
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#888' }}>Loading...</div>
      ) : followed.length === 0 ? (
        <div style={{ 
          background: '#111118', 
          padding: '60px 40px', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No politicians followed</h3>
          <p style={{ color: '#888', marginBottom: '24px' }}>
            Browse trades and follow politicians to track their moves.
          </p>
          <Link href="/congress" style={{
            display: 'inline-block',
            background: '#4ade80',
            color: '#000',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            Browse Trades →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {followed.map((pol) => (
            <div key={pol.slug} style={{
              background: '#111118',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '20px',
            }}>
              {/* Politician Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <Link 
                  href={`/congress/${pol.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <span style={{ color: '#fff', fontWeight: '600', fontSize: '18px' }}>
                    {pol.name}
                  </span>
                  <span style={{ 
                    color: pol.party === 'D' ? '#60a5fa' : '#f87171',
                    fontSize: '14px',
                    marginLeft: '8px'
                  }}>
                    ({pol.party}) · {pol.chamber}
                  </span>
                </Link>
                <button
                  onClick={() => unfollow(pol.slug)}
                  style={{
                    padding: '6px 12px',
                    background: '#7f1d1d',
                    color: '#f87171',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Unfollow
                </button>
              </div>

              {/* Recent Trades */}
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
                Recent trades:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pol.recentTrades.map((trade, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#0a0a0f',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        color: trade.type === 'Purchase' ? '#4ade80' : '#f87171',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {trade.type === 'Purchase' ? 'BUY' : 'SELL'}
                      </span>
                      <span style={{ color: '#4ade80', fontWeight: '500' }}>{trade.ticker}</span>
                    </div>
                    <span style={{ color: '#666', fontSize: '12px' }}>{trade.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {followed.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <p style={{ color: '#888', marginBottom: '12px' }}>
            🔔 Want alerts when these politicians trade?
          </p>
          <button style={{
            background: '#4ade80',
            color: '#000',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
          }}>
            Coming Soon
          </button>
        </div>
      )}

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
