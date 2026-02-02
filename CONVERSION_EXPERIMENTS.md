# Conversion Experiments - A/B Test Plans

## Quick Toggle: Hero CTA Variants

### Current: Email Capture First (LIVE)
```tsx
// In app/page.tsx, hero section has email capture above the fold
<EmailCapture
  source="homepage-hero"
  headline=""
  subtext=""
  buttonText="Get Free Alerts"
  compact={true}
/>
```

### Test Variant: Show Trades First
Replace the EmailCapture component in the hero with:

```tsx
{/* Browse-first CTA - let them see value before capturing email */}
<div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
  <Link href="/whales" style={{
    background: '#22c55e',
    color: '#000',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
  }}>
    See Latest Whale Moves →
  </Link>
  <Link href="/congress" style={{
    background: '#18181b',
    color: '#fff',
    border: '1px solid #333',
    padding: '14px 32px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
  }}>
    See Politician Trades →
  </Link>
</div>
<p style={{ color: '#666', fontSize: '13px', textAlign: 'center' }}>
  Free to browse. Sign up for alerts anytime.
</p>
```

**Hypothesis:** Users need to see real trades before trusting us with their email. Let them explore first, capture via exit intent modal or bottom CTA.

**How to test:**
1. Comment out current EmailCapture in hero
2. Paste in the browse-first CTAs above
3. Deploy
4. Watch GoatCounter: email_signup events from homepage-hero vs exit-intent vs homepage-bottom
5. Run for 3-7 days or until statistical significance

---

## Experiment Timeline

### ✅ Shipped (Feb 2, 2026)
1. Better hero copy - "Know what smart money is doing before the pump"
2. Trust signals - "Data from Helius RPC + Congressional filings"
3. Live timestamps - "🔴 Live" for fresh trades
4. Testimonials section - social proof from realistic traders
5. You vs Smart Money - FOMO comparison on pricing page
6. Exit intent modal - last-chance capture with immediate value offer

### 🔄 Ready to Test
- Hero CTA variant (show trades first vs email capture first)
- Track pricing page engagement with new FOMO section

### 📋 Backlog
- Video/GIF demo of value loop (whale buys → alert → pump)
- Scroll depth tracking for bottom email CTA
- Mobile-optimized testimonial cards
- "Recent alerts" ticker at top of page showing real-time activity

---

## Metrics to Track

Add these event tracking calls:

```tsx
// In lib/tracking.ts, add:
export function trackHeroCTAClick(destination: string) {
  if (typeof window !== 'undefined' && (window as any).goatcounter) {
    (window as any).goatcounter.count({
      path: `events/hero_cta_click/${destination}`,
      event: true
    });
  }
}

export function trackPricingEngagement(section: string) {
  if (typeof window !== 'undefined' && (window as any).goatcounter) {
    (window as any).goatcounter.count({
      path: `events/pricing_engagement/${section}`,
      event: true
    });
  }
}
```

Then track:
- Hero CTA clicks: `/whales`, `/congress`, `/pricing`
- Exit intent modal: show, submit, dismiss
- Pricing page scrolls: past hero, past comparison, past tiers, to FAQ
- Email signup source: `homepage-hero`, `homepage-bottom`, `exit-intent`, `pricing`

---

## Success Criteria

**Current baseline:** 1.2% email signup rate (6/511)

**Target:** 5% email signup rate (25/500)

**Secondary metrics:**
- Pricing page views: currently 1.6% (8/511) → target 5%+
- Time on site: measure engagement depth
- /whales or /congress visit rate from homepage

**Decision threshold:** Run variant for 500+ visits or 7 days, whichever comes first. Switch to winning variant if >20% improvement in email signups.
