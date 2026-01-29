// WhaleScope Service Worker — Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🐋 WhaleScope Alert';
  const options = {
    body: data.body || 'New trade detected',
    icon: '/og-image.png',
    badge: '/og-image.png',
    data: { url: data.url || 'https://whalescope.app' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || 'https://whalescope.app')
  );
});
