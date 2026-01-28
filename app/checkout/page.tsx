'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../providers/AuthProvider';

const PRICES = {
  pro_monthly: { usdc: 24, sol: 0.11, label: 'Pro Monthly' },
  pro_yearly: { usdc: 240, sol: 1.1, label: 'Pro Yearly' },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { publicKey, connected } = useWallet();
  
  const [plan, setPlan] = useState<'pro_monthly' | 'pro_yearly'>('pro_monthly');
  const [currency, setCurrency] = useState<'USDC' | 'SOL'>('USDC');
  const [paymentIntent, setPaymentIntent] = useState<{
    paymentId: string;
    treasury: string;
    amount: number;
    memo: string;
    expiresAt: string;
  } | null>(null);
  const [signature, setSignature] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam === 'pro_yearly' || planParam === 'pro_monthly') {
      setPlan(planParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/checkout?plan=${plan}`);
    }
  }, [user, authLoading, router, plan]);

  const createPaymentIntent = async () => {
    if (!user) return;
    
    setError('');
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan,
          currency,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      setPaymentIntent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const verifyPayment = async () => {
    if (!paymentIntent || !signature) return;
    
    setVerifying(true);
    setError('');
    
    try {
      const response = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentIntent.paymentId,
          signature,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => router.push('/dashboard?upgraded=true'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#71717a' }}>Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '28px', color: '#fff', marginBottom: '12px' }}>
            Welcome to Pro!
          </h1>
          <p style={{ color: '#71717a', marginBottom: '24px' }}>
            Your payment was confirmed. Redirecting to dashboard...
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const priceInfo = PRICES[plan];
  const amount = currency === 'USDC' ? priceInfo.usdc : priceInfo.sol;

  return (
    <>
      <Header />
      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Checkout
          </h1>
          <p style={{ color: '#71717a' }}>
            Pay with crypto to unlock Pro features
          </p>
        </div>

        {/* Plan Summary */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>{priceInfo.label}</h3>
              <p style={{ color: '#71717a', fontSize: '14px' }}>
                {plan === 'pro_yearly' ? 'Billed annually' : 'Billed monthly'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#22c55e', fontSize: '24px', fontWeight: '700' }}>
                {amount} {currency}
              </p>
            </div>
          </div>
        </div>

        {/* Currency Toggle */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#a1a1aa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            Pay with
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['USDC', 'SOL'] as const).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCurrency(c);
                  setPaymentIntent(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: currency === c ? '#27272a' : 'transparent',
                  border: '1px solid',
                  borderColor: currency === c ? '#3f3f46' : '#27272a',
                  borderRadius: '8px',
                  color: currency === c ? '#fff' : '#71717a',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {c === 'USDC' ? '💵 USDC' : '◎ SOL'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {!paymentIntent ? (
          <>
            {/* Connect Wallet */}
            {!connected && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '12px' }}>
                  Connect your wallet to continue
                </p>
                <WalletMultiButton style={{
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: '#27272a',
                  borderRadius: '10px'
                }} />
              </div>
            )}

            <button
              onClick={createPaymentIntent}
              disabled={!connected}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: connected 
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : '#27272a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: connected ? 'pointer' : 'not-allowed',
                opacity: connected ? 1 : 0.5
              }}
            >
              Generate Payment Details
            </button>
          </>
        ) : (
          <>
            {/* Payment Instructions */}
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '16px' }}>
                Send Payment
              </h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#71717a', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Amount
                </label>
                <p style={{ color: '#22c55e', fontSize: '20px', fontWeight: '600' }}>
                  {paymentIntent.amount} {currency}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#71717a', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Send to (Treasury)
                </label>
                <code style={{
                  display: 'block',
                  background: '#18181b',
                  padding: '10px',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}>
                  {paymentIntent.treasury}
                </code>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#71717a', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Memo (include in transaction)
                </label>
                <code style={{
                  display: 'block',
                  background: '#18181b',
                  padding: '10px',
                  borderRadius: '6px',
                  color: '#fbbf24',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {paymentIntent.memo}
                </code>
              </div>

              <p style={{ color: '#71717a', fontSize: '12px' }}>
                ⏰ Expires: {new Date(paymentIntent.expiresAt).toLocaleTimeString()}
              </p>
            </div>

            {/* Transaction Signature Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#a1a1aa', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                Transaction Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Paste your transaction signature..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <p style={{ color: '#52525b', fontSize: '12px', marginTop: '6px' }}>
                After sending, paste the transaction signature here to verify
              </p>
            </div>

            <button
              onClick={verifyPayment}
              disabled={!signature || verifying}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: signature && !verifying
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : '#27272a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: signature && !verifying ? 'pointer' : 'not-allowed',
                opacity: signature && !verifying ? 1 : 0.5
              }}
            >
              {verifying ? 'Verifying...' : 'Verify Payment'}
            </button>

            <button
              onClick={() => setPaymentIntent(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#71717a',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '12px'
              }}
            >
              Cancel
            </button>
          </>
        )}

        {/* Security Note */}
        <div style={{
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '32px'
        }}>
          <p style={{ color: '#fbbf24', fontSize: '13px', lineHeight: '1.6' }}>
            🔒 <strong>Secure Payment:</strong> Payments are verified on-chain. 
            Only send from your own wallet — we verify the transaction directly on Solana.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: '#71717a' }}>Loading...</p>
        </main>
        <Footer />
      </>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
