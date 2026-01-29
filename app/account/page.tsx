'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface AccountData {
  plan: string;
  email: string | null;
  subscription: {
    status: string;
    plan: string;
    currentPeriodEnd: string;
    paymentMethod: string;
    lastPaymentSignature: string;
  } | null;
}

export default function AccountPage() {
  const { publicKey, connected } = useWallet();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      fetchAccount();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  async function fetchAccount() {
    setLoading(true);
    try {
      const res = await fetch(`/api/account?wallet=${publicKey!.toBase58()}`);
      const data = await res.json();
      if (res.ok) {
        setAccount(data);
      }
    } catch (err) {
      console.error('Failed to fetch account:', err);
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!publicKey) return;
    setCanceling(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Subscription canceled. You'll keep Pro access until ${formatDate(data.expiresAt)}.`,
        });
        // Refresh account data
        await fetchAccount();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel subscription' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }

    setCanceling(false);
    setCancelConfirm(false);
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function shortenSig(sig: string): string {
    return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
  }

  const isPro = account?.plan === 'pro' || account?.plan === 'enterprise';
  const isCanceled = account?.subscription?.status === 'canceled';
  const isExpired = account?.subscription?.status === 'expired';
  const expiryDate = account?.subscription?.currentPeriodEnd;

  // Not connected — prompt to connect wallet
  if (!connected) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px 80px' }}>
          <div style={{
            background: '#111118',
            padding: '60px 40px',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h2 style={{ color: '#fff', marginBottom: '8px' }}>Connect Your Wallet</h2>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              Connect your Solana wallet to view your account settings.
            </p>
            <WalletMultiButton style={{
              backgroundColor: '#4ade80',
              color: '#000',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              height: '48px',
              padding: '0 32px',
            }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px 80px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Account Settings
          </h1>
          <p style={{ color: '#71717a', fontSize: '15px' }}>
            Manage your subscription and account details.
          </p>
        </div>

        {loading ? (
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#71717a' }}>Loading account info...</p>
          </div>
        ) : (
          <>
            {/* Message banner */}
            {message && (
              <div style={{
                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
              }}>
                <p style={{
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  fontSize: '14px',
                  margin: 0,
                }}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Current Plan */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '28px',
              marginBottom: '16px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  Current Plan
                </h2>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: isPro ? 'rgba(34, 197, 94, 0.15)' : '#27272a',
                  color: isPro ? '#4ade80' : '#71717a',
                  border: `1px solid ${isPro ? 'rgba(34, 197, 94, 0.3)' : '#3f3f46'}`,
                }}>
                  {isPro ? (isCanceled ? 'Pro (Canceled)' : 'Pro') : 'Free'}
                </span>
              </div>

              {/* Pro Active */}
              {isPro && !isCanceled && expiryDate && (
                <div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '24px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#71717a', fontSize: '14px' }}>Status</span>
                      <span style={{ color: '#4ade80', fontSize: '14px' }}>Active</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#71717a', fontSize: '14px' }}>Renews on</span>
                      <span style={{ color: '#a1a1aa', fontSize: '14px' }}>{formatDate(expiryDate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#71717a', fontSize: '14px' }}>Payment</span>
                      <span style={{ color: '#a1a1aa', fontSize: '14px' }}>USDC on Solana</span>
                    </div>
                    {account?.subscription?.lastPaymentSignature && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#71717a', fontSize: '14px' }}>Last payment</span>
                        <a
                          href={`https://solscan.io/tx/${account.subscription.lastPaymentSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}
                        >
                          {shortenSig(account.subscription.lastPaymentSignature)}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Cancel section */}
                  {!cancelConfirm ? (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        color: '#71717a',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel Subscription
                    </button>
                  ) : (
                    <div style={{
                      background: 'rgba(248, 113, 113, 0.05)',
                      border: '1px solid rgba(248, 113, 113, 0.2)',
                      borderRadius: '8px',
                      padding: '20px',
                    }}>
                      <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 16px 0' }}>
                        Are you sure? You&apos;ll keep Pro access until <strong style={{ color: '#fff' }}>{formatDate(expiryDate)}</strong>, then your account will revert to Free.
                      </p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={handleCancel}
                          disabled={canceling}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#7f1d1d',
                            color: '#f87171',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: canceling ? 'wait' : 'pointer',
                          }}
                        >
                          {canceling ? 'Canceling...' : 'Yes, Cancel'}
                        </button>
                        <button
                          onClick={() => setCancelConfirm(false)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#27272a',
                            color: '#a1a1aa',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            cursor: 'pointer',
                          }}
                        >
                          Keep Pro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pro Canceled — grace period */}
              {isPro && isCanceled && expiryDate && (
                <div>
                  <div style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}>
                    <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0 }}>
                      ⚠️ Your subscription has been canceled. Pro access expires on <strong>{formatDate(expiryDate)}</strong>.
                    </p>
                  </div>
                  <Link
                    href="/subscribe?plan=pro_monthly"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '12px',
                      background: '#fff',
                      color: '#000',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    Re-subscribe to Pro
                  </Link>
                </div>
              )}

              {/* Free plan */}
              {!isPro && (
                <div>
                  <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 20px 0' }}>
                    You&apos;re on the Free plan. Upgrade to Pro for real-time alerts, full Smart Money labels, and unlimited watchlist.
                  </p>
                  <Link
                    href="/pricing"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '14px',
                      background: '#fff',
                      color: '#000',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    Upgrade to Pro 🚀
                  </Link>
                </div>
              )}
            </div>

            {/* Pro Benefits — Discord & Telegram (only for active Pro) */}
            {isPro && !isExpired && (
              <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '28px',
                marginBottom: '16px',
              }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0 0 6px 0' }}>
                  Your Pro Benefits
                </h2>
                <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 20px 0' }}>
                  Exclusive channels for Pro members — get alerts wherever you are.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Discord */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#111118',
                    borderRadius: '8px',
                    padding: '16px',
                  }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                        🎮 Discord Community
                      </div>
                      <div style={{ color: '#71717a', fontSize: '12px' }}>
                        Real-time trade alerts in #alerts
                      </div>
                    </div>
                    <a
                      href="https://discord.gg/prKfxkYFUw"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ade80',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Join Discord
                    </a>
                  </div>

                  {/* Telegram */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#111118',
                    borderRadius: '8px',
                    padding: '16px',
                  }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                        📱 Telegram Bot
                      </div>
                      <div style={{ color: '#71717a', fontSize: '12px' }}>
                        Get whale alerts as DMs
                      </div>
                    </div>
                    <a
                      href="https://t.me/WrenTheAi_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ade80',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Connect Telegram
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Info */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '28px',
            }}>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
                Wallet
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  color: '#a1a1aa',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}>
                  {publicKey!.toBase58().slice(0, 6)}...{publicKey!.toBase58().slice(-6)}
                </span>
                <a
                  href={`https://solscan.io/account/${publicKey!.toBase58()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#60a5fa',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  View on Solscan ↗
                </a>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
