import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL ?? 'admin@solo-income.app'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

interface SendBody {
  title: string;
  body: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { title, body: messageBody, userId } = (await request.json()) as SendBody;

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'title and body required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    let query = supabase.from('push_subscriptions').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscriptions' });
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    });

    let sent = 0;
    const staleIds: string[] = [];

    await Promise.all(
      (subscriptions as PushSubscriptionRow[]).map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth_key,
              },
            },
            payload
          );
          sent++;
        } catch (pushError: unknown) {
          const statusCode = (pushError as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            staleIds.push(sub.id);
          }
          console.error(`Push failed for ${sub.endpoint}:`, pushError);
        }
      })
    );

    if (staleIds.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', staleIds);
    }

    return NextResponse.json({ sent, total: subscriptions.length, cleaned: staleIds.length });
  } catch (err) {
    console.error('Send error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}