import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const XROCKET_API = 'https://pay.ton-rocket.com';
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
    const currency = body.currency || 'USDT';

    const res = await fetch(`${XROCKET_API}/app/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Rocket-Pay-Key': process.env.XROCKET_API_TOKEN!,
      },
      body: JSON.stringify({
        amount: PRICE_USD,
        minPayment: PRICE_USD,
        currency,
        description: 'Solo Income System PRO — 30 days',
        hiddenMessage: user.id,
        payload: user.id,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      console.error('xRocket createInvoice error:', data);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json({
      invoice_url: data.data?.link || data.data?.botInvoiceUrl,
      invoice_id: data.data?.id,
    });
  } catch (err) {
    console.error('xRocket create invoice error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}