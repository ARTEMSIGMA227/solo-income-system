import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const CRYPTOBOT_API = 'https://pay.crypt.bot/api';
const PRICE_USD = 15;

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const asset = body.asset || 'USDT';

    // Create CryptoBot invoice with user_id in payload
    const res = await fetch(`${CRYPTOBOT_API}/createInvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Crypto-Pay-API-Token': process.env.CRYPTOBOT_API_TOKEN!,
      },
      body: JSON.stringify({
        currency_type: 'crypto',
        asset,
        amount: String(PRICE_USD),
        description: 'Solo Income System PRO — 30 days',
        payload: user.id,
        paid_btn_name: 'openBot',
        paid_btn_url: 'https://t.me/SOLOINCOMESYSTEMBOT',
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error('CryptoBot createInvoice error:', data);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json({
      invoice_url: data.result.bot_invoice_url || data.result.mini_app_invoice_url,
      invoice_id: data.result.invoice_id,
    });
  } catch (err) {
    console.error('Create invoice error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}