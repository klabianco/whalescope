import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  wallet_address?: string;
  plan: 'free' | 'pro' | 'enterprise';
  telegram_chat_id?: string;
  discord_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  address: string;
  address_type: 'wallet' | 'token' | 'congress';
  label?: string;
  notify_telegram: boolean;
  notify_discord: boolean;
  notify_email: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  watchlist_id: string;
  trade_hash: string;
  sent_at: string;
  channel: 'telegram' | 'discord' | 'email';
}
