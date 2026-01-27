# WhaleScope Telegram Alerts Setup

Get real-time alerts when Congress members make trades!

## 1. Create a Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Name it (e.g., "WhaleScope Alerts")
4. Choose a username (e.g., `whalescope_alerts_bot`)
5. Copy the **bot token** (looks like `123456789:ABCdefGHIjklMNOpqrs...`)

## 2. Get Your Chat ID

### For a private channel/group:
1. Add your bot to the channel as an admin
2. Send a message in the channel
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find the `chat.id` (negative number for groups)

### For personal alerts:
1. Message your bot
2. Visit the getUpdates URL above
3. Find your `chat.id` (positive number)

## 3. Configure WhaleScope

Add to `~/.config/whalescope/config.json`:

```json
{
  "quiver_api_key": "YOUR_QUIVER_KEY",
  "telegram_bot_token": "123456789:ABCdefGHIjklMNOpqrs...",
  "telegram_chat_id": "-1001234567890"
}
```

## 4. Test It

```bash
cd ~/clawd/whalescope
npm run fetch-and-notify
```

## 5. Set Up Automatic Alerts

Add a cron job to check hourly:

```bash
0 * * * * cd ~/clawd/whalescope && npm run fetch-and-notify >> /tmp/whalescope-alerts.log 2>&1
```

## Alert Format

You'll receive messages like:

```
🟢 PURCHASE Alert!

🔵 Nancy Pelosi (D-House)

📈 Ticker: $NVDA
💰 Amount: $1,000,001 - $5,000,000
📅 Traded: 2024-01-15
📋 Filed: 2024-01-20

View on WhaleScope
```

## Rate Limits

- Max 10 alerts per check (to avoid spam on first run)
- 1 second delay between messages (Telegram rate limits)
