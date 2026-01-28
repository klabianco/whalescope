-- WhaleScope Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  wallet_address TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  telegram_chat_id TEXT,
  telegram_username TEXT,
  discord_user_id TEXT,
  api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  api_calls_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist table
CREATE TABLE public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  address_type TEXT DEFAULT 'wallet' CHECK (address_type IN ('wallet', 'token', 'congress')),
  label TEXT,
  notify_telegram BOOLEAN DEFAULT true,
  notify_discord BOOLEAN DEFAULT false,
  notify_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, address)
);

-- Subscriptions table (Crypto payments)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT DEFAULT 'pro' CHECK (plan IN ('pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_end TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'crypto',
  last_payment_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment intents (crypto)
CREATE TABLE public.payment_intents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro_monthly', 'pro_yearly')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USDC' CHECK (currency IN ('USDC', 'SOL')),
  memo TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  transaction_signature TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_intents_memo ON public.payment_intents(memo);
CREATE INDEX idx_payment_intents_user ON public.payment_intents(user_id);

-- Alert history (for deduplication)
CREATE TABLE public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE,
  trade_hash TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'discord', 'email')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trade_hash, channel)
);

-- Congress trade cache (for quick lookups)
CREATE TABLE public.congress_trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  politician_name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  amount_min NUMERIC,
  amount_max NUMERIC,
  trade_date DATE NOT NULL,
  disclosure_date DATE NOT NULL,
  trade_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram connection codes (for linking accounts)
CREATE TABLE public.telegram_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_connections_code ON public.telegram_connections(code);

-- Smart Money labels
CREATE TABLE public.smart_money_labels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT CHECK (category IN ('whale', 'fund', 'dex', 'cex', 'influencer', 'protocol', 'smart_money', 'degen')),
  pnl_30d NUMERIC,
  pnl_90d NUMERIC,
  pnl_total NUMERIC,
  win_rate NUMERIC,
  trade_count INTEGER DEFAULT 0,
  first_seen TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX idx_watchlists_address ON public.watchlists(address);
CREATE INDEX idx_alerts_user_trade ON public.alerts(user_id, trade_hash);
CREATE INDEX idx_congress_trades_date ON public.congress_trades(trade_date DESC);
CREATE INDEX idx_congress_trades_politician ON public.congress_trades(politician_name);
CREATE INDEX idx_smart_money_category ON public.smart_money_labels(category);
CREATE INDEX idx_smart_money_pnl ON public.smart_money_labels(pnl_30d DESC);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own watchlist" ON public.watchlists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Public read access for smart money labels
CREATE POLICY "Anyone can view smart money labels" ON public.smart_money_labels
  FOR SELECT USING (true);

-- Public read access for congress trades
CREATE POLICY "Anyone can view congress trades" ON public.congress_trades
  FOR SELECT USING (true);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check watchlist limits (free = 5, pro = unlimited)
CREATE OR REPLACE FUNCTION public.check_watchlist_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  current_count INTEGER;
BEGIN
  SELECT plan INTO user_plan FROM public.profiles WHERE id = NEW.user_id;
  
  IF user_plan = 'free' THEN
    SELECT COUNT(*) INTO current_count FROM public.watchlists WHERE user_id = NEW.user_id;
    IF current_count >= 5 THEN
      RAISE EXCEPTION 'Free plan limited to 5 watchlist items. Upgrade to Pro for unlimited.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_watchlist_limit_trigger
  BEFORE INSERT ON public.watchlists
  FOR EACH ROW EXECUTE FUNCTION public.check_watchlist_limit();
