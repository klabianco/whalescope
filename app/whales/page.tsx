'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../providers/AuthProvider';
import arkhamData from '../../data/arkham-entities.json';

const FREE_WATCHLIST_LIMIT = 3;

interface ArkhamEntity {
  slug: string;
  name: string;
  type: string;
  totalUSD: string;
  addresses: number | null;
  arkhamUrl: string;
  topHoldings?: string[];
}

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

// Parse "$901.8M" or "$7.4B" to a number for sorting
function parseUSD(val: string): number {
  const num = parseFloat(val.replace(/[$,]/g, ''));
  if (val.includes('B')) return num * 1_000_000_000;
  if (val.includes('M')) return num * 1_000_000;
  if (val.includes('K')) return num * 1_000;
  return num;
}

const ENTITIES: ArkhamEntity[] = (arkhamData.entities as ArkhamEntity[])
  .sort((a, b) => parseUSD(b.totalUSD) - parseUSD(a.totalUSD));

type EntityType = 'all' | 'fund' | 'institution' | 'individual' | 'protocol' | 'exchange' | 'government';

const ENTITY_TYPE_LABELS: Record<string, string> = {
  fund: 'Fund',
  institution: 'Institution',
  individual: 'Individual',
  protocol: 'Protocol',
  exchange: 'Exchange',
  government: 'Government',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  fund: '#4ade80',
  institution: '#60a5fa',
  individual: '#a78bfa',
  protocol: '#22d3ee',
  exchange: '#fbbf24',
  government: '#f87171',
};

const TYPE_COLORS: Record<string, string> = {
  'Congress-D': '#60a5fa',
  'Congress-R': '#f87171',
  'Congress-I': '#a78bfa',
};

