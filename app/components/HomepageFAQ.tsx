'use client';

import { useState } from 'react';

/**
 * FAQ accordion for homepage
 * Addresses common objections and questions
 */

export function HomepageFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How is this legal?',
      a: 'Congress members must publicly file all stock trades (STOCK Act of 2012). Whale transactions are on public blockchains. We aggregate public data—nothing hidden or insider.',
    },
    {
      q: 'Why not just watch Twitter?',
      a: 'By the time trades hit Twitter, the price already moved. We alert you within seconds of on-chain confirmation. You act before the crowd.',
    },
    {
      q: 'Is the free tier actually useful?',
      a: 'Yes—you get full access to all trades, just 24 hours delayed. Perfect for learning and backtesting. Upgrade to Pro when you want real-time alerts.',
    },
    {
      q: 'Do politicians really beat the market?',
      a: "Studies show Congress members consistently outperform S&P 500. Pelosi's 2023 portfolio returned 65% vs market's 24%. Make of that what you will.",
    },
  ];

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto 60px',
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '32px',
        color: '#fff',
      }}>
        Questions?
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={{
                width: '100%',
                padding: '20px 24px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{faq.q}</span>
              <span style={{
                fontSize: '20px',
                color: '#71717a',
                transition: 'transform 0.2s ease',
                transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                ↓
              </span>
            </button>
            
            {openIndex === i && (
              <div style={{
                padding: '0 24px 20px',
                color: '#a1a1aa',
                fontSize: '14px',
                lineHeight: '1.6',
                animation: 'fadeIn 0.2s ease',
              }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
