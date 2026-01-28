// Single source of truth for pricing
export const PRICING = {
  pro: {
    monthly: 24,
    yearly: 240,
  },
} as const;

// Computed values
export const PRICING_DISPLAY = {
  pro: {
    monthlyEquivalent: PRICING.pro.yearly / 12, // $20/mo when paid yearly
    yearlySavings: (PRICING.pro.monthly * 12) - PRICING.pro.yearly, // $48 saved
    monthsFree: 2,
  },
} as const;

// Plan keys for subscribe page
export const PLAN_PRICES: Record<string, number> = {
  pro_monthly: PRICING.pro.monthly,
  pro_yearly: PRICING.pro.yearly,
};
