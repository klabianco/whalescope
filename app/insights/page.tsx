import Link from 'next/link';
import { getAllInsights } from '../lib/insights';
import { Header } from '../components/Header';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function InsightsPage() {
  const insights = getAllInsights();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>
      <Header />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 48px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '700', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Market Insights
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#888', 
            maxWidth: '600px', 
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            Daily analysis connecting whale movements and congressional trades. 
            AI-generated insights to help you see what smart money sees.
          </p>
        </div>

        {/* Insights Grid */}
        {insights.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '64px 24px',
            background: '#111118',
            borderRadius: '16px',
            border: '1px solid #222',
          }}>
            <p style={{ color: '#666', fontSize: '18px' }}>
              No insights published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
          }}>
            {insights.map((insight) => (
              <Link
                key={insight.slug}
                href={`/insights/${insight.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <article style={{
                  background: '#111118',
                  border: '1px solid #222',
                  borderRadius: '16px',
                  padding: '28px',
                  height: '100%',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}>
                  {/* Date and Read Time */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#666',
                  }}>
                    <span>{formatDate(insight.date)}</span>
                    <span>{insight.readTime} min read</span>
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '12px',
                    lineHeight: '1.4',
                  }}>
                    {insight.title}
                  </h2>

                  {/* Preview */}
                  <p style={{
                    fontSize: '14px',
                    color: '#888',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                  }}>
                    {insight.preview}
                  </p>

                  {/* Author */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '16px',
                    borderTop: '1px solid #1a1a1a',
                  }}>
                    <span style={{ fontSize: '20px' }}>🤖</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      by {insight.author}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div style={{
          marginTop: '64px',
          padding: '40px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #111118 100%)',
          borderRadius: '16px',
          border: '1px solid #222',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>
            Get Real-Time Alerts
          </h3>
          <p style={{ color: '#888', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            Pro subscribers get instant notifications when whales move and politicians trade.
          </p>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              background: '#fff',
              color: '#000',
              padding: '12px 32px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            View Pro Plans
          </Link>
        </div>
      </main>
    </div>
  );
}
