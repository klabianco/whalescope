# WhaleScope Pro Setup Guide

This guide walks through setting up all the Pro features.

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`
3. Run the schema in SQL Editor:
   ```bash
   cat supabase/schema.sql | pbcopy
   ```
   Paste in Supabase SQL Editor and run.

## 2. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from Dashboard → Developers → API Keys:
   - Secret key → `STRIPE_SECRET_KEY`
3. Create Products:
   - Go to Products → Add Product
   - Name: "WhaleScope Pro"
   - Create two prices:
     - Monthly: $39/month → copy price ID → `STRIPE_PRICE_PRO_MONTHLY`
     - Yearly: $29/month ($348/year) → copy price ID → `STRIPE_PRICE_PRO_YEARLY`
4. Set up webhook:
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 3. Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow prompts
3. Copy the token → `TELEGRAM_BOT_TOKEN`
4. Set bot commands:
   ```
   /setcommands
   start - Connect your WhaleScope account
   status - Check subscription status
   mute - Pause alerts
   unmute - Resume alerts
   help - Show available commands
   ```
5. Run the bot:
   ```bash
   npm run telegram-bot
   ```
   Or deploy as a webhook for production.

## 4. Vercel Deployment

1. Push to GitHub
2. Import to Vercel at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables in Vercel dashboard
4. Deploy!

The app will be live at your Vercel URL.

## 5. DNS Setup (Optional)

To use a custom domain:
1. Go to Vercel → Project → Settings → Domains
2. Add your domain (e.g., whalescope.io)
3. Update DNS records as instructed

## Environment Variables Summary

```env
# App
NEXT_PUBLIC_APP_URL=https://whalescope.io

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=

# Telegram
TELEGRAM_BOT_TOKEN=
```

## Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Fill in your values

# Run dev server
npm run dev

# Run Telegram bot (separate terminal)
npm run telegram-bot
```

## Testing Payments

Use Stripe test mode:
- Test card: `4242 4242 4242 4242`
- Any future expiry and CVC

## Scripts

```bash
# Fetch latest congress trades
npm run fetch-congress

# Run alert notifier (checks for new trades, sends alerts)
npm run notify

# Run Telegram bot
npm run telegram-bot
```
