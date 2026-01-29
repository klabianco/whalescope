/**
 * Email sending utilities using Resend REST API (Edge-compatible)
 * No SDK dependency — uses fetch() directly for edge runtime compatibility.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'WhaleScope <alerts@whalescope.app>';

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      console.error('Resend API error:', err);
      return { success: false, error: err.message || 'Email send failed' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to send email:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function sendWelcomeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'Welcome to WhaleScope Pro 🐋',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:40px;">🐋</span>
              <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:8px 0 0 0;">WhaleScope</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#18181b;border-radius:12px;padding:40px 32px;border:1px solid #27272a;">
              <h2 style="color:#22c55e;font-size:22px;font-weight:600;margin:0 0 16px 0;">Welcome to WhaleScope Pro! 🎉</h2>
              <p style="color:#e4e4e7;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
                You're now set up to receive email alerts from WhaleScope.
              </p>
              <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
                You'll get notified when congress members trade stocks and when whales move crypto.
              </p>
              <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
                Alerts are sent within seconds of on-chain confirmation.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px 0;">
                    <a href="https://whalescope.app/congress" style="display:inline-block;background-color:#22c55e;color:#000000;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      View Latest Trades →
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #27272a;margin:0 0 24px 0;">
              <p style="color:#71717a;font-size:14px;margin:0 0 12px 0;">
                Get alerts on every platform:
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:16px;">
                    <a href="https://discord.gg/prKfxkYFUw" style="color:#22c55e;font-size:14px;text-decoration:none;">🎮 Discord</a>
                  </td>
                  <td>
                    <a href="https://t.me/WhaleScopeAlerts_bot" style="color:#22c55e;font-size:14px;text-decoration:none;">📱 Telegram</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#52525b;font-size:12px;margin:0;">
                WhaleScope — Track congress trades & whale wallets in real time
              </p>
              <p style="color:#3f3f46;font-size:11px;margin:8px 0 0 0;">
                <a href="https://whalescope.app" style="color:#3f3f46;text-decoration:none;">whalescope.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

export async function sendTradeAlertEmail(
  email: string,
  trade: {
    politician: string;
    ticker: string;
    action: string;
    amount: string;
    date: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const actionEmoji = trade.action.toLowerCase().includes('purchase') ? '🟢' : '🔴';
  const actionColor = trade.action.toLowerCase().includes('purchase') ? '#22c55e' : '#ef4444';

  return sendEmail({
    to: email,
    subject: `${actionEmoji} ${trade.politician} — ${trade.action} $${trade.ticker}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:32px;">🐋</span>
              <span style="color:#71717a;font-size:14px;font-weight:600;vertical-align:middle;margin-left:8px;">WhaleScope Alert</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#18181b;border-radius:12px;padding:32px;border:1px solid #27272a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:28px;">${actionEmoji}</span>
                    <span style="color:${actionColor};font-size:18px;font-weight:700;vertical-align:middle;margin-left:8px;">${trade.action}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="color:#ffffff;font-size:20px;font-weight:600;margin:0;">${trade.politician}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #27272a;">
                          <span style="color:#71717a;font-size:13px;">Ticker</span>
                        </td>
                        <td align="right" style="padding:8px 0;border-bottom:1px solid #27272a;">
                          <span style="color:#ffffff;font-size:14px;font-weight:600;">$${trade.ticker}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #27272a;">
                          <span style="color:#71717a;font-size:13px;">Amount</span>
                        </td>
                        <td align="right" style="padding:8px 0;border-bottom:1px solid #27272a;">
                          <span style="color:#a1a1aa;font-size:14px;">${trade.amount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#71717a;font-size:13px;">Date</span>
                        </td>
                        <td align="right" style="padding:8px 0;">
                          <span style="color:#a1a1aa;font-size:14px;">${trade.date}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="https://whalescope.app/congress" style="display:inline-block;background-color:#22c55e;color:#000000;font-size:14px;font-weight:600;text-decoration:none;padding:10px 28px;border-radius:8px;">
                      View on WhaleScope →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#3f3f46;font-size:11px;margin:0;">
                <a href="https://whalescope.app" style="color:#3f3f46;text-decoration:none;">whalescope.app</a> — Real-time congressional trade tracking
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
