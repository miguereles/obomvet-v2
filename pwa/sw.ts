/// <reference lib="webworker" />

self.addEventListener("push", function (event: any) {
  let data = { title: "Notificação", body: "Nova notificação", data: { url: "/" } };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // se o payload não for JSON, use texto
    try {
      const text = event.data.text();
      data.body = text;
    } catch (err) {
      // ignore
    }
  }

  const options = {
    body: data.body || "Nova notificação",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: data.data || {},
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    (self as any).registration.showNotification(data.title || "Notificação", options)
  );
});

self.addEventListener("notificationclick", function (event: any) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});