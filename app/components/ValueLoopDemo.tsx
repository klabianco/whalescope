'use client';

/**
 * Animated visual demo showing the WhaleScope value loop
 * Whale trade → Alert → You act → Profit
 * 
 * Pure CSS animation, no video needed
 */

export function ValueLoopDemo() {
  return (
    <div style={{
      background: '#09090b',
      border: '1px solid #27272a',
      borderRadius: '20px',
      padding: '48px 32px',
      marginBottom: '60px',
      textAlign: 'center',
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        marginBottom: '12px',
        color: '#fff',
      }}>
        How it works
      </h2>
      <p style={{
        color: '#71717a',
        fontSize: '15px',
        marginBottom: '40px',
        maxWidth: '500px',
        margin: '0 auto 40px',
      }}>
        Whale makes a move. You get alerted. You act before the crowd.
      </p>

      {/* Visual demo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Step 1: Whale Trade */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            animation: 'scaleIn 1s ease-out infinite',
          }}>
            🐋
          </div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Whale buys 500K SOL
          </h3>
          <p style={{ color: '#71717a', fontSize: '13px', lineHeight: '1.5' }}>
            Smart money makes a move on-chain
          </p>
        </div>

        {/* Arrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#52525b',
          fontSize: '24px',
        }}>
          →
        </div>

        {/* Step 2: Alert */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            animation: 'pulse 2s ease-in-out 0.5s infinite',
          }}>
            🔔
          </div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            You get alerted
          </h3>
          <p style={{ color: '#71717a', fontSize: '13px', lineHeight: '1.5' }}>
            Notification hits your phone in 30 seconds
          </p>
        </div>

        {/* Arrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#52525b',
          fontSize: '24px',
        }}>
          →
        </div>

        {/* Step 3: Profit */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            animation: 'bounce 2s ease-in-out 1s infinite',
          }}>
            📈
          </div>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Token pumps 10x
          </h3>
          <p style={{ color: '#71717a', fontSize: '13px', lineHeight: '1.5' }}>
            You bought early. The crowd is late.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: '48px' }}>
        <a href="/pricing" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '14px 32px',
            background: '#22c55e',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            Start Getting Alerts
          </button>
        </a>
      </div>

      <style>{`
        @keyframes scaleIn {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          50% { opacity: 0.8; box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (max-width: 768px) {
          .ws-value-loop-grid { grid-template-columns: 1fr !important; }
          .ws-value-loop-grid > div:nth-child(2),
          .ws-value-loop-grid > div:nth-child(4) {
            transform: rotate(90deg);
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
