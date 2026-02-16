// Run: npx ts-node scripts/generate-vapid-keys.ts
// Or: node -e "const w = require('web-push'); const k = w.generateVAPIDKeys(); console.log(k);"

import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('Add these to your .env.local and Vercel Environment Variables:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:your-email@example.com`);
console.log(`CRON_SECRET=your-random-secret-here`);
