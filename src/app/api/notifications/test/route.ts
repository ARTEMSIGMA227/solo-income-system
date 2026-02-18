import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@solo-income-system.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { error: "no_subscriptions", message: "Нет подписок — включи уведомления" },
      { status: 404 },
    );
  }

  const payload = JSON.stringify({
    title: "🔔 Тест Solo Income System",
    body: "Push-уведомления работают! Серия не прервётся 🔥",
    icon: "/icon-192.png",
  });

  let sent = 0;
  const stale: string[] = [];

  for (const row of subs) {
    try {
      await webpush.sendNotification(
        row.subscription as webpush.PushSubscription,
        payload,
      );
      sent++;
    } catch (err: unknown) {
      const status =
        err instanceof webpush.WebPushError ? err.statusCode : 0;
      if (status === 410 || status === 404) {
        stale.push(row.id as string);
      }
    }
  }

  if (stale.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", stale);
  }

  return NextResponse.json({ sent, cleaned: stale.length });
}