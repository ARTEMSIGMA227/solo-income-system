import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram';
import { createHmac, createHash } from 'crypto';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function verifySignature(body: string, signature: string): boolean {
  const secret = createHash('sha256')
    .update(process.env.CRYPTOBOT_API_TOKEN!)
    .digest();
  const hmac = createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return hmac === signature;
}

interface CryptoBotInvoice {
  invoice_id: number;
  hash: string;
  currency_type: string;
  asset?: string;
  fiat?: string;
  amount: string;
  paid_asset?: string;
  paid_amount?: string;
  status: string;
  payload?: string;
}

interface CryptoBotUpdate {
  update_id: number;
  update_type: string;
  request_date: string;
  payload: CryptoBotInvoice;
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();

  // Verify signature
  const signature = request.headers.get('crypto-pay-api-signature') || '';
  if (!verifySignature(bodyText, signature)) {
    console.error('CryptoBot webhook: invalid signature');
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update: CryptoBotUpdate = JSON.parse(bodyText);

    if (update.update_type !== 'invoice_paid') {
      return NextResponse.json({ ok: true });
    }

    const invoice = update.payload;
    const supabase = createAdminClient();

    // Check duplicate
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('provider', 'cryptobot')
      .eq('invoice_id', String(invoice.invoice_id))
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, msg: 'already_processed' });
    }

    // Extract user_id from payload
    const userId = invoice.payload || null;
    if (!userId) {
      console.error('CryptoBot webhook: no user_id in payload');
      // Save payment without user for manual resolution
      await supabase.from('payments').insert({
        provider: 'cryptobot',
        invoice_id: String(invoice.invoice_id),
        amount: parseFloat(invoice.amount),
        currency: invoice.asset || invoice.fiat || 'UNKNOWN',
        status: 'no_user',
        payload: invoice as unknown as Record<string, unknown>,
      });
      return NextResponse.json({ ok: true, msg: 'no_user_in_payload' });
    }

    // Activate PRO
    const days = 30;
    const proUntil = new Date();
    proUntil.setDate(proUntil.getDate() + days);

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        is_pro: true,
        pro_until: proUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) {
      console.error('CryptoBot webhook: profile update failed', updateErr);
    }

    // Log payment
    await supabase.from('payments').insert({
      user_id: userId,
      provider: 'cryptobot',
      invoice_id: String(invoice.invoice_id),
      amount: parseFloat(invoice.amount),
      currency: invoice.asset || invoice.fiat || 'UNKNOWN',
      days_granted: days,
      status: updateErr ? 'activation_failed' : 'completed',
      payload: invoice as unknown as Record<string, unknown>,
    });

    // Notify user via Telegram
    if (!updateErr) {
      const { data: link } = await supabase
        .from('telegram_links')
        .select('chat_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (link?.chat_id) {
        await sendTelegramMessage(
          link.chat_id,
          '🎉 <b>PRO активирован!</b>\n\n'
          + `⏱ Срок: ${days} дней\n`
          + `📅 До: ${proUntil.toLocaleDateString('ru-RU')}\n\n`
          + '🚀 Все PRO-функции доступны!',
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CryptoBot webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}