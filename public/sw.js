self.addEventListener("push", function (event) {
  let data = {
    title: "Solo Income System",
    body: "У тебя есть незавершённые квесты!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/dashboard" },
  };

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    console.error("Push data parse error:", e);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      vibrate: [200, 100, 200],
      actions: [
        { action: "open", title: "Открыть" },
        { action: "dismiss", title: "Закрыть" },
      ],
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});