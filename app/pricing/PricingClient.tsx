'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

type BillingPeriod = 'monthly' | 'yearly';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <path d="M16.667 5L7.5 14.167 3.333 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <path d="M15 5L5 15M5 5l10 10" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function PricingClient() {
  const [billing, setBilling] = useState<BillingPeriod>('yearly');

  return (
    <>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '700',
            marginBottom: '12px',
            color: '#fff',
            letterSpacing: '-1px'
          }}>
            All of WhaleScope. One simple plan.
          </h1>
          <p style={{ color: '#71717a', fontSize: '18px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Track smart money for a fraction of the cost. No complex tiers.
          </p>

          {/* Billing Toggle */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            gap: '12px',
            background: '#18181b',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid #27272a'
          }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '10px 24px',
                background: billing === 'monthly' ? '#27272a' : 'transparent',
                color: billing === 'monthly' ? '#fff' : '#71717a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              style={{
                padding: '10px 24px',
                background: billing === 'yearly' ? '#27272a' : 'transparent',
                color: billing === 'yearly' ? '#fff' : '#71717a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Yearly
            </button>
            {billing === 'yearly' && (
              <span style={{ 
                background: '#22c55e',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                2 months free
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          marginBottom: '80px'
        }}>
          {/* Free Tier */}
          <div style={{
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>
                Free
              </h3>
              <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.5' }}>
                For explorers getting started with on-chain analytics.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>$0</span>
                <span style={{ color: '#71717a', fontSize: '16px' }}>/month</span>
              </div>
            </div>

            <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '14px 24px',
                background: '#27272a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '32px'
              }}>
                Start for Free
              </button>
            </Link>

            <div>
              <p style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                What you get
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Basic whale trade feed',
                  'Congress trades (24h delay)',
                  'Top 50 leaderboard',
                  '5 watchlist slots',
                  'Solana only',
                ].map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa', fontSize: '14px' }}>
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro Tier */}
          <div style={{
            background: 'linear-gradient(180deg, #0f1f17 0%, #09090b 100%)',
            border: '1px solid #22c55e40',
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>
                Pro
              </h3>
              <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.5' }}>
                For traders who need real-time data and alerts.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>
                  ${billing === 'yearly' ? '15' : '19'}
                </span>
                <span style={{ color: '#71717a', fontSize: '16px' }}>/month</span>
              </div>
              {billing === 'yearly' && (
                <p style={{ color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>
                  $150/year billed annually
                </p>
              )}
            </div>

            <Link href={`/subscribe?plan=${billing === 'yearly' ? 'pro_yearly' : 'pro_monthly'}`} style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '14px 24px',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '32px'
              }}>
                Start with Pro
              </button>
            </Link>

            <div>
              <p style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                Everything in Free, plus
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Real-time trade alerts',
                  'Congress trades (real-time)',
                  'Full Smart Money labels',
                  'Whale PnL & performance',
                  'Unlimited watchlist',
                  'Telegram & Discord alerts',
                  'Multi-chain (ETH, Base, Arb)',
                  'API access (1K calls/mo)',
                  'Priority support',
                ].map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a1a1aa', fontSize: '14px' }}>
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison to Nansen */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '80px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
            WhaleScope vs Nansen
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 140px',
            gap: '16px'
          }}>
            {/* Header */}
            <div style={{ color: '#71717a', fontSize: '13px', fontWeight: '600' }}></div>
            <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>WhaleScope Pro</div>
            <div style={{ color: '#71717a', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>Nansen Pro</div>
            
            {/* Price */}
            <div style={{ color: '#a1a1aa', fontSize: '14px', padding: '12px 0', borderTop: '1px solid #27272a' }}>Monthly price</div>
            <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', textAlign: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}>$19/mo</div>
            <div style={{ color: '#71717a', fontSize: '14px', textAlign: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}>$49/mo</div>
            
            {/* Annual */}
            <div style={{ color: '#a1a1aa', fontSize: '14px', padding: '12px 0', borderTop: '1px solid #27272a' }}>Annual price</div>
            <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', textAlign: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}>$150/yr</div>
            <div style={{ color: '#71717a', fontSize: '14px', textAlign: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}>$588/yr</div>

            {/* Features */}
            <div style={{ color: '#a1a1aa', fontSize: '14px', padding: '12px 0', borderTop: '1px solid #27272a' }}>Congress trades</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><CheckIcon /></div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><XIcon /></div>

            <div style={{ color: '#a1a1aa', fontSize: '14px', padding: '12px 0', borderTop: '1px solid #27272a' }}>Smart Money labels</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><CheckIcon /></div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><CheckIcon /></div>

            <div style={{ color: '#a1a1aa', fontSize: '14px', padding: '12px 0', borderTop: '1px solid #27272a' }}>Real-time alerts</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><CheckIcon /></div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><CheckIcon /></div>

            <div style={{ color: '#a1a1aa', fontSize: '14px', padding: '12px 0', borderTop: '1px solid #27272a' }}>Pay with crypto</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><CheckIcon /></div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}><CheckIcon /></div>

            {/* Savings */}
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', padding: '12px 0', borderTop: '1px solid #27272a' }}>Your savings</div>
            <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '700', textAlign: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}>$438/yr</div>
            <div style={{ color: '#71717a', fontSize: '14px', textAlign: 'center', padding: '12px 0', borderTop: '1px solid #27272a' }}>—</div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            textAlign: 'center', 
            marginBottom: '32px',
            color: '#fff'
          }}>
            FAQ
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: 'What payment methods do you accept?',
                a: 'We accept USDC and SOL on Solana. Pay directly from your wallet.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel anytime from your account. No questions asked.'
              },
              {
                q: 'How real-time are the alerts?',
                a: 'Pro alerts are sent within seconds of on-chain confirmation.'
              },
              {
                q: 'Do you have a free trial?',
                a: 'The Free tier is always free. Try Pro risk-free with a 7-day trial.'
              },
            ].map((faq, i) => (
              <div key={i} style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px 24px'
              }}>
                <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>
                  {faq.q}
                </h4>
                <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
