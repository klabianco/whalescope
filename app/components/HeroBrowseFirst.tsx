'use client';

import Link from 'next/link';
import { trackHeroCTAClick } from '../lib/tracking';

/**
 * A/B Test Variant: Browse-First Hero CTA
 * 
 * Replace EmailCapture in hero with this component to test:
 * "Show trades first" vs "Email capture first"
 * 
 * Hypothesis: Users need to see value before giving email.
 * Let them explore, capture via exit intent or bottom CTA.
 */

export function HeroBrowseFirst() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto 24px' }}>
      {/* Explainer text */}
      <p style={{ 
        color: '#888', 
        fontSize: '14px', 
        textAlign: 'center', 
        marginBottom: '16px',
        lineHeight: '1.5'
      }}>
        <strong style={{ color: '#22c55e' }}>Free to browse.</strong> See real trades happening now. Sign up for alerts anytime.
      </p>

      {/* Primary CTAs */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '12px', 
        flexWrap: 'wrap',
        marginBottom: '12px'
      }}>
        <Link 
          href="/whales" 
          onClick={() => trackHeroCTAClick('whales')}
          style={{
            background: '#22c55e',
            color: '#000',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-block',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          }}
        >
          See Latest Whale Moves →
        </Link>
        <Link 
          href="/congress" 
          onClick={() => trackHeroCTAClick('congress')}
          style={{
            background: '#18181b',
            color: '#fff',
            border: '1px solid #333',
            padding: '14px 32px',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          See Politician Trades →
        </Link>
      </div>

      {/* Secondary CTA - Pricing */}
      <div style={{ textAlign: 'center' }}>
        <Link 
          href="/pricing" 
          onClick={() => trackHeroCTAClick('pricing')}
          style={{
            color: '#60a5fa',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          Want real-time alerts? See pricing →
        </Link>
      </div>
    </div>
  );
}
