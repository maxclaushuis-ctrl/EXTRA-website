// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'EXTRA Notification',
    body: 'Je hebt een nieuwe notificatie ontvangen',
    icon: '/icons/notification-icon.svg',
    badge: '/icons/notification-icon.svg',
    tag: 'default'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Error parsing push payload:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data || {},
    actions: notificationData.actions || [],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  
  let url = '/dashboard';
  
  // Determine URL based on action or data
  if (action === 'view_dashboard') {
    url = '/dashboard';
  } else if (action === 'view_leaderboard') {
    url = '/dashboard?tab=leaderboard';
  } else if (action === 'view_challenges') {
    url = '/dashboard?tab=challenges';
  } else if (action === 'view_rewards') {
    url = '/dashboard?tab=rewards';
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching window is found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Optional: Track notification close events
  // This could be useful for analytics
});