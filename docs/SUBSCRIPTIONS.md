# WhaleScope Subscriptions

## Setup

1. **Create a Solana wallet** for receiving payments
2. **Set environment variable:**
   ```bash
   export WHALESCOPE_WALLET="YourSolanaWalletAddress"
   ```

3. **Run the payment watcher** (via cron every 5 mins):
   ```bash
   npm run watch-payments
   ```

## How it works

1. User visits `/subscribe`
2. Enters email, gets unique payment code
3. Sends $10 USDC to wallet with code as memo
4. `watch-payments` detects payment, activates subscription
5. Welcome email sent automatically
6. `notify` script emails all active subscribers when new trades detected

## Files

- `data/pending-subscriptions.json` - email + code waiting for payment
- `data/subscribers.json` - confirmed subscribers with expiry dates
- `data/processed-payments.json` - transaction signatures already processed

## Scripts

```bash
# Check for new payments and activate subscriptions
npm run watch-payments

# Fetch trades and email subscribers
npm run fetch-and-notify

# Run both (for cron)
npm run cron
```

## Cron setup

```bash
# Every 5 minutes: check payments + send alerts
*/5 * * * * cd /path/to/whalescope && npm run cron
```
