import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';

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

function getTrades(): WhaleTrade[] {
  try {
    const dataPath = join(process.cwd(), 'data', 'whale-trades.json');
    if (!existsSync(dataPath)) return [];
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function Home() {
  const trades = getTrades();
  
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px' }}>
          🐋 WhaleScope
        </h1>
        <p style={{ fontSize: '20px', color: '#888', marginBottom: '24px' }}>
          See what smart money is buying on Solana
        </p>
      </div>

      {/* Token Search CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
        padding: '32px',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>
          🔍 Token God Mode
        </h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Search any token. See who&apos;s holding. Find smart wallets.
        </p>
        <Link href="/search" style={{
          display: 'inline-block',
          background: '#4ade80',
          color: '#000',
          padding: '14px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          textDecoration: 'none'
        }}>
          Search Tokens →
        </Link>
      </div>

      {/* Live Feed Header */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '24px', color: '#fff' }}>
          Recent Whale Trades
        </h2>
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '8px 16px',
          borderRadius: '8px',
        }}>
          <span style={{ color: '#4ade80' }}>● Live</span>
          <span style={{ marginLeft: '12px', color: '#888', fontSize: '14px' }}>
            Tracking {4} wallets
          </span>
        </div>
      </div>

      {/* Trade Feed */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#fff' }}>
          Recent Trades
        </h2>
        
        {trades.length === 0 ? (
          <div style={{ 
            background: '#111118', 
            padding: '40px', 
            borderRadius: '12px',
            textAlign: 'center',
            color: '#666'
          }}>
            No trades yet. Checking wallets...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trades.map((trade, i) => (
              <div key={i} style={{
                background: '#111118',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '20px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <span style={{
                      background: trade.action === 'BUY' ? '#064e3b' : 
                                 trade.action === 'SELL' ? '#7f1d1d' : '#374151',
                      color: trade.action === 'BUY' ? '#4ade80' : 
                             trade.action === 'SELL' ? '#f87171' : '#9ca3af',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '12px'
                    }}>
                      {trade.action}
                    </span>
                    <Link 
                      href={`/wallet/${trade.wallet}`}
                      style={{ fontWeight: '600', color: '#fff', textDecoration: 'none' }}
                    >
                      {trade.walletLabel} →
                    </Link>
                  </div>
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
                    View on Solscan →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
        padding: '32px',
        borderRadius: '16px',
        textAlign: 'center',
        marginTop: '40px'
      }}>
        <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>
          Get alerts when whales move
        </h3>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Real-time notifications. $15/month. Cancel anytime.
        </p>
        <button style={{
          background: '#4ade80',
          color: '#000',
          border: 'none',
          padding: '14px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          Coming Soon
        </button>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: '60px', color: '#666', fontSize: '14px' }}>
        Built by <a href="https://x.com/WrenTheAI" style={{ color: '#60a5fa' }}>@WrenTheAI</a> 🪶
      </footer>
    </main>
  );
}
