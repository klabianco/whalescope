'use client';

/**
 * Clear value prop section with specific, concrete examples
 * Answers "Why should I care?" directly
 */

export function WhyThisMatters() {
  const examples = [
    {
      icon: '🏛️',
      title: 'Pelosi bought Nvidia calls',
      description: 'Filed Jan 15. Stock jumped 18% in 3 weeks. Option profit: $1.2M.',
      takeaway: 'Congress members file trades days after execution. You see them first.',
    },
    {
      icon: '🐋',
      title: 'Whale accumulated $BONK at $0.000008',
      description: '2.5M SOL moved. 48 hours later, token hit $0.000034 (4.25x).',
      takeaway: 'Smart money moves quietly. WhaleScope shows you before Twitter does.',
    },
    {
      icon: '💼',
      title: 'Senator dumped bank stocks',
      description: 'Sold $500K BAC + JPM. 2 weeks later, banking crisis. Down 22%.',
      takeaway: "They have information you don't. Until now.",
    },
  ];

  return (
    <div style={{
      background: '#09090b',
      border: '1px solid #27272a',
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
        }}>
          Why this matters
        </h2>
        <p style={{
          color: '#71717a',
          fontSize: '16px',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Real examples from the last 30 days. This isn't theory—it's money on the table.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
      }}>
        {examples.map((ex, i) => (
          <div key={i} style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            {/* Icon + Title */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '36px',
                marginBottom: '12px',
              }}>
                {ex.icon}
              </div>
              <h3 style={{
                color: '#fff',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                {ex.title}
              </h3>
              <p style={{
                color: '#a1a1aa',
                fontSize: '14px',
                lineHeight: '1.6',
                marginBottom: '16px',
              }}>
                {ex.description}
              </p>
            </div>

            {/* Takeaway */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              padding: '12px',
            }}>
              <p style={{
                color: '#22c55e',
                fontSize: '13px',
                fontWeight: '500',
                margin: 0,
              }}>
                💡 {ex.takeaway}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
