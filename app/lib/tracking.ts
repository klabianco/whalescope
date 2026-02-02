// Conversion funnel tracking via GoatCounter custom events
// Events: pricing_view, start_pro_click, subscribe_view, wallet_connect, payment_start, payment_success, email_signup

declare global {
  interface Window {
    goatcounter?: {
      count: (opts: { path: string; title?: string; event?: boolean }) => void;
    };
  }
}

export function trackEvent(event: string, label?: string) {
  try {
    if (typeof window !== 'undefined' && window.goatcounter?.count) {
      window.goatcounter.count({
        path: `events/${event}${label ? `/${label}` : ''}`,
        title: event,
        event: true,
      });
    }
  } catch {
    // Silently fail — tracking should never break the app
  }
}

// Convenience helpers
export const trackPricingView = () => trackEvent('pricing_view');
export const trackStartProClick = (plan: string) => trackEvent('start_pro_click', plan);
export const trackSubscribeView = (plan: string) => trackEvent('subscribe_view', plan);
export const trackWalletConnect = () => trackEvent('wallet_connect');
export const trackPaymentStart = (plan: string) => trackEvent('payment_start', plan);
export const trackPaymentSuccess = (plan: string) => trackEvent('payment_success', plan);
export const trackEmailSignup = (source: string) => trackEvent('email_signup', source);

// Conversion experiments tracking
export const trackHeroCTAClick = (destination: string) => trackEvent('hero_cta_click', destination);
export const trackExitIntentShow = () => trackEvent('exit_intent', 'show');
export const trackExitIntentDismiss = () => trackEvent('exit_intent', 'dismiss');
export const trackPricingEngagement = (section: string) => trackEvent('pricing_engagement', section);
