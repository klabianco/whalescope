'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface Trade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  company: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

export default function PoliticianClient({ slug }: { slug: string }) {
  const { publicKey, connected } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [politicianInfo, setPoliticianInfo] = useState<{name: string; party: string; chamber: string} | null>(null);

  const storageKey = publicKey ? publicKey.toBase58() : null;

  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`politicians_${storageKey}`);
        const list = saved ? JSON.parse(saved) : [];
        setFollowing(list.includes(slug));
      } catch {
        setFollowing(false);
      }
    }
    fetchTrades();
  }, [slug, storageKey]);

  async function fetchTrades() {
    try {
      const res = await fetch('/congress-trades.json');
      if (!res.ok) throw new Error('Failed to fetch');
      
      const allTrades: Trade[] = await res.json();
      
      const slugLower = slug.toLowerCase();
      const filtered = allTrades.filter(t => {
        const nameSlug = t.politician.toLowerCase().replace(/ /g, '-');
        return nameSlug === slugLower;
      });
      
      if (filtered.length > 0) {
        setPoliticianInfo({
          name: filtered[0].politician,
          party: filtered[0].party,
          chamber: filtered[0].chamber
        });
      }
      
      setTrades(filtered);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleFollow() {
    if (!storageKey) return;
    
    try {
      const saved = localStorage.getItem(`politicians_${storageKey}`);
      const list = saved ? JSON.parse(saved) : [];
      const newList = following
        ? list.filter((s: string) => s !== slug)
        : [...list, slug];
      localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
      setFollowing(!following);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  }

  // Calculate stats
  const stats = {
    totalTrades: trades.length,
    buys: trades.filter(t => t.type === 'Purchase').length,
    sells: trades.filter(t => t.type === 'Sale').length,
    topTicker: trades.length > 0 
      ? Object.entries(trades.reduce((acc, t) => { acc[t.ticker] = (acc[t.ticker] || 0) + 1; return acc; }, {} as Record<string, number>))
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      : 'N/A'
  };

  // Follow button
  const FollowButton = () => {
    if (!connected) {
      return (
        <WalletMultiButton style={{
          backgroundColor: '#4ade80',
          color: '#000',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          height: '44px',
          padding: '0 24px'
        }} />
      );
    }
    
    return (
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
    );
  };

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/congress" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Congress Tracker
        </Link>
      </div>

      {loading ? (
        <div style={{ color: '#888' }}>Loading...</div>
      ) : !politicianInfo ? (
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Politician Not Found</h1>
          <p style={{ color: '#888' }}>No trades found for this politician.</p>
          <Link href="/congress" style={{ color: '#60a5fa' }}>← Back to all trades</Link>
        </div>
      ) : (
        <>
          {/* Politician Info */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '40px' 
          }}>
            <div>
              <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
                {politicianInfo.name}
              </h1>
              <p style={{ color: '#888' }}>
                <span style={{ 
                  color: politicianInfo.party === 'D' ? '#60a5fa' : '#f87171',
                  fontWeight: '600'
                }}>
                  {politicianInfo.party === 'D' ? 'Democrat' : politicianInfo.party === 'R' ? 'Republican' : 'Independent'}
                </span>
                {' · '}
                {politicianInfo.chamber}
              </p>
            </div>
            <FollowButton />
          </div>

          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px',
            marginBottom: '40px'
          }}>
            <div style={{ background: '#111118', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Total Trades</div>
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600' }}>{stats.totalTrades}</div>
            </div>
            <div style={{ background: '#111118', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Buys</div>
              <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: '600' }}>{stats.buys}</div>
            </div>
            <div style={{ background: '#111118', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Sells</div>
              <div style={{ color: '#f87171', fontSize: '20px', fontWeight: '600' }}>{stats.sells}</div>
            </div>
            <div style={{ background: '#111118', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Top Ticker</div>
              <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: '600' }}>{stats.topTicker}</div>
            </div>
          </div>

          {/* Trades */}
          <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#fff' }}>
            Recent Trades
          </h2>
          
          {trades.length === 0 ? (
            <div style={{ background: '#111118', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#666' }}>
              No trades found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trades.map((trade, i) => (
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
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff' }}>{trade.amount}</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      {trade.traded || trade.filed || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
