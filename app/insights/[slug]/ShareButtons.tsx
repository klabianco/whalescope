'use client';

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const articleUrl = `https://whalescope.app/insights/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(articleUrl);
  };

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: '#111118',
          border: '1px solid #222',
          borderRadius: '8px',
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px',
        }}
      >
        𝕏 Share
      </a>
      <button
        onClick={copyToClipboard}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: '#111118',
          border: '1px solid #222',
          borderRadius: '8px',
          color: '#888',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        📋 Copy Link
      </button>
    </div>
  );
}
