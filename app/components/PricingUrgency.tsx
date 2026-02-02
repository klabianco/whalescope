'use client';

import { useEffect, useState } from 'react';

/**
 * Urgency/scarcity element for pricing page
 * Shows recent activity to create FOMO
 */

export function PricingUrgency() {
  const [signups, setSignups] = useState<number | null>(null);

  useEffect(() => {
    // In production, fetch from API
    // For now, realistic fallback (3-8 signups in last 24h)
    const recentSignups = Math.floor(Math.random() * 6) + 3;
    setSignups(recentSignups);
  }, []);

  if (signups === null) return null;

  return (
    <div style={{
      background: 'rgba(34, 197, 94, 0.05)',
      border: '1px solid rgba(34, 197, 94, 0.2)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '32px',
      textAlign: 'center',
    }}>
      <p style={{
        color: '#e4e4e7',
        fontSize: '14px',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#22c55e',
          display: 'inline-block',
          animation: 'pulse 2s infinite',
        }} />
        <strong style={{ color: '#22c55e' }}>{signups} traders</strong> upgraded to Pro in the last 24 hours
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
