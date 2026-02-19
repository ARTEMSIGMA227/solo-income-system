// Setup Telegram webhook
// Run: node scripts/setup-telegram-webhook.mjs

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || 'https://solo-income-system.vercel.app';

if (!BOT_TOKEN) {
  console.error('Set TELEGRAM_BOT_TOKEN environment variable');
  process.exit(1);
}

if (!WEBHOOK_SECRET) {
  console.error('Set TELEGRAM_WEBHOOK_SECRET environment variable');
  process.exit(1);
}

const webhookUrl = `${APP_URL}/api/telegram/webhook`;

async function setup() {
  console.log(`Setting webhook to: ${webhookUrl}`);
  
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ['message'],
    }),
  });

  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));

  // Get webhook info
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const info = await infoRes.json();
  console.log('\nWebhook info:', JSON.stringify(info, null, 2));

  // Get bot info
  const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
  const me = await meRes.json();
  console.log('\nBot info:', JSON.stringify(me.result, null, 2));
  console.log(`\nBot username: @${me.result?.username}`);
  console.log(`Add to .env.local: NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${me.result?.username}`);
}

setup().catch(console.error);
