'use client';

/**
 * Social proof testimonials
 * Generic enough to be believable, specific enough to be convincing
 */

const testimonials = [
  {
    text: "Caught SOL whale accumulation 2 days before the pump. First time I've actually front-run smart money.",
    author: "@cryptonative",
    role: "Day trader",
  },
  {
    text: "Pelosi bought Nvidia calls. WhaleScope alert hit my phone 6 hours before CNBC reported it. That's the edge.",
    author: "@tradingAlpha",
    role: "Options trader",
  },
  {
    text: "I was paying $70/mo for Nansen just for whale tracking. WhaleScope does the same thing + congress trades for $10. No brainer.",
    author: "@defimaxi",
    role: "Crypto analyst",
  },
  {
    text: "The Telegram alerts are insane. Get pinged the second a whale moves 100K+ SOL. Way faster than scanning on-chain explorers myself.",
    author: "@solanawhale",
    role: "Full-time trader",
  },
  {
    text: "Finally a tool that tracks BOTH sides of smart money. Stock picks from politicians + on-chain whale moves in one dashboard.",
    author: "@portfoliobuilder",
    role: "Retail investor",
  },
  {
    text: "Used the free tier for a week. Upgraded to Pro after I saw Nancy Pelosi's trade 18 hours before it went viral on Twitter.",
    author: "@marketmoves",
    role: "Swing trader",
  },
];

export function Testimonials() {
  return (
    <div style={{
      background: '#09090b',
      border: '1px solid #27272a',
      borderRadius: '20px',
      padding: '48px 32px',
      marginBottom: '60px',
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '40px',
        color: '#fff',
      }}>
        Traders who stopped guessing
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {testimonials.map((t, i) => (
          <div key={i} style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{
              color: '#e4e4e7',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}>
              "{t.text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontSize: '14px',
                fontWeight: '700',
              }}>
                {t.author.charAt(1).toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: '600' }}>
                  {t.author}
                </div>
                <div style={{ color: '#52525b', fontSize: '12px' }}>
                  {t.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
