'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const WALLET = new PublicKey('hyTku9MYUuBtCWPxqmeyWcBvYuUbVKfXtafjBr7eAh3');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DECIMALS = 6;
const PRICE_USDC = 10;

export default function SubscribePage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txSig, setTxSig] = useState('');

  const handlePay = async () => {
    if (!publicKey || !email || !email.includes('@')) {
      setErrorMsg('Enter a valid email first');
      return;
    }

    setStatus('processing');
    setErrorMsg('');

    try {
      // Get token accounts
      const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const toAta = await getAssociatedTokenAddress(USDC_MINT, WALLET);

      // Create transfer instruction
      const transferIx = createTransferInstruction(
        fromAta,
        toAta,
        publicKey,
        PRICE_USDC * Math.pow(10, USDC_DECIMALS),
        [],
        TOKEN_PROGRAM_ID
      );

      // Create memo instruction
      const memoIx = {
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(email.trim().toLowerCase())
      };

      // Build transaction
      const tx = new Transaction().add(transferIx).add(memoIx);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // Send
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
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
      color: '#fff',
      minHeight: '100vh',
      background: '#0a0a0a'
    }}>
      <h1 style={{ marginBottom: 8 }}>🐋 WhaleScope Pro</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>
        Get instant email alerts when Congress members trade stocks.
      </p>
      
      <div style={{ 
        background: '#161618', 
        padding: 24, 
        borderRadius: 12,
        marginBottom: 24,
        border: '1px solid #222'
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>$10/month in USDC</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#aaa' }}>
          <li>Real-time trade alerts via email</li>
          <li>Filter by politician or sector</li>
          <li>Cancel anytime</li>
        </ul>
      </div>

      {status === 'success' ? (
        <div style={{ 
          background: '#0d2818', 
          padding: 24, 
          borderRadius: 12,
          border: '1px solid #1a4d2e',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ margin: '0 0 12px 0', color: '#4ade80' }}>
            Payment Successful!
          </h3>
          <p style={{ color: '#aaa', marginBottom: 16 }}>
            You'll receive a welcome email at <strong>{email}</strong> within 10 minutes.
          </p>
          <a 
            href={`https://solscan.io/tx/${txSig}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#60a5fa', fontSize: 14 }}
          >
            View transaction →
          </a>
        </div>
      ) : (
        <>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '2px solid #333',
              borderRadius: 8,
              marginBottom: 16,
              boxSizing: 'border-box',
              background: '#111',
              color: '#fff'
            }}
          />

          {!publicKey ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#888', marginBottom: 12 }}>Connect your wallet to pay</p>
              <WalletMultiButton style={{ 
                background: '#4ade80',
                color: '#000',
                borderRadius: 8,
                fontWeight: 600
              }} />
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={status === 'processing' || !email}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                background: status === 'processing' ? '#333' : '#4ade80',
                color: status === 'processing' ? '#888' : '#000',
                border: 'none',
                borderRadius: 8,
                cursor: status === 'processing' ? 'wait' : 'pointer',
                fontWeight: 600
              }}
            >
              {status === 'processing' ? 'Processing...' : `Pay $${PRICE_USDC} USDC`}
            </button>
          )}

          {errorMsg && (
            <p style={{ color: '#f87171', marginTop: 12, textAlign: 'center' }}>
              {errorMsg}
            </p>
          )}
        </>
      )}
      
      <p style={{ marginTop: 32, fontSize: 14, color: '#666', textAlign: 'center' }}>
        <a href="/" style={{ color: '#888' }}>← Back to WhaleScope</a>
      </p>
    </div>
  );
}
