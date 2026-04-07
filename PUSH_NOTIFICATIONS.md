# Advanced: Backend Push Notifications (Optional)

This guide covers implementing **server-side push notifications** for even better background support.

## The Problem with Browser Notifications

- Browser notifications only work if the browser is **running** (even in background)
- On iOS, Apps are forcefully terminated if they consume too much battery/memory
- For truly reliable notifications, use **Web Push API** with your backend server

## Solution: Web Push Notifications

### How It Works

```
┌─────────────────┐
│  Your Backend   │ Sends push message to user
│  Server         │
└────────┬────────┘
         │ (Uses subscription endpoint)
         ↓
┌─────────────────────────────┐
│  Web Push Service (Google)  │ Routes to device
│  (FCM, APNS)                │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────┐
│  User's Device  │ Service Worker catches push
│  (iOS/Android)  │ Shows notification
└─────────────────┘
```

## Setup Instructions

### Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys identify your server.

**Using Node.js:**

```bash
npm install web-push -g
web-push generate-vapid-keys

# Output:
# Public Key: ABC123...
# Private Key: XYZ789...
```

**Using Python:**

```bash
pip install pywebpush

python3 << 'EOF'
from pywebpush import WebPusher

vapid_keys = WebPusher.generate_keys()
print(f"Public: {vapid_keys['public']}")
print(f"Private: {vapid_keys['private']}")
EOF
```

### Step 2: Update Web App (index.html)

Add this to the initialization section:

```javascript
async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Workers not supported');
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Get or create subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
        // Create new subscription
        const PUBLIC_KEY = 'YOUR_PUBLIC_VAPID_KEY_HERE'; // Replace
        
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        });
    }
    
    // Send subscription to your backend
    await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
    });
    
    console.log('Subscribed to push notifications');
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// Call during initialization
await subscribeUserToPush();
```

### Step 3: Backend Service (Node.js Example)

```javascript
const express = require('express');
const webpush = require('web-push');

const app = express();
app.use(express.json());

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    'mailto:admin@yourdomain.com',
    'YOUR_PUBLIC_KEY',
    'YOUR_PRIVATE_KEY'
);

// Subscribe endpoint (receives subscription from app)
app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    
    // Save subscription to database with user ID
    // db.subscriptions.insert({ userId: req.user.id, subscription });
    
    res.json({ success: true });
});

// Send notification endpoint (call from your chat backend)
app.post('/api/send-notification', async (req, res) => {
    const { userId, message } = req.body;
    
    // Get subscription from database
    // const sub = db.subscriptions.findBy({ userId });
    
    const notificationPayload = {
        title: 'New Message',
        body: message,
        icon: '/icon-192x192.png',
    };
    
    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify(notificationPayload)
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Notification failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running'));
```

### Step 4: Update Service Worker (sw.js)

Add push event handler:

```javascript
// Add this to sw.js
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    let notificationData = {
        title: 'New Message',
        body: 'You have a new message',
    };
    
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }
    
    const options = {
        body: notificationData.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'messenger-notification',
        requireInteraction: false,
    };
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});
```

### Step 5: Connect to Your Chat Backend

Modify your messenger to send notifications via your backend:

```python
# Python example: Send push notification when new message arrives
from pywebpush import webpush

def notify_user_of_message(user_id, message_text):
    # Get user's subscription from database
    subscription = db.subscriptions.find_one(user_id=user_id)
    
    if subscription:
        payload = {
            'title': 'New Message',
            'body': message_text,
        }
        
        webpush(
            subscription_info=subscription,
            data=json.dumps(payload),
            vapid_private_key=os.getenv('VAPID_PRIVATE_KEY'),
            vapid_claims={
                'sub': 'mailto:admin@yourdomain.com',
            }
        )
```

## Libraries & Tools

### Node.js
- **web-push** - Official library
  ```bash
  npm install web-push
  ```

### Python
- **pywebpush** - Python library
  ```bash
  pip install pywebpush
  ```

### PHP
- **web-push-php** - PHP library
  ```bash
  composer require minishlink/web-push
  ```

### Go
- **webpush** - Go library
  ```bash
  go get github.com/SherclockHolmes/webpush
  ```

## Testing Push Notifications

### Using Postman

1. Open Postman
2. Create POST request to: `http://localhost:3000/api/send-notification`
3. Headers: `Content-Type: application/json`
4. Body:
```json
{
    "userId": "user123",
    "message": "Test message from Postman"
}
```
5. Send - notification should appear on device

### Using cURL

```bash
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "message": "Hello from cURL"}'
```

## Security Considerations

1. **Validate subscriptions** - Remove expired subscriptions
2. **Rate limiting** - Don't send too many notifications
3. **Data encryption** - Push API data is encrypted in transit
4. **HTTPS only** - Web Push requires HTTPS
5. **Validate API calls** - Only backend should send notifications

## Troubleshooting

### Subscriptions not working
- Check VAPID keys are correct
- Ensure HTTPS is enabled
- Check browser console for errors
- Verify service worker is registered

### Notifications not showing
- Check browser notification permissions
- Check notification is not being blocked
- Verify payload is valid JSON
- Check browser logs for push event handling

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid VAPID" | Wrong key format | Regenerate keys |
| "HTTPS required" | HTTP connection | Use HTTPS |
| "Push service error" | Subscription expired | Re-subscribe user |
| "Permission denied" | User blocked notifications | User must allow in settings |

## Performance Tips

- **Batch notifications** - Group multiple messages
- **Unsubscribe inactive users** - Remove after 30 days
- **Monitor delivery** - Log failed deliveries
- **Set TTL** - Messages should expire quickly (1 hour)

## Example: Complete Flow

```javascript
// 1. User installs app
app.get('/install', (req, res) => {
    // Forward to PWA
    res.sendFile('index.html');
});

// 2. Browser subscribes
app.post('/api/subscribe', (req, res) => {
    db.subscriptions.create({
        userId: req.user.id,
        subscription: req.body,
        createdAt: new Date(),
    });
});

// 3. New message arrives
app.post('/api/messages', (req, res) => {
    const message = createMessage(req.body);
    
    // Notify all relevant users
    for (const userId of message.recipientIds) {
        const sub = db.subscriptions.findOne(userId);
        if (sub) {
            webpush.sendNotification(sub, JSON.stringify({
                title: 'New message from ' + message.sender,
                body: message.text,
            }));
        }
    }
    
    res.json(message);
});

// 4. User receives notification on device
// Service Worker automatically catches it and displays
```

---

**Note:** This is an advanced feature. The basic app (without backend push) already provides significant improvements over the iframe-only approach.
