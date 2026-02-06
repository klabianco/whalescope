import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInsightBySlug, getAllSlugs } from '../../lib/insights';
import { Header } from '../../components/Header';
import { ShareButtons } from './ShareButtons';

// Generate static paths for all articles
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
  let html = content;
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 28px 0 12px; color: #fff;">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 style="font-size: 22px; font-weight: 600; margin: 36px 0 16px; color: #fff;">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 style="font-size: 28px; font-weight: 700; margin: 40px 0 20px; color: #fff;">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-weight: 600;">$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code style="background: #1a1a2e; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px;">$1</code>');
  
  // Unordered lists
  html = html.replace(/^- (.*$)/gm, '<li style="margin: 8px 0; padding-left: 8px;">$1</li>');
  html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin: 16px 0; padding-left: 24px; list-style-type: disc;">$&</ul>');
  
  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gm, '<li style="margin: 8px 0; padding-left: 8px;">$1</li>');
  
  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #222; margin: 32px 0;" />');
  
  // Paragraphs - wrap remaining text blocks
  const lines = html.split('\n\n');
  html = lines.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return block; // Already HTML
    return `<p style="margin: 16px 0; line-height: 1.8; color: #aaa;">${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  
  return html;
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getInsightBySlug(slug);

  if (!article) {
    notFound();
  }

  const contentHtml = renderMarkdown(article.content);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff' }}>
      <Header />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 64px' }}>
        {/* Back Link */}
        <Link
          href="/insights"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '32px',
          }}
        >
          ← Back to Insights
        </Link>

        {/* Article Header */}
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            lineHeight: '1.3',
            marginBottom: '20px',
            color: '#fff',
          }}>
            {article.title}
          </h1>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px',
            color: '#666',
            fontSize: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <span>by {article.author}</span>
            </div>
            <span>•</span>
            <span>{formatDate(article.date)}</span>
            <span>•</span>
            <span>{article.readTime} min read</span>
          </div>
        </header>

        {/* Article Content */}
        <article
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
          }}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Share Section */}
        <div style={{
          marginTop: '48px',
          paddingTop: '32px',
          borderTop: '1px solid #222',
        }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Share this analysis:
          </p>
          <ShareButtons title={article.title} slug={article.slug} />
        </div>

        {/* More Insights CTA */}
        <div style={{
          marginTop: '48px',
          padding: '32px',
          background: '#111118',
          borderRadius: '16px',
          border: '1px solid #222',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            Want More Analysis?
          </h3>
          <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>
            Pro subscribers get daily insights delivered to their inbox plus real-time trade alerts.
          </p>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              background: '#fff',
              color: '#000',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Upgrade to Pro
          </Link>
        </div>
      </main>
    </div>
  );
}
