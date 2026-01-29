'use client';

import Link from 'next/link';

interface Props {
  message: string;
  show: boolean;
}

export function FollowToast({ message, show }: Props) {
  if (!show) return null;
  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1a1a24',
        border: '1px solid #333',
        borderRadius: '10px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        animation: 'followToastIn 0.2s ease-out',
      }}>
        <span style={{ color: '#fff', fontSize: '14px' }}>{message}</span>
        <Link href="/watchlist" style={{
          color: '#4ade80',
          fontSize: '14px',
          fontWeight: '600',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          View Watchlist →
        </Link>
      </div>
      <style>{`
        @keyframes followToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
