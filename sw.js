// Service Worker for background notifications and connection management
const CACHE_NAME = 'messenger-v1';
const MESSENGER_URL = 'https://web.splus.ir';

// State for tracking background status
let appIsActive = true;
let connectionCheckInterval = null;

// ============ Service Worker Installation ============
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
    startBackgroundConnectionMonitoring();
});

// ============ Message Handling ============
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'APP_BACKGROUNDED':
            appIsActive = false;
            console.log('[SW] App backgrounded - starting intensive monitoring');
            startBackgroundConnectionMonitoring();
            break;
            
        case 'APP_FOREGROUNDED':
            appIsActive = true;
            console.log('[SW] App foregrounded');
            stopBackgroundConnectionMonitoring();
            break;
            
        case 'PAGE_HIDDEN':
            console.log('[SW] Page hidden');
            startBackgroundConnectionMonitoring();
            break;
            
        case 'SHOW_NOTIFICATION':
            console.log('[SW] Showing notification:', data);
            showNotificationToUser(data.title, data.message);
            break;
            
        case 'APP_UNLOADING':
            console.log('[SW] App unloading');
            break;
    }
});

// ============ Background Connection Monitoring ============
function startBackgroundConnectionMonitoring() {
    if (connectionCheckInterval) return;
    
    console.log('[SW] Starting background connection monitoring');
    
    // Check connection every 20 seconds when in background
    connectionCheckInterval = setInterval(() => {
        if (!appIsActive) {
            checkConnectionAndNotify();
        }
    }, 20000);
}

function stopBackgroundConnectionMonitoring() {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
        connectionCheckInterval = null;
        console.log('[SW] Stopped background connection monitoring');
    }
}

async function checkConnectionAndNotify() {
    try {
        const response = await fetch(MESSENGER_URL, {
            method: 'HEAD',
            mode: 'no-cors',
        });
        
        // Connection is alive, broadcast to clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CONNECTION_STATUS',
                data: { connected: true }
            });
        });
    } catch (error) {
        console.log('[SW] Connection check failed:', error);
        
        // Notify all clients of connection loss
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CONNECTION_STATUS',
                data: { connected: false }
            });
        });
    }
}

// ============ Notification Display ============
async function showNotificationToUser(title, message) {
    try {
        await self.registration.showNotification(title, {
            body: message,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233b82f6" width="192" height="192"/><text x="50%" y="50%" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial">M</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233b82f6" width="192" height="192"/><text x="50%" y="50%" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial">M</text></svg>',
            tag: 'messenger-notification',
            requireInteraction: false,
        });
    } catch (error) {
        console.error('[SW] Failed to show notification:', error);
    }
}

// ============ Notification Click Handling ============
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    event.notification.close();
    
    // Focus existing client or open new window
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clientList) => {
            // Check if there's already a client open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// ============ Fetch Event Handling ============
self.addEventListener('fetch', (event) => {
    // For now, just pass through all requests
    // In the future, you could implement caching strategies here
});

console.log('[SW] Service Worker script loaded');
