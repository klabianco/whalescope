'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const WALLET = new PublicKey('hyTku9MYUuBtCWPxqmeyWcBvYuUbVKfXtafjBr7eAh3');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DECIMALS = 6;

import { PLAN_PRICES, PRICING } from '../config/pricing';

const PRICES = PLAN_PRICES;

function SubscribeContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro_monthly';
  const price = PRICES[plan as keyof typeof PRICES] || PRICES.pro_monthly;
  const isYearly = plan === 'pro_yearly';

  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txSig, setTxSig] = useState('');

  const handlePay = async () => {
    if (!publicKey) {
      setVisible(true);
      return;
    }

    setStatus('processing');
    setErrorMsg('');

    try {
      const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const toAta = await getAssociatedTokenAddress(USDC_MINT, WALLET);

      const transferIx = createTransferInstruction(
        fromAta,
        toAta,
        publicKey,
        price * Math.pow(10, USDC_DECIMALS),
        [],
        TOKEN_PROGRAM_ID
      );

      const memoData = JSON.stringify({ wallet: publicKey.toBase58(), plan });
      const memoIx = {
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(memoData)
      };

      const tx = new Transaction().add(transferIx).add(memoIx);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');

      setTxSig(sig);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  return (
    <main style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
          WhaleScope Pro
        </h1>
        <p style={{ color: '#71717a', fontSize: '15px' }}>
          {isYearly ? 'Annual subscription' : 'Monthly subscription'}
        </p>
      </div>

      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>${price}</span>
          <span style={{ color: '#71717a', fontSize: '18px', marginLeft: '4px' }}>
            {isYearly ? '/year' : '/month'}
          </span>
        </div>

        {isYearly && (
          <p style={{ color: '#22c55e', fontSize: '14px', marginBottom: '24px' }}>
            That's just ${(PRICING.pro.yearly / 12).toFixed(0)}/month — save ${(PRICING.pro.monthly * 12) - PRICING.pro.yearly} vs monthly
          </p>
        )}

        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: '0 0 32px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textAlign: 'left'
        }}>
          {[
            'Real-time trade alerts',
            'Congress trades (instant)',
            'Full Smart Money labels',
            'Unlimited watchlist',
            'Multi-chain support',
          ].map((item, i) => (
            <li key={i} style={{ 
              color: '#a1a1aa', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ color: '#22c55e' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>

        {status === 'success' ? (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
            <h3 style={{ color: '#22c55e', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Payment Successful!
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '16px' }}>
              Your Pro subscription is now active.
            </p>
            <a
              href={`https://solscan.io/tx/${txSig}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', fontSize: '14px' }}
            >
              View transaction →
            </a>
          </div>
        ) : (
          <>
            <button
              onClick={handlePay}
              disabled={status === 'processing'}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: status === 'processing' ? '#27272a' : '#fff',
                color: status === 'processing' ? '#71717a' : '#000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: status === 'processing' ? 'wait' : 'pointer'
              }}
            >
              {status === 'processing' 
                ? 'Processing...' 
                : connected 
                  ? `Pay ${price} USDC`
                  : 'Connect Wallet to Pay'
              }
            </button>

            {errorMsg && (
              <p style={{ color: '#f87171', marginTop: '16px', fontSize: '14px' }}>
                {errorMsg}
              </p>
            )}
          </>
        )}
      </div>

      <p style={{ color: '#52525b', fontSize: '13px', textAlign: 'center' }}>
        Payments are processed on Solana. USDC only.
      </p>
    </main>
  );
}

export default function SubscribePage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 24px 80px', textAlign: 'center' }}>
          <p style={{ color: '#71717a' }}>Loading...</p>
        </main>
      }>
        <SubscribeContent />
      </Suspense>
      <Footer />
    </>
  );
}
