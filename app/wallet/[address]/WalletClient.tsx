'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

interface ParsedTrade {
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  action: 'BUY' | 'SELL' | 'UNKNOWN';
  tokenSymbol?: string;
  tokenMint?: string;
  amount?: number;
  solAmount?: number;
}

// Stablecoins to exclude
const STABLECOIN_MINTS = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);

interface Props {
  address: string;
  walletLabel: string;
  walletDescription: string;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  if (num < 0.01) return num.toFixed(6);
  return num.toFixed(2);
}

function parseTrades(txns: any[], walletAddress: string): ParsedTrade[] {
  return txns.map((tx: any) => {
    const desc = tx.description || '';
    const type = tx.type || 'UNKNOWN';
    
    let action: ParsedTrade['action'] = 'UNKNOWN';
    let tokenSymbol: string | undefined;
    let tokenMint: string | undefined;
    let amount: number | undefined;
    let solAmount: number | undefined;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];

    if (type === 'SWAP') {
      const received = tokenTransfers.find((t: any) => t.toUserAccount === walletAddress && t.mint !== 'So11111111111111111111111111111111111111112');
      const sent = tokenTransfers.find((t: any) => t.fromUserAccount === walletAddress && t.mint !== 'So11111111111111111111111111111111111111112');
      
      if (received) {
        action = 'BUY';
        tokenMint = received.mint;
        amount = received.tokenAmount;
      } else if (sent) {
        action = 'SELL';
        tokenMint = sent.mint;
        amount = sent.tokenAmount;
      }

      const solReceived = nativeTransfers.find((t: any) => t.toUserAccount === walletAddress);
      const solSent = nativeTransfers.find((t: any) => t.fromUserAccount === walletAddress);
      if (action === 'SELL' && solReceived) solAmount = solReceived.amount / 1e9;
      else if (action === 'BUY' && solSent) solAmount = solSent.amount / 1e9;
    } else if (type === 'TRANSFER') {
      // Classify transfers by direction
      const sentToken = tokenTransfers.find((t: any) => t.fromUserAccount === walletAddress);
      const receivedToken = tokenTransfers.find((t: any) => t.toUserAccount === walletAddress);
      const sentNative = nativeTransfers.find((t: any) => t.fromUserAccount === walletAddress);
      const receivedNative = nativeTransfers.find((t: any) => t.toUserAccount === walletAddress);

      if (sentToken && !receivedToken) {
        action = 'SELL';
        tokenMint = sentToken.mint;
        amount = sentToken.tokenAmount;
      } else if (receivedToken && !sentToken) {
        action = 'BUY';
        tokenMint = receivedToken.mint;
        amount = receivedToken.tokenAmount;
      } else if (sentNative && !receivedNative) {
        action = 'SELL';
        tokenMint = 'So11111111111111111111111111111111111111112';
        amount = sentNative.amount / 1e9;
      } else if (receivedNative && !sentNative) {
        action = 'BUY';
        tokenMint = 'So11111111111111111111111111111111111111112';
        amount = receivedNative.amount / 1e9;
      }
    }

    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      type,
      description: desc,
      action,
      tokenSymbol,
      tokenMint,
      amount,
      solAmount,
    };
  })
  // Filter out stablecoins and unknowns
  .filter(t => t.action !== 'UNKNOWN' && !(t.tokenMint && STABLECOIN_MINTS.has(t.tokenMint)));
}

export default function WalletClient({ address, walletLabel, walletDescription }: Props) {
  const [trades, setTrades] = useState<ParsedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrades() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/helius?action=wallet-txns&address=${address}&limit=50`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const data = await res.json();
        const parsed = parseTrades(data, address);
        setTrades(parsed);
      } catch (err) {
        console.error('Failed to fetch wallet trades:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    }
    fetchTrades();
  }, [address]);

  const stats = {
    totalTrades: trades.length,
    buys: trades.filter(t => t.action === 'BUY').length,
    sells: trades.filter(t => t.action === 'SELL').length,
    firstSeen: trades.length > 0
      ? new Date(Math.min(...trades.map(t => t.timestamp)) * 1000).toLocaleDateString()
      : 'N/A',
    lastActive: trades.length > 0
      ? timeAgo(Math.max(...trades.map(t => t.timestamp)))
      : 'N/A'
  };

  function shortenAddress(addr: string): string {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }

  const actionColors: Record<string, { bg: string; text: string }> = {
    BUY: { bg: '#064e3b', text: '#4ade80' },
    SELL: { bg: '#7f1d1d', text: '#f87171' },
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>
        {/* Wallet Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '32px'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            {walletLabel}
          </h1>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            {walletDescription}
          </p>
          <div style={{ 
            background: 'rgba(0,0,0,0.3)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#4ade80',
            wordBreak: 'break-all'
          }}>
            {address}
          </div>
          <div style={{ marginTop: '16px' }}>
            <a 
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: '#60a5fa', 
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              View on Solscan →
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        {!loading && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {[
              { label: 'Transactions', value: stats.totalTrades, color: '#fff' },
              { label: 'Buys', value: stats.buys, color: '#4ade80' },
              { label: 'Sells', value: stats.sells, color: '#f87171' },
              { label: 'First Seen', value: stats.firstSeen, color: '#888' },
              { label: 'Last Active', value: stats.lastActive, color: '#60a5fa' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: '#111118',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trade History */}
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#fff' }}>
            Recent Activity
          </h2>
          
          {loading ? (
            <div style={{ 
              background: '#111118', 
              padding: '40px', 
              borderRadius: '12px',
              textAlign: 'center',
              color: '#888'
            }}>
              Loading transactions...
            </div>
          ) : error ? (
            <div style={{ 
              background: '#111118', 
              padding: '40px', 
              borderRadius: '12px',
              textAlign: 'center',
              color: '#f87171'
            }}>
              {error}
            </div>
          ) : trades.length === 0 ? (
            <div style={{ 
              background: '#111118', 
              padding: '40px', 
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666'
            }}>
              No recent transactions found for this wallet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trades.map((trade, i) => {
                const colors = actionColors[trade.action] || actionColors.UNKNOWN;
                return (
                  <div key={trade.signature} style={{
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
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          background: colors.bg,
                          color: colors.text,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {trade.action}
                        </span>
                      </div>
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        {timeAgo(trade.timestamp)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                      {trade.amount != null && trade.amount > 0 && (
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                          {formatNumber(trade.amount)} tokens
                        </span>
                      )}
                      {trade.solAmount != null && trade.solAmount > 0 && (
                        <span style={{ color: '#888', fontSize: '13px' }}>
                          {formatNumber(trade.solAmount)} SOL
                        </span>
                      )}
                      {trade.tokenMint && (
                        <Link
                          href={`/token/${trade.tokenMint}`}
                          style={{ color: '#60a5fa', fontSize: '13px', textDecoration: 'none' }}
                        >
                          View token →
                        </Link>
                      )}
                      <a 
                        href={`https://solscan.io/tx/${trade.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#888', fontSize: '13px', textDecoration: 'none', marginLeft: 'auto' }}
                      >
                        View tx →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
      <Footer />
    </>
  );
}
