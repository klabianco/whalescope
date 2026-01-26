'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface Whale {
  name: string;
  type: string;
  address: string;
  description: string;
}

const KNOWN_WHALES: Whale[] = [
  {
    name: "Jump Crypto",
    type: "Market Maker",
    address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    description: "Major crypto trading firm and market maker"
  },
  {
    name: "Wintermute",
    type: "Market Maker", 
    address: "CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq",
    description: "Algorithmic trading firm"
  },
  {
    name: "Binance Hot Wallet",
    type: "Exchange",
    address: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
    description: "Binance exchange hot wallet"
  },
  {
    name: "Coinbase Prime",
    type: "Exchange",
    address: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
    description: "Coinbase institutional custody"
  },
  {
    name: "Solana Foundation",
    type: "Foundation",
    address: "GK2zqSsXLA2rwVZk347RYhh6jJpRsCA69FjLW93ZGi3B",
    description: "Official Solana Foundation wallet"
  },
  {
    name: "Multicoin Capital",
    type: "VC",
    address: "AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9",
    description: "Crypto venture capital fund"
  },
  {
    name: "Paradigm",
    type: "VC",
    address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    description: "Major crypto VC fund"
  },
  {
    name: "Kraken",
    type: "Exchange",
    address: "FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5",
    description: "Kraken exchange wallet"
  },
  {
    name: "OKX",
    type: "Exchange",
    address: "5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD",
    description: "OKX exchange hot wallet"
  },
  {
    name: "DeFiance Capital",
    type: "VC",
    address: "CZ2FBDqQ7Y94VQp5RhdPLpqbqg5e56sCNQYhXpyTdqGw",
    description: "DeFi-focused VC fund"
  },
  {
    name: "Galaxy Digital",
    type: "VC",
    address: "E6aTzkZKdCECgpDtBZtVpqiHwfoxx3XpEfH4yjnBPMNE",
    description: "Mike Novogratz's crypto investment firm"
  },
  {
    name: "Amber Group",
    type: "Trading Firm",
    address: "FKY6NyXGpMPR3pE2gEThXHPLNZLLqt7pCijBxEuiaNjf",
    description: "Crypto trading and financial services"
  },
  {
    name: "Polychain Capital",
    type: "VC",
    address: "FYSvSgMqmPEhNWHQkdehrPQdrb6WVSzMBLRNV6aHMFJN",
    description: "Major crypto VC fund"
  },
  {
    name: "Crypto.com",
    type: "Exchange",
    address: "AobVSwdW9BbpMdJvTqeCN4hPAmh4rHm7vwLnQ5ATSPo9",
    description: "Crypto.com exchange wallet"
  },
  {
    name: "Bybit",
    type: "Exchange",
    address: "AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2",
    description: "Bybit exchange wallet"
  },
  {
    name: "Messari",
    type: "Research",
    address: "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
    description: "Crypto research firm"
  },
  {
    name: "Delphi Digital",
    type: "Research/VC",
    address: "8MQNm3R4VbpDgKEqxnULz7zBhMCXfyiLpENMkaEMuNbL",
    description: "Crypto research and ventures"
  },
  {
    name: "Sino Global Capital",
    type: "VC",
    address: "BuNe7qF1cNgEBbXKPuZrWdcTxbRHm9vHxU8BHKW8kWqf",
    description: "Asia-focused crypto VC"
  },
  {
    name: "Three Arrows Capital",
    type: "VC (Defunct)",
    address: "9BVcYqEQxyccuwznvxXqDkSJFavvTyheiTYk231T1A8S",
    description: "Former crypto hedge fund - defunct"
  },
  {
    name: "Alameda Research",
    type: "Trading Firm (Defunct)",
    address: "5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD",
    description: "Former FTX trading arm - defunct but wallets still tracked"
  }
];

const TYPE_COLORS: Record<string, string> = {
  'Market Maker': '#60a5fa',
  'Exchange': '#fbbf24',
  'Foundation': '#a78bfa',
  'VC': '#4ade80',
  'Trading Firm': '#f472b6',
  'Research': '#22d3d8',
  'Research/VC': '#22d3d8',
  'VC (Defunct)': '#6b7280',
  'Trading Firm (Defunct)': '#6b7280'
};

export default function WhalesPage() {
  const { publicKey, connected } = useWallet();
  const [following, setFollowing] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('All');
  
  const storageKey = publicKey ? publicKey.toBase58() : null;
  
  const types = ['All'].concat(Array.from(new Set(KNOWN_WHALES.map(w => w.type))));
  
  const filteredWhales = filter === 'All' 
    ? KNOWN_WHALES 
    : KNOWN_WHALES.filter(w => w.type === filter);

  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`wallets_${storageKey}`);
        setFollowing(saved ? JSON.parse(saved) : []);
      } catch {
        setFollowing([]);
      }
    } else {
      setFollowing([]);
    }
  }, [storageKey]);

  function toggleFollow(address: string) {
    if (!storageKey) return;
    
    const newList = following.includes(address)
      ? following.filter(a => a !== address)
      : [...following, address];
    
    localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
    setFollowing(newList);
  }

  function followAll() {
    if (!storageKey) return;
    const allAddresses = filteredWhales.map(w => w.address);
    const combined = Array.from(new Set(following.concat(allAddresses)));
    localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(combined));
    setFollowing(combined);
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Home
        </Link>
        <h1 style={{ fontSize: '36px', margin: '16px 0 8px' }}>
          🐋 Known Whales
        </h1>
        <p style={{ color: '#888', marginBottom: '24px' }}>
          Track the biggest wallets on Solana. VCs, exchanges, market makers, and more.
        </p>
        
        {/* Wallet + Follow All */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!connected ? (
            <WalletMultiButton style={{
              backgroundColor: '#4ade80',
              color: '#000',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              height: '44px',
              padding: '0 24px'
            }} />
          ) : (
            <>
              <button
                onClick={followAll}
                style={{
                  padding: '12px 24px',
                  background: '#4ade80',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Follow All {filter !== 'All' ? filter : ''} ({filteredWhales.length})
              </button>
              <span style={{ color: '#666', fontSize: '14px' }}>
                Following {following.length} wallets
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        flexWrap: 'wrap' 
      }}>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: '8px 16px',
              background: filter === type ? '#333' : 'transparent',
              color: filter === type ? '#fff' : '#888',
              border: '1px solid #333',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Whale List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredWhales.map((whale) => (
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
                  background: TYPE_COLORS[whale.type] + '20',
                  color: TYPE_COLORS[whale.type],
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
                style={{ 
                  color: '#60a5fa', 
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  textDecoration: 'none'
                }}
              >
                {whale.address.slice(0, 8)}...{whale.address.slice(-8)}
              </Link>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link 
                href={`/wallet/${whale.address}`}
                style={{
                  padding: '10px 20px',
                  background: '#222',
                  color: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                View
              </Link>
              {connected ? (
                <button
                  onClick={() => toggleFollow(whale.address)}
                  style={{
                    padding: '10px 20px',
                    background: following.includes(whale.address) ? '#4ade80' : '#333',
                    color: following.includes(whale.address) ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {following.includes(whale.address) ? '✓' : '+'}
                </button>
              ) : (
                <button
                  onClick={() => document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click()}
                  style={{
                    padding: '10px 20px',
                    background: '#333',
                    color: '#888',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Connect to +
                </button>
              )}
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
