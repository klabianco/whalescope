'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { trackStickyCTAShow, trackStickyCTAClick } from '../lib/tracking';

/**
 * Sticky CTA that appears after user scrolls past hero
 * Shows minimal email capture or "Get Alerts" button
 * Hides when user is near footer or email CTAs
 */

export function StickyCTA() {
  const [show, setShow] = useState(false);
  const hasTrackedShow = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show after scrolling 800px (past hero)
      const pastHero = scrollY > 800;
      
      // Hide when near bottom (within 500px of footer)
      const nearBottom = scrollY + windowHeight > documentHeight - 500;
      
      const shouldShow = pastHero && !nearBottom;
      setShow(shouldShow);
      
      // Track when CTA first becomes visible
      if (shouldShow && !hasTrackedShow.current) {
        trackStickyCTAShow();
        hasTrackedShow.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      animation: 'slideUp 0.3s ease-out',
    }}>
      <Link href="/pricing" onClick={trackStickyCTAClick} style={{ textDecoration: 'none' }}>
        <button style={{
          padding: '14px 28px',
          background: '#22c55e',
          color: '#000',
          border: 'none',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          🔔 Get Alerts
        </button>
      </Link>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 640px) {
          .sticky-cta-wrapper {
            bottom: 10px !important;
            right: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
