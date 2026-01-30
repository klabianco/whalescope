'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import allTradesData from '../../../data/whale-trades.json';

interface WhaleTrade {
  wallet: string;
  walletLabel: string;
  walletValue: string;
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  tokenMint?: string;
  tokenSymbol?: string;
  tokenAmount?: number;
  solAmount?: number;
  action: 'BUY' | 'SELL';
}

interface Props {
  address: string;
  walletLabel: string;
  walletDescription: string;
}

const ALL_TRADES = allTradesData as WhaleTrade[];

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

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletClient({ address, walletLabel, walletDescription }: Props) {
  // All trades for this wallet (for stats)
  const allWalletTrades = useMemo(
    () => ALL_TRADES.filter(t => t.wallet === address).sort((a, b) => b.timestamp - a.timestamp),
    [address]
  );

  // Filtered trades for display — remove dust (< 0.1 SOL equivalent)
  const trades = useMemo(
    () => allWalletTrades.filter(t => {
      // Keep trades with meaningful amounts
      if (t.solAmount && t.solAmount >= 0.1) return true;
      if (t.tokenAmount && t.tokenAmount >= 1) return true;
      return false;
    }),
    [allWalletTrades]
  );

  const stats = {
    totalTrades: trades.length,
    buys: trades.filter(t => t.action === 'BUY').length,
    sells: trades.filter(t => t.action === 'SELL').length,
    firstSeen: trades.length > 0
      ? new Date(Math.min(...trades.map(t => t.timestamp)) * 1000).toLocaleDateString()
      : 'N/A',
    lastActive: trades.length > 0
      ? timeAgo(Math.max(...trades.map(t => t.timestamp)))
      : 'N/A',
  };

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
          marginBottom: '32px',
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            {walletLabel}
          </h1>
          <p style={{ color: '#888', marginBottom: '16px' }}>{walletDescription}</p>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#4ade80',
            wordBreak: 'break-all',
          }}>
            {address}
          </div>
          <div style={{ marginTop: '16px' }}>
            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}
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
          marginBottom: '32px',
        }}>
          {[
            { label: 'Trades', value: stats.totalTrades, color: '#fff' },
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
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trade History */}
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#fff' }}>
            Recent Activity
          </h2>

          {trades.length === 0 ? (
            <div style={{
              background: '#111118',
              padding: '40px',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#666',
            }}>
              No recent trades found for this wallet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trades.map((trade) => {
                const colors = actionColors[trade.action] || { bg: '#374151', text: '#9ca3af' };
                const symbol = trade.tokenSymbol || (trade.tokenMint ? shortAddr(trade.tokenMint) : '???');
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
                      marginBottom: '12px',
                    }}>
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
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        {timeAgo(trade.timestamp)}
                      </span>
                    </div>

                    {/* Token + Amount */}
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>
                        {symbol}
                      </span>
                      {trade.tokenAmount != null && trade.tokenAmount > 0 && (
                        <span style={{ color: '#ccc', fontSize: '14px', marginLeft: '8px' }}>
                          {formatNumber(trade.tokenAmount)} {symbol}
                        </span>
                      )}
                      {trade.solAmount != null && trade.solAmount > 0 && (
                        <span style={{ color: '#888', fontSize: '13px', marginLeft: '8px' }}>
                          ({formatNumber(trade.solAmount)} SOL)
                        </span>
                      )}
                    </div>
                    {/* Links */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      {trade.tokenMint && (
                        <Link
                          href={`/token/${trade.tokenMint}`}
                          style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}
                        >
                          View token ↗
                        </Link>
                      )}
                      <a
                        href={`https://solscan.io/tx/${trade.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#888', fontSize: '12px', textDecoration: 'none' }}
                      >
                        View tx ↗
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
