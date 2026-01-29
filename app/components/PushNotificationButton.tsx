'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  isPushSupported,
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
  registerServiceWorker,
} from '../lib/push-notifications';

export function PushNotificationButton() {
  const { publicKey, connected } = useWallet();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const sup = isPushSupported();
      setSupported(sup);
      if (sup) {
        await registerServiceWorker();
        const sub = await isPushSubscribed();
        setSubscribed(sub);
      }
      setChecked(true);
    };
    check();
  }, []);

  if (!checked || !supported) return null;
  if (!connected || !publicKey) return null;

  async function handleToggle() {
    if (!publicKey) return;
    setLoading(true);

    try {
      if (subscribed) {
        const ok = await unsubscribeFromPush();
        if (ok) setSubscribed(false);
      } else {
        const ok = await subscribeToPush(publicKey.toBase58());
        if (ok) setSubscribed(true);
      }
    } catch (err) {
      console.error('Push toggle error:', err);
    }

    setLoading(false);
  }

  return (
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
          {subscribed ? '✅ Push Notifications' : '🔔 Push Notifications'}
        </div>
        <div style={{ color: '#71717a', fontSize: '12px' }}>
          {subscribed ? 'Browser alerts enabled' : 'Get alerts in your browser'}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: subscribed ? '#27272a' : 'rgba(34, 197, 94, 0.15)',
          color: subscribed ? '#a1a1aa' : '#4ade80',
          border: `1px solid ${subscribed ? '#3f3f46' : 'rgba(34, 197, 94, 0.3)'}`,
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: loading ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading
          ? 'Loading...'
          : subscribed
            ? 'Disable'
            : 'Enable'}
      </button>
    </div>
  );
}
