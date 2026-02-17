const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export interface SerializedSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function serializeSubscription(
  sub: PushSubscription
): SerializedSubscription {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint ?? "",
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      console.warn("Push notifications not supported");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key not configured");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const keyArray = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray.buffer as ArrayBuffer,
      });
    }

    const serialized = serializeSubscription(subscription);

    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serialized),
    });

    if (!response.ok) {
      console.error("Failed to save subscription on server");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Push subscription failed:", error);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return true;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;

    await subscription.unsubscribe();

    await fetch("/api/notifications/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });

    return true;
  } catch (error) {
    console.error("Push unsubscribe failed:", error);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  const sub = await getCurrentSubscription();
  return sub !== null;
}