import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import WalletClient from './WalletClient';

// Pre-generate pages for known whale wallets
export function generateStaticParams() {
  return [
    { address: 'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9' },
    { address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' },
    { address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH' },
    { address: 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq' },
  ];
}

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

function getWalletData(): Record<string, { label: string; description: string }> {
  return {
    'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9': {
      label: 'Multicoin Capital',
      description: 'Crypto VC fund'
    },
    '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1': {
      label: 'Raydium Top Trader',
      description: 'Major trading firm on Raydium'
    },
    'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH': {
      label: 'Paradigm',
      description: 'Major crypto VC'
    },
    'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq': {
      label: 'Wintermute',
      description: 'Algorithmic trading firm'
    }
  };
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function WalletPage({ params }: { params: { address: string } }) {
  const { address } = params;
  const allTrades = getTrades();
  const walletData = getWalletData();
  
  const walletTrades = allTrades.filter(t => t.wallet === address);
  const walletInfo = walletData[address] || { 
    label: shortenAddress(address), 
    description: 'Tracked wallet' 
  };
  
  const stats = {
    totalTrades: walletTrades.length,
    buys: walletTrades.filter(t => t.action === 'BUY').length,
    sells: walletTrades.filter(t => t.action === 'SELL').length,
    firstSeen: walletTrades.length > 0 
      ? new Date(Math.min(...walletTrades.map(t => t.timestamp)) * 1000).toLocaleDateString()
      : 'N/A',
    lastActive: walletTrades.length > 0
      ? timeAgo(Math.max(...walletTrades.map(t => t.timestamp)))
      : 'N/A'
  };

  return (
    <WalletClient 
      address={address}
      walletInfo={walletInfo}
      walletTrades={walletTrades}
      stats={stats}
    />
  );
}
