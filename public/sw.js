// Service Worker for RJB TRANZ Push Notifications
const CACHE_NAME = "rjb-tranz-v1";

// Prevent service worker from interfering in development environments
const isDevEnvironment =
  self.location.hostname.includes("github.dev") ||
  self.location.hostname.includes("app.github.dev") ||
  self.location.hostname.includes("localhost") ||
  self.location.hostname.includes("127.0.0.1") ||
  self.location.hostname.includes("csb.app") ||
  self.location.hostname.includes("codesandbox.io");

if (isDevEnvironment) {
  console.log(
    "Service Worker: Development environment detected, disabling aggressive caching"
  );
}
const urlsToCache = [
  "/",
  "/src/main.css",
  "/src/main.tsx",
  "https://i.ibb.co/6LY7bxR/rjb-logo.jpg",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      if (isDevEnvironment) {
        console.log("Service Worker: Development environment, skipping all caching during install.");
        return Promise.resolve(); // Do not cache anything during install in dev
      } else {
        return cache.addAll(urlsToCache);
      }
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  // In development, be less aggressive with caching to avoid CORS issues
  if (isDevEnvironment) {
    // Always go to network in development, never serve from cache
    console.log("Service Worker: Development environment, fetching directly from network:", event.request.url);
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push event - handle push notifications
self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "RJB TRANZ", body: event.data.text() };
    }
  }

  const options = {
    title: data.title || "RJB TRANZ",
    body: data.body || "New transaction update",
    icon: "https://i.ibb.co/6LY7bxR/rjb-logo.jpg",
    badge: "https://i.ibb.co/6LY7bxR/rjb-logo.jpg",
    tag: data.tag || "rjb-tranz-notification",
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: "view",
        title: "View Details",
        icon: "https://i.ibb.co/6LY7bxR/rjb-logo.jpg",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    data: {
      url: data.url || "/",
      transactionId: data.transactionId,
      type: data.type,
    },
  };

  event.waitUntil(self.registration.showNotification(options.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === "dismiss") {
    notification.close();
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === notification.data.url && "focus" in client) {
          client.focus();
          notification.close();
          return;
        }
      }

      // Otherwise, open a new window
      if (clients.openWindow) {
        clients.openWindow(notification.data.url);
        notification.close();
      }
    })
  );
});

// Background sync for offline transaction updates
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync-transactions") {
    event.waitUntil(
      // Here you would typically sync with your backend
      // For now, we'll just log the sync event
      console.log("Background sync: transactions")
    );
  }
});

// Handle notification close event
self.addEventListener("notificationclose", (event) => {
  const notification = event.notification;
  console.log("Notification closed:", notification.tag);

  // Track notification dismissal if needed
  event.waitUntil(
    // You could send analytics data here
    Promise.resolve()
  );
});
