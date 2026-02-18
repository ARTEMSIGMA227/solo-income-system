// src/app/api/notifications/test/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@solo-income-system.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SubscriptionRow {
  subscription: PushSubscriptionData;
}

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", user.id);

  if (error || !subs || subs.length === 0) {
    return NextResponse.json(
      { error: "No subscriptions found", details: error },
      { status: 404 },
    );
  }

  let sent = 0;
  const errors: string[] = [];

  for (const row of subs as SubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.subscription.endpoint,
          keys: {
            p256dh: row.subscription.keys.p256dh,
            auth: row.subscription.keys.auth,
          },
        },
        JSON.stringify({
          title: "🧪 Тест пуша",
          body: "Push-уведомления работают!",
        }),
      );
      sent++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown";
      errors.push(msg);
    }
  }

  return NextResponse.json({ sent, errors });
}