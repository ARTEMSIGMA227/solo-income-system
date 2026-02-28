import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface XRocketInvoice {
  id: number;
  status: string;
  amount: string;
  currency: string;
  payload?: string;
}

interface XRocketUpdate {
  type: string;
  invoice?: XRocketInvoice;
}

export async function POST(request: NextRequest) {
  // xRocket sends API key in header for verification
  const apiKey = request.headers.get('rocket-pay-api-key') || '';
  if (apiKey !== process.env.XROCKET_API_TOKEN) {
    console.error('xRocket webhook: invalid API key');
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update: XRocketUpdate = await request.json();

    if (update.type !== 'invoicePaid' || !update.invoice) {
      return NextResponse.json({ ok: true });
    }

    const invoice = update.invoice;
    const supabase = createAdminClient();

    // Check duplicate
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('provider', 'xrocket')
      .eq('invoice_id', String(invoice.id))
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, msg: 'already_processed' });
    }

    // Extract user_id from payload
    const userId = invoice.payload || null;
    if (!userId) {
      await supabase.from('payments').insert({
        provider: 'xrocket',
        invoice_id: String(invoice.id),
        amount: parseFloat(invoice.amount),
        currency: invoice.currency || 'UNKNOWN',
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
      console.error('xRocket webhook: profile update failed', updateErr);
    }

    // Log payment
    await supabase.from('payments').insert({
      user_id: userId,
      provider: 'xrocket',
      invoice_id: String(invoice.id),
      amount: parseFloat(invoice.amount),
      currency: invoice.currency || 'UNKNOWN',
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
    console.error('xRocket webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}