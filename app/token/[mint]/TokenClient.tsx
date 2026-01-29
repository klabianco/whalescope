'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FOLLOW_BUTTON } from '../../config/theme';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { FollowToast } from '../../components/FollowToast';
import { useFollows } from '../../hooks/useFollows';

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

interface EarlyBuyer {
  address: string;
  timestamp: number;
  signature: string;
  amount: number;
}

// Helius API key is now server-side via /api/helius proxy

export default function TokenClient({ mint }: { mint: string }) {
  const { toast, toggleWhale, isFollowingWhale } = useFollows();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [earlyBuyers, setEarlyBuyers] = useState<EarlyBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'holders' | 'early'>('holders');

  useEffect(() => {
    if (mint) {
      fetchTokenData(mint);
    }
  }, [mint]);

  useEffect(() => {
    if (mint && activeTab === 'early' && earlyBuyers.length === 0) {
      fetchEarlyBuyers(mint);
    }
  }, [mint, activeTab]);

  async function fetchEarlyBuyers(mintAddress: string) {
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/helius?action=token-txns&mint=${mintAddress}`
      );
      const txs = await res.json();
      
      const buyers: EarlyBuyer[] = [];
      const seenWallets = new Set<string>();
      
      const sorted = (txs || []).sort((a: any, b: any) => a.timestamp - b.timestamp);
      
      for (const tx of sorted) {
        const tokenTransfers = tx.tokenTransfers || [];
        for (const transfer of tokenTransfers) {
          if (transfer.mint === mintAddress && transfer.toUserAccount) {
            const wallet = transfer.toUserAccount;
            if (!seenWallets.has(wallet) && buyers.length < 20) {
              seenWallets.add(wallet);
              buyers.push({
                address: wallet,
                timestamp: tx.timestamp,
                signature: tx.signature,
                amount: transfer.tokenAmount || 0
              });
            }
          }
        }
        if (buyers.length >= 20) break;
      }
      
      setEarlyBuyers(buyers);
    } catch (err) {
      console.error('Failed to fetch early buyers:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function fetchTokenData(mintAddress: string) {
    setLoading(true);
    setError(null);
    
    try {
      const metadataRes = await fetch(`/api/helius?action=token-metadata&mint=${mintAddress}`);
      
      const metadataData = await metadataRes.json();
      const tokenMeta = metadataData[0];
      
      const info: TokenInfo = {
        name: tokenMeta?.onChainMetadata?.metadata?.data?.name || tokenMeta?.legacyMetadata?.name || '',
        symbol: tokenMeta?.onChainMetadata?.metadata?.data?.symbol || tokenMeta?.legacyMetadata?.symbol || '',
        decimals: tokenMeta?.onChainMetadata?.metadata?.decimals || 9,
        supply: 0
      };
      setTokenInfo(info);

      const holdersRes = await fetch(`/api/helius`, {
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
      
      const totalSupply = accounts.reduce((sum: number, acc: any) => {
        return sum + parseFloat(acc.uiAmount || 0);
      }, 0);
      
      info.supply = totalSupply;
      setTokenInfo({...info});
      
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

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Follow button component
  const FollowButton = ({ address }: { address: string }) => {
    const isFollowing = isFollowingWhale(address);
    return (
      <button
        onClick={() => toggleWhale(address)}
        style={{
          padding: '6px 12px',
          background: isFollowing ? FOLLOW_BUTTON.activeBg : FOLLOW_BUTTON.inactiveBg,
          color: isFollowing ? FOLLOW_BUTTON.activeColor : FOLLOW_BUTTON.inactiveColor,
          border: isFollowing ? FOLLOW_BUTTON.activeBorder : FOLLOW_BUTTON.inactiveBorder,
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        {isFollowing ? '✓ Following' : 'Follow'}
      </button>
    );
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
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

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        borderBottom: '1px solid #333',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('holders')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'holders' ? '#333' : 'transparent',
            color: activeTab === 'holders' ? '#fff' : '#888',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Top Holders
        </button>
        <button
          onClick={() => setActiveTab('early')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'early' ? '#333' : 'transparent',
            color: activeTab === 'early' ? '#fff' : '#888',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ⏰ Early Buyers
        </button>
      </div>

      {/* Top Holders Tab */}
      {activeTab === 'holders' && (
        <div style={{ marginBottom: '40px' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fff', fontWeight: '600' }}>
                        {formatNumber(holder.balance)}
                      </div>
                      <div style={{ color: '#888', fontSize: '13px' }}>
                        {holder.percentage.toFixed(2)}%
                      </div>
                    </div>
                    <FollowButton address={holder.address} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Early Buyers Tab */}
      {activeTab === 'early' && (
        <div style={{ marginBottom: '40px' }}>
          {loadingHistory ? (
            <div style={{ color: '#888' }}>Loading transaction history...</div>
          ) : earlyBuyers.length === 0 ? (
            <div style={{ 
              background: '#111118', 
              padding: '40px', 
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666'
            }}>
              No early buyer data available
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {earlyBuyers.map((buyer, i) => (
                <div key={buyer.signature} style={{
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
                      color: i < 3 ? '#fbbf24' : '#666', 
                      fontSize: '14px',
                      width: '24px'
                    }}>
                      #{i + 1}
                    </span>
                    <div>
                      <a 
                        href={`https://solscan.io/account/${buyer.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa', textDecoration: 'none', fontFamily: 'monospace' }}
                      >
                        {shortenAddress(buyer.address)}
                      </a>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                        {formatDate(buyer.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fff', fontWeight: '600' }}>
                        {formatNumber(buyer.amount)}
                      </div>
                      <a 
                        href={`https://solscan.io/tx/${buyer.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#888', fontSize: '12px', textDecoration: 'none' }}
                      >
                        View tx →
                      </a>
                    </div>
                    <FollowButton address={buyer.address} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </main>
    <FollowToast message={toast.message} show={toast.show} />
    <Footer />
    </>
  );
}
