'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../providers/AuthProvider';
import { supabase, Watchlist } from '../../lib/supabase';

export default function DashboardPage() {
  const { user, profile, loading, isPro } = useAuth();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<Watchlist[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setWatchlist(data as Watchlist[]);
    }
    setLoadingWatchlist(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: '#71717a' }}>Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return null;
  }

  const watchlistLimit = isPro ? Infinity : 5;
  const watchlistCount = watchlist.length;

  return (
    <>
      <Header />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Welcome back{profile?.email ? `, ${profile.email.split('@')[0]}` : ''}
          </h1>
          <p style={{ color: '#71717a', fontSize: '15px' }}>
            {isPro ? (
              <span style={{ color: '#22c55e' }}>✓ Pro Account</span>
            ) : (
              <>
                Free Account · <Link href="/pricing" style={{ color: '#22c55e', textDecoration: 'none' }}>Upgrade to Pro</Link>
              </>
            )}
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>Watchlist</p>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: '700' }}>
              {watchlistCount}
              {!isPro && <span style={{ color: '#52525b', fontSize: '16px', fontWeight: '400' }}> / {watchlistLimit}</span>}
            </p>
          </div>

          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>Alerts Today</p>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: '700' }}>0</p>
          </div>

          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>Plan</p>
            <p style={{ color: isPro ? '#22c55e' : '#fff', fontSize: '28px', fontWeight: '700' }}>
              {profile?.plan === 'enterprise' ? 'Enterprise' : profile?.plan === 'pro' ? 'Pro' : 'Free'}
            </p>
          </div>
        </div>

        {/* Alert Connections */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
            Alert Channels
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {/* Telegram */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📱</span>
                <div>
                  <p style={{ color: '#fff', fontWeight: '500' }}>Telegram</p>
                  <p style={{ color: '#71717a', fontSize: '13px' }}>
                    {profile?.telegram_chat_id ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isPro ? (
                <Link href="/dashboard/connect/telegram">
                  <button style={{
                    padding: '8px 16px',
                    background: profile?.telegram_chat_id ? '#27272a' : '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}>
                    {profile?.telegram_chat_id ? 'Manage' : 'Connect'}
                  </button>
                </Link>
              ) : (
                <span style={{ color: '#52525b', fontSize: '12px' }}>Pro only</span>
              )}
            </div>

            {/* Discord */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>💬</span>
                <div>
                  <p style={{ color: '#fff', fontWeight: '500' }}>Discord</p>
                  <p style={{ color: '#71717a', fontSize: '13px' }}>
                    {profile?.discord_user_id ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isPro ? (
                <button style={{
                  padding: '8px 16px',
                  background: '#27272a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}>
                  Coming Soon
                </button>
              ) : (
                <span style={{ color: '#52525b', fontSize: '12px' }}>Pro only</span>
              )}
            </div>

            {/* Email */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✉️</span>
                <div>
                  <p style={{ color: '#fff', fontWeight: '500' }}>Email</p>
                  <p style={{ color: '#71717a', fontSize: '13px' }}>
                    {profile?.email || 'Not set'}
                  </p>
                </div>
              </div>
              <span style={{ color: '#22c55e', fontSize: '12px' }}>✓ Active</span>
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
              Your Watchlist
            </h2>
            {(isPro || watchlistCount < watchlistLimit) && (
              <Link href="/dashboard/watchlist/add">
                <button style={{
                  padding: '8px 16px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  + Add Address
                </button>
              </Link>
            )}
          </div>

          {loadingWatchlist ? (
            <p style={{ color: '#71717a' }}>Loading watchlist...</p>
          ) : watchlist.length === 0 ? (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#71717a', marginBottom: '16px' }}>
                Your watchlist is empty. Add wallets, tokens, or politicians to track.
              </p>
              <Link href="/dashboard/watchlist/add">
                <button style={{
                  padding: '10px 20px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  Add Your First
                </button>
              </Link>
            </div>
          ) : (
            <div style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {watchlist.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: i < watchlist.length - 1 ? '1px solid #1f1f23' : 'none'
                }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: '500' }}>
                      {item.label || `${item.address.slice(0, 8)}...${item.address.slice(-6)}`}
                    </p>
                    <p style={{ color: '#52525b', fontSize: '12px' }}>
                      {item.address_type} · Added {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.notify_telegram && <span title="Telegram alerts">📱</span>}
                    {item.notify_email && <span title="Email alerts">✉️</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isPro && watchlistCount >= watchlistLimit && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '14px' }}>
                You&apos;ve reached the free plan limit of {watchlistLimit} items.
              </p>
              <Link href="/pricing">
                <button style={{
                  padding: '8px 16px',
                  background: '#fbbf24',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Upgrade to Pro
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
