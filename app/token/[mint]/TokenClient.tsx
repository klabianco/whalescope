'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Holder {
  address: string;
  balance: number;
  percentage: number;
}

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
}

// Helius API key
const HELIUS_KEY = '2bc6aa5c-ec94-4566-9102-18294afa2b14';

export default function TokenClient({ mint }: { mint: string }) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mint) {
      fetchTokenData(mint);
    }
  }, [mint]);

  async function fetchTokenData(mintAddress: string) {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch token metadata
      const metadataRes = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: [mintAddress] })
      });
      
      const metadataData = await metadataRes.json();
      const tokenMeta = metadataData[0];
      
      const info: TokenInfo = {
        name: tokenMeta?.onChainMetadata?.metadata?.data?.name || tokenMeta?.legacyMetadata?.name || '',
        symbol: tokenMeta?.onChainMetadata?.metadata?.data?.symbol || tokenMeta?.legacyMetadata?.symbol || '',
        decimals: tokenMeta?.onChainMetadata?.metadata?.decimals || 9,
        supply: 0
      };
      setTokenInfo(info);

      // Fetch top holders
      const holdersRes = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'holders',
          method: 'getTokenLargestAccounts',
          params: [mintAddress]
        })
      });
      
      const holdersData = await holdersRes.json();
      const accounts = holdersData?.result?.value || [];
      
      // Calculate total from largest accounts
      const totalSupply = accounts.reduce((sum: number, acc: any) => {
        return sum + parseFloat(acc.uiAmount || 0);
      }, 0);
      
      info.supply = totalSupply;
      setTokenInfo({...info});
      
      // Map to holder format
      const holderList: Holder[] = accounts.slice(0, 20).map((acc: any) => {
        const balance = parseFloat(acc.uiAmount || 0);
        return {
          address: acc.address,
          balance,
          percentage: totalSupply > 0 ? (balance / totalSupply) * 100 : 0
        };
      });
      
      setHolders(holderList);
      
    } catch (err) {
      console.error('Token fetch error:', err);
      setError('Failed to fetch token data');
    } finally {
      setLoading(false);
    }
  }

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }

  function formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <Link href="/search" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Search
        </Link>
      </div>

      {/* Token Info */}
      <div style={{ marginBottom: '40px' }}>
        {loading ? (
          <div style={{ color: '#888' }}>Loading token data...</div>
        ) : error ? (
          <div style={{ color: '#f87171' }}>{error}</div>
        ) : tokenInfo ? (
          <>
            <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
              {tokenInfo.symbol || 'Unknown Token'}
            </h1>
            <p style={{ color: '#888', fontSize: '14px', wordBreak: 'break-all' }}>
              {mint}
            </p>
            {tokenInfo.name && (
              <p style={{ color: '#aaa', marginTop: '8px' }}>{tokenInfo.name}</p>
            )}
          </>
        ) : null}
      </div>

      {/* Top Holders */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#fff' }}>
          🐋 Top Holders
        </h2>
        
        {loading ? (
          <div style={{ color: '#888' }}>Loading holders...</div>
        ) : holders.length === 0 ? (
          <div style={{ 
            background: '#111118', 
            padding: '40px', 
            borderRadius: '12px',
            textAlign: 'center',
            color: '#666'
          }}>
            No holder data available
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {holders.map((holder, i) => (
              <div key={holder.address} style={{
                background: '#111118',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ 
                    color: '#666', 
                    fontSize: '14px',
                    width: '24px'
                  }}>
                    #{i + 1}
                  </span>
                  <div>
                    <a 
                      href={`https://solscan.io/account/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', textDecoration: 'none', fontFamily: 'monospace' }}
                    >
                      {shortenAddress(holder.address)}
                    </a>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#fff', fontWeight: '600' }}>
                    {formatNumber(holder.balance)}
                  </div>
                  <div style={{ color: '#888', fontSize: '13px' }}>
                    {holder.percentage.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
