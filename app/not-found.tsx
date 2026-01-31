'use client';

import { useEffect, useState } from 'react';
import TokenClient from './token/[mint]/TokenClient';
import WalletClient from './wallet/[address]/WalletClient';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import Link from 'next/link';

export default function NotFound() {
  const [route, setRoute] = useState<{ type: 'token' | 'wallet' | 'unknown'; param: string }>({ type: 'unknown', param: '' });

  useEffect(() => {
    const path = window.location.pathname;
    const tokenMatch = path.match(/^\/token\/([a-zA-Z0-9]+)$/);
    const walletMatch = path.match(/^\/wallet\/([a-zA-Z0-9]+)$/);

    if (tokenMatch) {
      setRoute({ type: 'token', param: tokenMatch[1] });
    } else if (walletMatch) {
      setRoute({ type: 'wallet', param: walletMatch[1] });
    }
  }, []);

  if (route.type === 'token') {
    return <TokenClient mint={route.param} />;
  }

  if (route.type === 'wallet') {
    return (
      <WalletClient
        address={route.param}
        walletLabel={`${route.param.slice(0, 6)}...${route.param.slice(-4)}`}
        walletDescription="Solana wallet"
      />
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
          Back to WhaleScope
        </Link>
      </main>
      <Footer />
    </>
  );
}
