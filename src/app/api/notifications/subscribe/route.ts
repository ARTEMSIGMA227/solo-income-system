import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* */ }
        },
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const endpoint = body.endpoint;
    const p256dh = body.p256dh;
    const auth_key = body.auth_key;

    if (!endpoint || !p256dh || !auth_key) {
      return NextResponse.json({ error: 'Missing fields', received: { endpoint: !!endpoint, p256dh: !!p256dh, auth_key: !!auth_key } }, { status: 400 });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: user.id, endpoint, p256dh, auth_key },
      { onConflict: 'user_id,endpoint' },
    );

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { endpoint } = await request.json();
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

    await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}