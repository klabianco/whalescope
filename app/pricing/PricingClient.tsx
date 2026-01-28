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
  
  const proPrice = billing === 'yearly' ? 20 : 25; // USDC pricing (half of Nansen)
  const yearlyTotal = 240; // $240/year = $20/mo
  const monthlySavings = (25 * 12) - yearlyTotal; // Save $60/year

  return (
    <>
      <Header />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-block',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '8px',
            padding: '6px 16px',
            marginBottom: '16px'
          }}>
            <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px' }}>
              💰 SIMPLE PRICING
            </span>
          </div>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '700',
            marginBottom: '12px',
            background: 'linear-gradient(to right, #fff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            Track Smart Money. Trade Smarter.
          </h1>
          <p style={{ color: '#71717a', fontSize: '18px', maxWidth: '550px', margin: '0 auto 32px' }}>
            Follow the wallets that move markets. Get alerts when whales and politicians make their moves.
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
                cursor: 'pointer',
                transition: 'all 0.15s'
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
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Yearly
            </button>
            {billing === 'yearly' && (
              <span style={{ 
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Save ${monthlySavings}/yr
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
                Get started with basic whale tracking and congress trade data.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>$0</span>
                <span style={{ color: '#71717a', fontSize: '16px' }}>/month</span>
              </div>
              <p style={{ color: '#52525b', fontSize: '13px', marginTop: '4px' }}>Free forever</p>
            </div>

            <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '14px 24px',
                background: '#27272a',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '32px',
                transition: 'all 0.15s'
              }}>
                Get Started Free
              </button>
            </Link>

            <div style={{ borderTop: '1px solid #27272a', paddingTop: '24px' }}>
              <p style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                What&apos;s included
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Basic whale trade feed',
                  'Congress trades (24h delay)',
                  'Top 50 leaderboard',
                  'Token pages (basic data)',
                  '5 watchlist slots',
                  'Daily email digest',
                  'Solana chain only',
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
            background: 'linear-gradient(180deg, #14231a 0%, #09090b 100%)',
            border: '1px solid #22c55e40',
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 0 60px rgba(34, 197, 94, 0.1)'
          }}>
            {/* Popular Badge */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}>
              MOST POPULAR
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>
                Pro
              </h3>
              <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.5' }}>
                Real-time alerts, unlimited tracking, and full Smart Money data.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>${proPrice}</span>
                <span style={{ color: '#71717a', fontSize: '16px' }}>/month</span>
              </div>
              {billing === 'yearly' && (
                <p style={{ color: '#22c55e', fontSize: '13px', marginTop: '4px' }}>
                  ${yearlyTotal}/year billed annually
                </p>
              )}
            </div>

            <Link href={`/checkout?plan=${billing === 'yearly' ? 'pro_yearly' : 'pro_monthly'}`} style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '32px',
                transition: 'all 0.15s'
              }}>
                Pay with Crypto →
              </button>
            </Link>

            <div style={{ borderTop: '1px solid #27272a', paddingTop: '24px' }}>
              <p style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Everything in Free, plus
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Real-time trade alerts (Telegram, Discord)',
                  'Congress trades (real-time)',
                  'Full Smart Money labels',
                  'Whale PnL & performance data',
                  'Unlimited watchlist',
                  'Copy-trade notifications',
                  'Advanced filters (by PnL, whale type)',
                  'Full historical data (1yr+)',
                  'API access (1,000 calls/mo)',
                  'Multi-chain (ETH, Base, Arb)',
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

          {/* Enterprise Tier */}
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
                Enterprise
              </h3>
              <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.5' }}>
                For funds, trading desks, and teams that need custom solutions.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>Custom</span>
              </div>
              <p style={{ color: '#52525b', fontSize: '13px', marginTop: '4px' }}>Contact for pricing</p>
            </div>

            <button style={{
              width: '100%',
              padding: '14px 24px',
              background: '#27272a',
              color: '#fff',
              border: '1px solid #3f3f46',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '32px',
              transition: 'all 0.15s'
            }}>
              Contact Sales
            </button>

            <div style={{ borderTop: '1px solid #27272a', paddingTop: '24px' }}>
              <p style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Everything in Pro, plus
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Unlimited API access',
                  'Custom wallet labels',
                  'White-label options',
                  'Webhook integrations',
                  'Dedicated account manager',
                  'Custom data exports',
                  'SLA & uptime guarantees',
                  'Team seats & permissions',
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

        {/* Feature Comparison Table */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            textAlign: 'center', 
            marginBottom: '40px',
            color: '#fff'
          }}>
            Compare Plans
          </h2>

          <div style={{
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px 120px',
              padding: '20px 24px',
              background: '#18181b',
              borderBottom: '1px solid #27272a',
              gap: '16px'
            }}>
              <div style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Feature</div>
              <div style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Free</div>
              <div style={{ color: '#22c55e', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Pro</div>
              <div style={{ color: '#71717a', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Enterprise</div>
            </div>

            {/* Feature Rows */}
            {[
              { category: 'Data Access' },
              { feature: 'Whale trade feed', free: 'Basic', pro: 'Full', enterprise: 'Full' },
              { feature: 'Congress trades', free: '24h delay', pro: 'Real-time', enterprise: 'Real-time' },
              { feature: 'Smart Money labels', free: false, pro: true, enterprise: true },
              { feature: 'PnL performance data', free: false, pro: true, enterprise: true },
              { feature: 'Historical data', free: '30 days', pro: '1 year+', enterprise: 'Unlimited' },
              { feature: 'Chains supported', free: 'Solana', pro: 'Multi-chain', enterprise: 'All chains' },
              
              { category: 'Alerts & Tracking' },
              { feature: 'Watchlist slots', free: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
              { feature: 'Real-time alerts', free: false, pro: true, enterprise: true },
              { feature: 'Copy-trade alerts', free: false, pro: true, enterprise: true },
              { feature: 'Email digest', free: 'Daily', pro: 'Real-time', enterprise: 'Custom' },
              { feature: 'Telegram/Discord alerts', free: false, pro: true, enterprise: true },
              { feature: 'Webhook integrations', free: false, pro: false, enterprise: true },
              
              { category: 'Analytics' },
              { feature: 'Leaderboard access', free: 'Top 50', pro: 'Full', enterprise: 'Full' },
              { feature: 'Advanced filters', free: false, pro: true, enterprise: true },
              { feature: 'Token analytics', free: 'Basic', pro: 'Full', enterprise: 'Full' },
              { feature: 'Wallet profiler', free: 'Basic', pro: 'Full + PnL', enterprise: 'Full + PnL' },
              
              { category: 'API & Integrations' },
              { feature: 'API access', free: false, pro: '1K calls/mo', enterprise: 'Unlimited' },
              { feature: 'Custom labels', free: false, pro: false, enterprise: true },
              { feature: 'Data exports', free: false, pro: 'CSV', enterprise: 'Custom' },
              
              { category: 'Support' },
              { feature: 'Support level', free: 'Community', pro: 'Priority', enterprise: 'Dedicated' },
              { feature: 'SLA', free: false, pro: false, enterprise: true },
            ].map((row, i) => {
              if ('category' in row && row.category) {
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 120px 120px',
                    padding: '16px 24px',
                    background: '#18181b',
                    borderBottom: '1px solid #27272a',
                    gap: '16px'
                  }}>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{row.category}</div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                );
              }
              
              const renderValue = (value: boolean | string | undefined) => {
                if (value === undefined) return null;
                if (value === true) return <CheckIcon />;
                if (value === false) return <XIcon />;
                return <span style={{ color: '#a1a1aa', fontSize: '13px' }}>{value}</span>;
              };
              
              const featureRow = row as { feature: string; free: boolean | string; pro: boolean | string; enterprise: boolean | string };
              
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 120px 120px',
                  padding: '14px 24px',
                  borderBottom: '1px solid #1f1f23',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#a1a1aa', fontSize: '14px' }}>{featureRow.feature}</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>{renderValue(featureRow.free)}</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>{renderValue(featureRow.pro)}</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>{renderValue(featureRow.enterprise)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            textAlign: 'center', 
            marginBottom: '40px',
            color: '#fff'
          }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: 'Is there a free trial for Pro?',
                a: 'Yes! Start with a 7-day free trial of Pro. No credit card required. Cancel anytime.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept USDC and SOL on Solana. Pay directly from your wallet — no credit card needed.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. Cancel anytime from your account settings. No questions asked.'
              },
              {
                q: 'What chains do you support?',
                a: 'Free users get Solana. Pro users get Solana, Ethereum, Base, and Arbitrum. More chains coming soon.'
              },
              {
                q: 'How real-time are the alerts?',
                a: 'Pro alerts are sent within seconds of on-chain confirmation. Free users see trades with a 24-hour delay.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a full refund within 14 days of your first payment if you\'re not satisfied.'
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

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.02) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          marginTop: '80px'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
            Ready to track Smart Money?
          </h2>
          <p style={{ color: '#71717a', fontSize: '16px', marginBottom: '24px' }}>
            Join thousands of traders who use WhaleScope to stay ahead of the market.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Start Free Trial
              </button>
            </Link>
            <Link href="/smart-money" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 32px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #3f3f46',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Explore Dashboard
              </button>
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
