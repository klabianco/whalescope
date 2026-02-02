'use client';

import { trackPricingEngagement } from '../lib/tracking';

/**
 * Comparison showing what you miss without real-time data
 * Designed to create FOMO and justify the Pro upgrade
 */

export function YouVsSmartMoney() {
  const scenarios = [
    {
      scenario: "Whale buys 500K SOL of new memecoin",
      withoutPro: "You see it 24 hours later on Twitter",
      withPro: "Alert hits your phone in 30 seconds",
      outcome: "10x already happened. You missed it.",
    },
    {
      scenario: "Senator sells $2M NVDA before bad earnings",
      withoutPro: "You find out 2 weeks later when filing goes public",
      withPro: "Email alert same day the trade happens",
      outcome: "Stock drops 15%. You held the bag.",
    },
    {
      scenario: "Top wallet accumulates unknown Solana token",
      withoutPro: "You discover it after 500% pump on your feed",
      withPro: "Real-time alert shows accumulation pattern early",
      outcome: "Entry at $0.05 vs $2.50. 50x less upside.",
    },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #0f1f17 100%)',
      border: '1px solid #1e3a2f',
      borderRadius: '20px',
      padding: '48px 32px',
      marginBottom: '60px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '12px',
          color: '#fff',
          letterSpacing: '-0.5px',
        }}>
          You vs Smart Money
        </h2>
        <p style={{ color: '#71717a', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          Every minute you wait is money left on the table. Here's what 24-hour delays actually cost.
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        {scenarios.map((s, i) => (
          <div key={i} style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {/* Scenario header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #27272a',
            }}>
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                {s.scenario}
              </h3>
            </div>

            {/* Comparison grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1px',
              background: '#27272a',
            }}>
              {/* Without Pro */}
              <div style={{ background: '#18181b', padding: '20px 24px' }}>
                <div style={{
                  color: '#71717a',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  ❌ Free (24h delay)
                </div>
                <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  {s.withoutPro}
                </p>
              </div>

              {/* With Pro */}
              <div style={{ background: '#18181b', padding: '20px 24px' }}>
                <div style={{
                  color: '#22c55e',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  ✅ Pro (Real-time)
                </div>
                <p style={{ color: '#e4e4e7', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  {s.withPro}
                </p>
              </div>
            </div>

            {/* Outcome */}
            <div style={{
              padding: '16px 24px',
              background: '#7f1d1d20',
              borderTop: '1px solid #7f1d1d40',
            }}>
              <p style={{
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: '500',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '16px' }}>💸</span>
                <span>{s.outcome}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: '#71717a', fontSize: '15px', marginBottom: '16px' }}>
          Stop trading blind. Get the same data the smart money uses.
        </p>
        <a href="#pricing" style={{ textDecoration: 'none' }}>
          <button
            onClick={() => trackPricingEngagement('you_vs_smart_money_cta')}
            style={{
              padding: '14px 32px',
              background: '#22c55e',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            See Pro Plans
          </button>
        </a>
      </div>
    </div>
  );
}
