import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import WalletClient from './WalletClient';

// Pre-generate pages for known whale wallets
export function generateStaticParams() {
  try {
    const whalesPath = join(process.cwd(), 'data', 'known-whales.json');
    if (!existsSync(whalesPath)) return [];
    const whales = JSON.parse(readFileSync(whalesPath, 'utf-8'));
    return whales.map((w: { address: string }) => ({ address: w.address }));
  } catch {
    return [];
  }
}

// Load wallet labels from verified data file
function getWalletData(): Record<string, { label: string; description: string }> {
  try {
    const whalesPath = join(process.cwd(), 'data', 'known-whales.json');
    if (!existsSync(whalesPath)) return {};
    const whales = JSON.parse(readFileSync(whalesPath, 'utf-8'));
    const result: Record<string, { label: string; description: string }> = {};
    for (const w of whales) {
      result[w.address] = {
        label: w.name,
        description: w.description
      };
    }
    return result;
  } catch {
    return {};
  }
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const walletData = getWalletData();
  
  const walletInfo = walletData[address] || { 
    label: shortenAddress(address), 
    description: 'Tracked wallet' 
  };

  return (
    <WalletClient 
      address={address}
      walletLabel={walletInfo.label}
      walletDescription={walletInfo.description}
    />
  );
}
