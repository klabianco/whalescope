'use client';

import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface FAQ {
  q: string;
  a: string | JSX.Element;
  category: 'congress' | 'crypto' | 'product' | 'legal';
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filter, setFilter] = useState<string>('all');

  const faqs: FAQ[] = [
    // Congress / Legal
    {
      category: 'congress',
      q: 'Is it legal for Congress to do insider trading?',
      a: (
        <div>
          <p style={{ marginBottom: '12px' }}>
            <strong>Technically no.</strong> The STOCK Act of 2012 made it illegal for members of Congress to trade on non-public information obtained through their official duties.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>In practice?</strong> Enforcement is nearly non-existent:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
            <li>The penalty for late disclosure is just <strong>$200</strong></li>
            <li>Proving someone traded on "insider information" is extremely difficult</li>
            <li>The DOJ rarely pursues cases against sitting members</li>
            <li>Many trades happen through "blind trusts" that aren't actually blind</li>
          </ul>
          <p style={{ marginBottom: '12px' }}>
            Since the STOCK Act passed, only a handful of members have faced any consequences -- and those were for late filings, not insider trading itself.
          </p>
          <p>
            <strong>The result:</strong> Congress members consistently outperform the market. Exposed members' portfolios beat the S&P 500 by 6% annually on average. Legal or not, the trades are public record -- and that's what WhaleScope tracks.
          </p>
        </div>
      ),
    },
    {
      category: 'congress',
      q: 'Do politicians really beat the market?',
      a: "Multiple academic studies confirm it. A 2004 study found Senators beat the market by 12% annually. More recent data shows Congress members consistently outperform indexes. Pelosi's 2023 portfolio returned 65% vs the S&P's 24%. Whether it's skill, luck, or information advantage -- the pattern is clear.",
    },
    {
      category: 'congress',
      q: 'How quickly do Congress trades become public?',
      a: "By law, members must disclose trades within 45 days. Many file much faster. We pull from official House and Senate disclosures as soon as they're filed. Pro members get alerts within minutes of new filings appearing.",
    },
    {
      category: 'congress',
      q: 'Can I actually copy Congress trades profitably?',
      a: "The 45-day disclosure window means you're often late to the party. But patterns matter: if multiple members buy the same stock before major legislation, that's a signal. WhaleScope's AI analysis highlights these clusters so you can act on the pattern, not chase individual trades.",
    },
    
    // Crypto
    {
      category: 'crypto',
      q: 'How do you identify whale wallets?',
      a: "We curate wallets based on historical performance, on-chain activity patterns, and known entity associations. Our list of 50 tracked wallets includes top DeFi traders, early token buyers, and wallets linked to funds. We verify performance before adding any wallet.",
    },
    {
      category: 'crypto',
      q: 'Are crypto whale trades legal to track?',
      a: "Yes. All blockchain transactions are public by design. We're reading the same data anyone can see on-chain -- we just make it faster and easier to understand. No private information involved.",
    },
    {
      category: 'crypto',
      q: 'How fast are the crypto alerts?',
      a: "Pro members get alerts within seconds of on-chain confirmation. By the time trades hit Twitter or Discord alpha groups, you've already seen it.",
    },

    // Product
    {
      category: 'product',
      q: 'What do I get with the free tier?',
      a: "Full access to all trade data, but 24 hours delayed. Perfect for research, backtesting, and learning the patterns. You see everything Pro members see -- just a day later.",
    },
    {
      category: 'product',
      q: 'Is WhaleScope month-to-month?',
      a: "Yes. Pro is $24/month, cancel anytime. No annual commitment required. We also offer $240/year if you want to save.",
    },
    {
      category: 'product',
      q: 'What alert channels do you support?',
      a: "Telegram, Discord, email, and browser push notifications. Set up whichever works for your workflow -- or all of them.",
    },
    {
      category: 'product',
      q: 'Why WhaleScope vs asking Grok or ChatGPT?',
      a: "Three reasons: Speed (we alert in seconds, not when you remember to ask), Curation (50 proven whale wallets vs random addresses), and Analysis (AI explains WHY trades matter, not just what happened). Grok is a search engine. WhaleScope is a Bloomberg terminal for smart money.",
    },

    // Legal
    {
      category: 'legal',
      q: 'How is WhaleScope legal?',
      a: "We aggregate publicly available data. Congress trades come from official STOCK Act filings (public record). Crypto trades come from public blockchains. We don't access any private or insider information -- we just make public data actionable.",
    },
    {
      category: 'legal',
      q: 'Is this financial advice?',
      a: "No. WhaleScope is an information tool. We show you what politicians and whales are trading. What you do with that information is your decision. Always do your own research.",
    },
  ];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'congress', label: 'Congress' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'product', label: 'Product' },
    { id: 'legal', label: 'Legal' },
  ];

  const filtered = filter === 'all' ? faqs : faqs.filter(f => f.category === filter);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)',
      color: '#fff',
    }}>
      <Header />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 60px' }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '700', 
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          Frequently Asked Questions
        </h1>
        
        <p style={{ 
          color: '#71717a', 
          textAlign: 'center', 
          marginBottom: '32px',
          fontSize: '16px',
        }}>
          Everything you need to know about tracking smart money
        </p>

        {/* Category filters */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '32px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setFilter(cat.id);
                setOpenIndex(null);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: filter === cat.id ? '#3b82f6' : '#27272a',
                color: filter === cat.id ? '#fff' : '#a1a1aa',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((faq, i) => (
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
                  gap: '16px',
                }}
              >
                <span>{faq.q}</span>
                <span style={{
                  fontSize: '20px',
                  color: '#71717a',
                  transition: 'transform 0.2s ease',
                  transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}>
                  ↓
                </span>
              </button>
              
              {openIndex === i && (
                <div style={{
                  padding: '0 24px 20px',
                  color: '#a1a1aa',
                  fontSize: '15px',
                  lineHeight: '1.7',
                }}>
                  {typeof faq.a === 'string' ? faq.a : faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '48px',
          padding: '32px',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1e1e2e 100%)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            Still have questions?
          </h3>
          <p style={{ color: '#a1a1aa', marginBottom: '20px' }}>
            Reach out on X -- we respond to everyone.
          </p>
          <a
            href="https://x.com/WrenTheAI"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#fff',
              color: '#000',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            @WrenTheAI on X
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