export default function WhalesPage() {
  const { publicKey, connected } = useWallet();
  const [followingEntities, setFollowingEntities] = useState<string[]>([]);
  const [followingPoliticians, setFollowingPoliticians] = useState<string[]>([]);
  const [tab, setTab] = useState<'crypto' | 'congress'>('crypto');
  const [entityFilter, setEntityFilter] = useState<EntityType>('all');
  const [politicians, setPoliticians] = useState<{name: string; party: string; chamber: string; slug: string; tradeCount: number}[]>([]);
  const [limitWarning, setLimitWarning] = useState(false);
  
  let isPro = false;
  try {
    const auth = useAuth();
    isPro = auth.isPro;
  } catch {}

  const storageKey = publicKey ? publicKey.toBase58() : null;

  const filteredEntities = entityFilter === 'all'
    ? ENTITIES
    : ENTITIES.filter(e => e.type === entityFilter);

  // Count entities per type for filter pills
  const typeCounts: Record<string, number> = {};
  ENTITIES.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  useEffect(() => {
    if (storageKey) {
      try {
        const savedEntities = localStorage.getItem(`entities_${storageKey}`);
        setFollowingEntities(savedEntities ? JSON.parse(savedEntities) : []);
        const savedPols = localStorage.getItem(`politicians_${storageKey}`);
        setFollowingPoliticians(savedPols ? JSON.parse(savedPols) : []);
      } catch {
        setFollowingEntities([]);
        setFollowingPoliticians([]);
      }
    }
    
    // Fetch congress data from API (Supabase-backed)
    fetch('/api/congress-trades')
      .then(res => res.ok ? res.json().then(d => d.trades || d) : [])
      .then((trades: CongressTrade[]) => {
        const polMap = new Map<string, {name: string; party: string; chamber: string; count: number}>();
        trades.forEach(t => {
          const key = t.politician;
          if (polMap.has(key)) {
            polMap.get(key)!.count++;
          } else {
            polMap.set(key, { name: t.politician, party: t.party, chamber: t.chamber, count: 1 });
          }
        });
        const pols = Array.from(polMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
          .map(p => ({
            name: p.name,
            party: p.party,
            chamber: p.chamber,
            slug: p.name.toLowerCase().replace(/ /g, '-'),
            tradeCount: p.count
          }));
        setPoliticians(pols);
      })
      .catch(() => setPoliticians([]));
  }, [storageKey]);

  function toggleFollowEntity(slug: string) {
    if (!storageKey) return;
    if (followingEntities.includes(slug)) {
      const newList = followingEntities.filter(s => s !== slug);
      localStorage.setItem(`entities_${storageKey}`, JSON.stringify(newList));
      setFollowingEntities(newList);
      setLimitWarning(false);
      return;
    }
    const totalFollowed = followingEntities.length + followingPoliticians.length;
    if (!isPro && totalFollowed >= FREE_WATCHLIST_LIMIT) {
      setLimitWarning(true);
      return;
    }
    const newList = [...followingEntities, slug];
    localStorage.setItem(`entities_${storageKey}`, JSON.stringify(newList));
    setFollowingEntities(newList);
  }

  function toggleFollowPolitician(slug: string) {
    if (!storageKey) return;
    if (followingPoliticians.includes(slug)) {
      const newList = followingPoliticians.filter(s => s !== slug);
      localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
      setFollowingPoliticians(newList);
      setLimitWarning(false);
      return;
    }
    const totalFollowed = followingEntities.length + followingPoliticians.length;
    if (!isPro && totalFollowed >= FREE_WATCHLIST_LIMIT) {
      setLimitWarning(true);
      return;
    }
    const newList = [...followingPoliticians, slug];
    localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
    setFollowingPoliticians(newList);
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', margin: '0 0 8px' }}>
            Whale Tracker
          </h1>
          <p style={{ color: '#888' }}>
            The biggest crypto wallets and most active Congress traders — all in one place.
          </p>
        </div>

      {/* Watchlist Limit Warning */}
      {limitWarning && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0 }}>
            Free plan limit: {FREE_WATCHLIST_LIMIT} watchlist slots. Upgrade for unlimited.
          </p>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#fbbf24',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Upgrade to Pro
            </button>
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px',
        background: '#111118',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setTab('crypto')}
          style={{
            padding: '12px 24px',
            background: tab === 'crypto' ? '#333' : 'transparent',
            color: tab === 'crypto' ? '#fff' : '#888',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Crypto Whales
        </button>
        <button
          onClick={() => setTab('congress')}
          style={{
            padding: '12px 24px',
            background: tab === 'congress' ? '#333' : 'transparent',
            color: tab === 'congress' ? '#fff' : '#888',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Congress ({politicians.length})
        </button>
      </div>

      {/* Crypto Whales — Arkham Entities */}
      {tab === 'crypto' && (
        <>
          {/* Filter pills */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setEntityFilter('all')}
              style={{
                padding: '6px 14px',
                background: entityFilter === 'all' ? '#fff' : '#1a1a24',
                color: entityFilter === 'all' ? '#000' : '#888',
                border: '1px solid ' + (entityFilter === 'all' ? '#fff' : '#333'),
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              All ({ENTITIES.length})
            </button>
            {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => {
              const count = typeCounts[key] || 0;
              if (count === 0) return null;
              const color = ENTITY_TYPE_COLORS[key] || '#888';
              const isActive = entityFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setEntityFilter(key as EntityType)}
                  style={{
                    padding: '6px 14px',
                    background: isActive ? color + '20' : '#1a1a24',
                    color: isActive ? color : '#888',
                    border: '1px solid ' + (isActive ? color + '60' : '#333'),
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Entity cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEntities.map((entity) => {
              const typeColor = ENTITY_TYPE_COLORS[entity.type] || '#888';
              const typeLabel = ENTITY_TYPE_LABELS[entity.type] || entity.type;
              return (
                <div key={entity.slug} style={{
                  background: '#111118',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* Name + type badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                        {entity.name}
                      </span>
                      <span style={{
                        background: typeColor + '20',
                        color: typeColor,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {typeLabel}
                      </span>
                    </div>

                    {/* Portfolio value */}
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>
                      {entity.totalUSD}
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '400', marginLeft: '8px' }}>
                        portfolio
                      </span>
                    </div>

                    {/* Top holdings */}
                    {entity.topHoldings && entity.topHoldings.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {entity.topHoldings.slice(0, 5).map((holding, i) => (
                          <span key={i} style={{
                            background: '#1a1a24',
                            border: '1px solid #2a2a3a',
                            color: '#aaa',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            {holding}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Address count + Arkham link */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                      {entity.addresses && (
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          {entity.addresses} addresses tracked
                        </span>
                      )}
                      <a 
                        href={entity.arkhamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        View on Arkham ↗
                      </a>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a 
                      href={entity.arkhamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        padding: '10px 20px', 
                        background: '#222', 
                        color: '#fff', 
                        borderRadius: '8px', 
                        textDecoration: 'none', 
                        fontSize: '14px',
                        display: 'inline-block'
                      }}
                    >
                      Profile
                    </a>
                    <button
                      onClick={() => {
                        if (connected) {
                          toggleFollowEntity(entity.slug);
                        } else {
                          document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        background: followingEntities.includes(entity.slug) ? typeColor + '30' : '#222',
                        color: followingEntities.includes(entity.slug) ? typeColor : '#fff',
                        border: followingEntities.includes(entity.slug) ? `1px solid ${typeColor}50` : '1px solid transparent',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {followingEntities.includes(entity.slug) ? '✓ Following' : 'Follow'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data source attribution */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '24px', 
            padding: '12px',
            color: '#555',
            fontSize: '12px'
          }}>
            Entity data powered by{' '}
            <a href="https://intel.arkm.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Arkham Intelligence
            </a>
          </div>
        </>
      )}

      {/* Congress */}
      {tab === 'congress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {politicians.map((pol) => (
            <div key={pol.slug} style={{
              background: '#111118',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                    {pol.name}
                  </span>
                  <span style={{
                    background: (pol.party === 'D' ? '#60a5fa' : pol.party === 'R' ? '#f87171' : '#a78bfa') + '20',
                    color: pol.party === 'D' ? '#60a5fa' : pol.party === 'R' ? '#f87171' : '#a78bfa',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {pol.party === 'D' ? 'Democrat' : pol.party === 'R' ? 'Republican' : 'Independent'}
                  </span>
                </div>
                <p style={{ color: '#888', fontSize: '13px', margin: '4px 0' }}>
                  {pol.chamber} · {pol.tradeCount} {pol.tradeCount === 1 ? 'trade' : 'trades'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link 
                  href={`/congress/${pol.slug}`}
                  style={{ padding: '10px 20px', background: '#222', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}
                >
                  View Trades
                </Link>
                <button
                  onClick={() => {
                    if (connected) {
                      toggleFollowPolitician(pol.slug);
                    } else {
                      document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    background: followingPoliticians.includes(pol.slug) ? '#333' : '#222',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {followingPoliticians.includes(pol.slug) ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
    <Footer />
    </>
  );
}
