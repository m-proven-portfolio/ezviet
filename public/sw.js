/**
 * EZViet Push Notification Service Worker
 *
 * Handles incoming push notifications and user interactions.
 * Registered from the client when user opts in to notifications.
 */

// Cache name for offline fallback (if needed)
const CACHE_NAME = 'ezviet-notifications-v1';

// Listen for push events
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/badge-72.png',
      tag: data.tag || 'ezviet-notification',
      data: {
        url: data.url || '/',
        notificationId: data.notificationId,
        type: data.type,
      },
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'EZViet', options)
    );
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  // Handle action buttons if clicked
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Open the relevant page
        event.waitUntil(clients.openWindow(url));
        break;
      case 'dismiss':
        // Just close the notification (already done above)
        break;
      default:
        // Open the URL for any other action
        event.waitUntil(clients.openWindow(url));
    }
  } else {
    // Default click behavior - open the URL
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Check if a window is already open on the same origin
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus().then((focusedClient) => {
              if ('navigate' in focusedClient) {
                return focusedClient.navigate(url);
              }
            });
          }
        }
        // If no existing window, open a new one
        return clients.openWindow(url);
      })
    );
  }
});

// Handle notification close (for analytics if needed)
self.addEventListener('notificationclose', (event) => {
  const notificationId = event.notification.data?.notificationId;
  if (notificationId) {
    // Could send analytics here if needed
    console.log('Notification closed:', notificationId);
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('EZViet notification service worker installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('EZViet notification service worker activated');
  // Claim all clients immediately
  event.waitUntil(clients.claim());
});
