'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { FOLLOW_BUTTON } from '../../config/theme';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CommitteeInfo } from '../../components/CommitteeCorrelation';
import TradeAlerts from '../../components/TradeAlerts';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

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

interface CommitteeData {
  committees: Record<string, {
    sectors: string[];
    tickers: string[];
  }>;
  members: Record<string, string[]>;
}

export default function PoliticianClient({ slug }: { slug: string }) {
  const { publicKey, connected } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [committeeData, setCommitteeData] = useState<CommitteeData>({ committees: {}, members: {} });
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
    fetchData();
  }, [slug, storageKey]);

  async function fetchData() {
    try {
      // Fetch trades from API (Supabase-backed)
      const tradesRes = await fetch('/api/congress-trades');
      if (!tradesRes.ok) throw new Error('Failed to fetch');
      
      const data = await tradesRes.json();
      const allTrades: Trade[] = data.trades || data;
      
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

      // Fetch committee data
      try {
        const committeeRes = await fetch('/committee-data.json');
        if (committeeRes.ok) {
          const data = await committeeRes.json();
          setCommitteeData(data);
        }
      } catch {
        // Committee data is optional
      }
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

  // Check if a trade has committee correlation
  function hasCorrelation(trade: Trade): boolean {
    const memberCommittees = committeeData.members[trade.politician] || [];
    for (const committee of memberCommittees) {
      const committeeInfo = committeeData.committees[committee];
      if (committeeInfo?.tickers.includes(trade.ticker)) {
        return true;
      }
    }
    return false;
  }

  // Calculate stats
  const stats = {
    totalTrades: trades.length,
    buys: trades.filter(t => t.type === 'Purchase').length,
    sells: trades.filter(t => t.type === 'Sale').length,
    flagged: trades.filter(t => hasCorrelation(t)).length,
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
          fontSize: '13px',
          fontWeight: '600',
          height: '40px',
          padding: '0 16px',
          maxWidth: '160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>Follow</WalletMultiButton>
      );
    }
    
    return (
      <button
        onClick={toggleFollow}
        style={{
          padding: '12px 24px',
          background: following ? FOLLOW_BUTTON.activeBg : FOLLOW_BUTTON.inactiveBg,
          color: following ? FOLLOW_BUTTON.activeColor : FOLLOW_BUTTON.inactiveColor,
          border: following ? FOLLOW_BUTTON.activeBorder : FOLLOW_BUTTON.inactiveBorder,
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    );
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
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
            flexWrap: 'wrap',
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '24px' 
          }}>
            <div style={{ minWidth: 0, flex: '1 1 200px' }}>
              <h1 style={{ fontSize: '36px', marginBottom: '8px', wordBreak: 'break-word' }}>
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

          {/* Committee Info */}
          {politicianInfo && (
            <div style={{ marginBottom: '24px' }}>
              <CommitteeInfo politician={politicianInfo.name} committeeData={committeeData} />
            </div>
          )}

          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
            gap: '12px',
            marginBottom: '24px'
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
            <div style={{ 
              background: stats.flagged > 0 
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, #111118 100%)'
                : '#111118', 
              padding: '16px', 
              borderRadius: '12px',
              border: stats.flagged > 0 ? '1px solid rgba(251, 191, 36, 0.3)' : 'none'
            }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Flagged</div>
              <div style={{ color: stats.flagged > 0 ? '#fbbf24' : '#fff', fontSize: '20px', fontWeight: '600' }}>
                {stats.flagged}
              </div>
            </div>
            <div style={{ background: '#111118', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Top Ticker</div>
              <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: '600' }}>{stats.topTicker}</div>
            </div>
          </div>

          {/* Trade Alerts for this politician */}
          <div style={{ marginBottom: '32px' }}>
            <TradeAlerts 
              politicians={[politicianInfo.name]} 
              defaultPolitician={politicianInfo.name}
              compact={true} 
            />
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
              {trades.map((trade, i) => {
                const isFlagged = hasCorrelation(trade);
                
                return (
                  <div key={i} style={{
                    background: isFlagged 
                      ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, #111118 100%)'
                      : '#111118',
                    border: isFlagged ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid #222',
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
                        {isFlagged && (
                          <span style={{
                            background: '#fbbf24',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            marginLeft: '8px'
                          }}>
                            COMMITTEE
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fff' }}>{trade.amount}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        {trade.traded || trade.filed || 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Flagged Explanation */}
          {stats.flagged > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginTop: '24px'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                Note: <strong>Committee Correlation Alert:</strong> {stats.flagged} of this politician&apos;s trades 
                involve stocks that fall under the oversight of committees they serve on. This could indicate 
                a potential conflict of interest, though it&apos;s not necessarily illegal.
              </p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
    </main>
    <Footer />
    </>
  );
}
