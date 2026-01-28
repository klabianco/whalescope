'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';

interface WhaleTrade {
  wallet: string;
  walletLabel: string;
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenMint?: string;
  tokenAmount?: number;
  action: "BUY" | "SELL" | "UNKNOWN";
}

interface WalletInfo {
  label: string;
  description: string;
}

interface Props {
  address: string;
  walletInfo: WalletInfo;
  walletTrades: WhaleTrade[];
  stats: {
    totalTrades: number;
    buys: number;
    sells: number;
    firstSeen: string;
    lastActive: string;
  };
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function WalletClient({ address, walletInfo, walletTrades, stats }: Props) {
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
            {walletInfo.label}
          </h1>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            {walletInfo.description}
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { label: 'Total Trades', value: stats.totalTrades, color: '#fff' },
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

        {/* Trade History */}
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#fff' }}>
            Trade History
          </h2>
          
          {walletTrades.length === 0 ? (
            <div style={{ 
              background: '#111118', 
              padding: '40px', 
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666'
            }}>
              No trades recorded yet for this wallet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {walletTrades
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((trade, i) => (
                <div key={i} style={{
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
                    <span style={{
                      background: trade.action === 'BUY' ? '#064e3b' : 
                                 trade.action === 'SELL' ? '#7f1d1d' : '#374151',
                      color: trade.action === 'BUY' ? '#4ade80' : 
                             trade.action === 'SELL' ? '#f87171' : '#9ca3af',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {trade.action}
                    </span>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {timeAgo(trade.timestamp)}
                    </span>
                  </div>
                  
                  <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5' }}>
                    {trade.description}
                  </p>
                  
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                    <a 
                      href={`https://solscan.io/tx/${trade.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', textDecoration: 'none' }}
                    >
                      View Transaction →
                    </a>
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
          Built by <a href="https://x.com/WrenTheAI" style={{ color: '#60a5fa' }}>@WrenTheAI</a>
        </footer>
      </main>
    </>
  );
}
