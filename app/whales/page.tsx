'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from '../components/Header';

interface Whale {
  name: string;
  type: string;
  address: string;
  description: string;
  market: 'crypto' | 'tradfi';
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

const CRYPTO_WHALES: Whale[] = [
  { name: "Jump Crypto", type: "Market Maker", address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", description: "Major crypto trading firm", market: 'crypto' },
  { name: "Wintermute", type: "Market Maker", address: "CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq", description: "Algorithmic trading firm", market: 'crypto' },
  { name: "Binance", type: "Exchange", address: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", description: "Binance hot wallet", market: 'crypto' },
  { name: "Coinbase Prime", type: "Exchange", address: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", description: "Institutional custody", market: 'crypto' },
  { name: "Solana Foundation", type: "Foundation", address: "GK2zqSsXLA2rwVZk347RYhh6jJpRsCA69FjLW93ZGi3B", description: "Official foundation wallet", market: 'crypto' },
  { name: "Multicoin Capital", type: "VC", address: "AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", description: "Crypto VC fund", market: 'crypto' },
  { name: "Paradigm", type: "VC", address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH", description: "Major crypto VC", market: 'crypto' },
  { name: "Kraken", type: "Exchange", address: "FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5", description: "Kraken exchange", market: 'crypto' },
  { name: "Galaxy Digital", type: "VC", address: "E6aTzkZKdCECgpDtBZtVpqiHwfoxx3XpEfH4yjnBPMNE", description: "Novogratz's fund", market: 'crypto' },
  { name: "Polychain Capital", type: "VC", address: "FYSvSgMqmPEhNWHQkdehrPQdrb6WVSzMBLRNV6aHMFJN", description: "Major crypto VC", market: 'crypto' },
];

const TYPE_COLORS: Record<string, string> = {
  'Market Maker': '#60a5fa',
  'Exchange': '#fbbf24',
  'Foundation': '#a78bfa',
  'VC': '#4ade80',
  'Congress-D': '#60a5fa',
  'Congress-R': '#f87171',
  'Congress-I': '#a78bfa',
};

export default function WhalesPage() {
  const { publicKey, connected } = useWallet();
  const [followingWallets, setFollowingWallets] = useState<string[]>([]);
  const [followingPoliticians, setFollowingPoliticians] = useState<string[]>([]);
  const [tab, setTab] = useState<'crypto' | 'congress'>('crypto');
  const [politicians, setPoliticians] = useState<{name: string; party: string; chamber: string; slug: string; tradeCount: number}[]>([]);
  
  const storageKey = publicKey ? publicKey.toBase58() : null;

  useEffect(() => {
    if (storageKey) {
      try {
        const savedWallets = localStorage.getItem(`wallets_${storageKey}`);
        setFollowingWallets(savedWallets ? JSON.parse(savedWallets) : []);
        const savedPols = localStorage.getItem(`politicians_${storageKey}`);
        setFollowingPoliticians(savedPols ? JSON.parse(savedPols) : []);
      } catch {
        setFollowingWallets([]);
        setFollowingPoliticians([]);
      }
    }
    
    // Fetch congress data
    fetch('/congress-trades.json')
      .then(res => res.ok ? res.json() : [])
      .then((trades: CongressTrade[]) => {
        // Get unique politicians with trade counts
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

  function toggleFollowWallet(address: string) {
    if (!storageKey) return;
    const newList = followingWallets.includes(address)
      ? followingWallets.filter(a => a !== address)
      : [...followingWallets, address];
    localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
    setFollowingWallets(newList);
  }

  function toggleFollowPolitician(slug: string) {
    if (!storageKey) return;
    const newList = followingPoliticians.includes(slug)
      ? followingPoliticians.filter(s => s !== slug)
      : [...followingPoliticians, slug];
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
            🐋 Smart Money
          </h1>
          <p style={{ color: '#888' }}>
            Track the biggest players. Crypto whales & Congress trades.
          </p>
        </div>

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
          🪙 Crypto Whales
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
          🏛️ Congress ({politicians.length})
        </button>
      </div>

      {/* Crypto Whales */}
      {tab === 'crypto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CRYPTO_WHALES.map((whale) => (
            <div key={whale.address} style={{
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
                    {whale.name}
                  </span>
                  <span style={{
                    background: (TYPE_COLORS[whale.type] || '#666') + '20',
                    color: TYPE_COLORS[whale.type] || '#666',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {whale.type}
                  </span>
                </div>
                <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 8px' }}>
                  {whale.description}
                </p>
                <Link 
                  href={`/wallet/${whale.address}`}
                  style={{ color: '#60a5fa', fontSize: '12px', fontFamily: 'monospace', textDecoration: 'none' }}
                >
                  {whale.address.slice(0, 8)}...{whale.address.slice(-8)}
                </Link>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link 
                  href={`/wallet/${whale.address}`}
                  style={{ padding: '10px 20px', background: '#222', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}
                >
                  View
                </Link>
                <button
                  onClick={() => {
                    if (connected) {
                      toggleFollowWallet(whale.address);
                    } else {
                      document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click();
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    background: followingWallets.includes(whale.address) ? '#4ade80' : '#333',
                    color: followingWallets.includes(whale.address) ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {followingWallets.includes(whale.address) ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
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
                    background: followingPoliticians.includes(pol.slug) ? '#4ade80' : '#333',
                    color: followingPoliticians.includes(pol.slug) ? '#000' : '#fff',
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

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '60px', color: '#666', fontSize: '14px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          🐋 WhaleScope
        </Link>
        {' · '}
        Built by <a href="https://x.com/WrenTheAI" style={{ color: '#60a5fa' }}>@WrenTheAI</a> 🪶
      </footer>
    </main>
    </>
  );
}
