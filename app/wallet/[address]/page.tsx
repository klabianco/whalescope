import WalletClient from './WalletClient';
import whaleData from '../../../data/whale-wallets.json';

interface WalletEntry {
  address: string;
  name: string;
  type: string;
  totalUSD: string;
  totalUSDRaw: number;
  topHoldings?: string[] | null;
  solscanUrl: string;
}

const wallets = whaleData.wallets as WalletEntry[];

// Pre-generate pages for all tracked whale wallets
export function generateStaticParams() {
  return wallets.map((w) => ({ address: w.address }));
}

function getWalletInfo(address: string): { label: string; description: string } {
  const found = wallets.find((w) => w.address === address);
  if (found) {
    const desc = found.type === 'unknown_whale'
      ? `Whale · ${found.totalUSD} tracked value`
      : `${found.type.charAt(0).toUpperCase() + found.type.slice(1).replace('_', ' ')} · ${found.totalUSD} tracked value`;
    return { label: found.name, description: desc };
  }
  return {
    label: `${address.slice(0, 6)}...${address.slice(-4)}`,
    description: 'Solana wallet'
  };
}

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const info = getWalletInfo(address);

  return (
    <WalletClient
      address={address}
      walletLabel={info.label}
      walletDescription={info.description}
    />
  );
}
