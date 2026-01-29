'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CongressClient from './CongressClient';

interface CongressTrade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  state: string;
  ticker: string;
  company: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

interface CommitteeData {
  committees: Record<string, {
    sectors: string[];
    tickers: string[];
  }>;
  members: Record<string, string[]>;
}

function calculateTopTraders(trades: CongressTrade[]) {
  const traderMap = new Map<string, { party: string; count: number }>();
  
  for (const trade of trades) {
    const existing = traderMap.get(trade.politician) || { party: trade.party, count: 0 };
    existing.count++;
    traderMap.set(trade.politician, existing);
  }
  
  return Array.from(traderMap.entries())
    .map(([name, data]) => ({ name, party: data.party, trades: data.count }))
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 6);
}

export default function CongressPage() {
  const { publicKey } = useWallet();
  const [trades, setTrades] = useState<CongressTrade[]>([]);
  const [committeeData, setCommitteeData] = useState<CommitteeData>({ committees: {}, members: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch trades from server-side API (respects plan gating)
        const walletParam = publicKey ? `?wallet=${publicKey.toBase58()}` : '';
        const tradesRes = await fetch(`/api/congress-trades${walletParam}`);
        const tradesData = await tradesRes.json();
        setTrades(tradesData.trades || []);
      } catch (err) {
        console.error('Failed to load trades:', err);
      }

      try {
        // Committee data is non-sensitive, load from static
        const committeeRes = await fetch('/committee-data.json');
        if (committeeRes.ok) {
          setCommitteeData(await committeeRes.json());
        }
      } catch {}

      setLoading(false);
    }

    loadData();
  }, [publicKey]);

  if (loading) {
    return (
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>Loading congress trades...</p>
      </main>
    );
  }

  const topTraders = calculateTopTraders(trades);
  const politicians = Array.from(new Set(trades.map(t => t.politician)));
  
  return <CongressClient trades={trades} topTraders={topTraders} committeeData={committeeData} politicians={politicians} />;
}
