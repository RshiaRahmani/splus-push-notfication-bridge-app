# Messenger Web App with Background Notifications

This is a Progressive Web App (PWA) wrapper for your S Plus Messenger that enables background notifications on iOS and improves connection reliability.

## 📋 Features

✅ **Background Notifications** - Shows notifications even when the app is closed (iOS 16.4+)
✅ **Connection Monitoring** - Automatically detects and handles connection drops
✅ **Auto-Reconnect** - Attempts to reconnect if connection is lost
✅ **iOS Home Screen Install** - Add as a native app icon on iOS home screen
✅ **Service Worker Support** - Handles background tasks and notifications
✅ **Offline Awareness** - Shows connection status in real-time
✅ **Native Look & Feel** - Full-screen experience on iOS

## 📁 Files Included

- **index.html** - Main wrapper with connection monitoring and UI
- **sw.js** - Service Worker for background tasks and notifications
- **manifest.json** - PWA manifest for app installation
- **README.md** - This file

## 🚀 Deployment Instructions

### Option 1: Deploy to Your Own Server

1. **Copy all files to your web server:**
   ```bash
   # Upload these 3 files to your web server root:
   - index.html
   - sw.js
   - manifest.json
   ```

2. **Ensure proper headers are set:**
   - Make sure your server serves files with `Content-Type: application/json` for `.json` files
   - Enable HTTPS (required for Service Workers and Notifications)

### Option 2: Use Netlify (Free & Automatic HTTPS)

1. **Push files to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial messenger app"
   git remote add origin https://github.com/YOUR_USERNAME/messenger-app.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Deploy

3. **Get your URL** (e.g., `https://your-messenger-app.netlify.app`)

### Option 3: Self-Host with Node.js

```bash
# Using Express
npm init -y
npm install express

# Create server.js
const express = require('express');
const app = express();
app.use(express.static('.'));
app.listen(3000, () => console.log('Server running on port 3000'));

# Run
node server.js
```

## 📱 How to Install on iOS

### Method 1: Add to Home Screen (Recommended)

1. Open your app URL in Safari (e.g., `https://your-messenger-app.netlify.app`)
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Enter a name (default: "Messenger")
5. Tap **"Add"**

The app will now appear as a home screen icon with background notification support.

### Method 2: Use Chrome (Alternative)

1. Open the URL in Chrome
2. Tap the **Menu** (three dots)
3. Tap **"Install app"** or **"Add to Home Screen"**
4. Follow the prompts

## 🔔 How Notifications Work

### On iOS PWA:
- When the app is **active**: Notifications appear as toasts and browser notifications
- When the app is **backgrounded**: Service Worker monitors connection and intercepts messages
- When the app is **closed**: Push notifications can be delivered (requires backend setup)

### To Enable Server-Side Push Notifications (Optional):

Your backend server needs to:

1. **Get browser subscription when app loads:**
   ```javascript
   // Contact your backend to store subscription endpoint
   if ('serviceWorker' in navigator && 'PushManager' in window) {
       navigator.serviceWorker.ready.then((registration) => {
           registration.pushManager.getSubscription().then((subscription) => {
               if (subscription) {
                   // Send subscription to your backend
                   fetch('/api/subscribe', {
                       method: 'POST',
                       body: JSON.stringify(subscription)
                   });
               }
           });
       });
   }
   ```

2. **Send push notifications from backend:**
   ```python
   # Python example using pywebpush
   from pywebpush import webpush
   
   webpush(
       subscription_info={
           "endpoint": "user_subscription_endpoint",
           "keys": {"p256dh": "...", "auth": "..."}
       },
       data="New message from John!",
       vapid_private_key="your_private_key"
   )
   ```

## 🔧 Configuration

Edit `index.html` to customize:

```javascript
const CONFIG = {
    MESSENGER_URL: 'https://web.splus.ir',  // Your messenger URL
    CONNECTION_CHECK_INTERVAL: 30000,        // Check every 30 seconds
    RECONNECT_INTERVAL: 5000,                // Wait 5 seconds between reconnects
    DEBUG_ENABLED: false,                    // Set to true for debug logs
};
```

## 🐛 Troubleshooting

### Notifications not appearing?

1. **Check permissions:**
   - Settings → Notifications → Safari/Your Browser → Allow

2. **Verify Service Worker:**
   - Click the app name 3 times quickly to see debug panel
   - Check if Service Worker is registered

3. **For iOS specifically:**
   - Make sure you installed via "Add to Home Screen" (not just bookmarking)
   - iOS 16.4+ is recommended for best support

### Connection issues?

1. **Check debug logs:**
   - Click the app title 3 times to show debug panel
   - Look for connection check logs

2. **Verify HTTPS:**
   - Service Workers require HTTPS
   - Test URL starts with `https://`

3. **Check CORS:**
   - Your messenger URL must be CORS-enabled for connection checks

### Service Worker not updating?

1. Clear Safari data:
   - Settings → Safari → Clear History and Website Data
   - Reinstall app from home screen

2. Or manually clear cache:
   - Safari → Settings (gear icon) → Advanced → Website Data
   - Find your domain and delete

## 📊 Debug Mode

1. **Enable debug:** Click the app title/header 3 times
2. **See logs:** Debug panel appears in bottom-right corner
3. **Disable debug:** Click title 3 times again

Debug panel shows:
- Service Worker registration status
- Connection check results
- Notification events
- Background task status

## 🌐 CORS Configuration

If your messenger server has CORS restrictions, update your server to allow requests from your wrapper domain:

```nginx
# Nginx
add_header 'Access-Control-Allow-Origin' 'https://your-wrapper-domain.com' always;
add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
```

## 📝 Important Notes

- ⚠️ **iOS Safari PWA Limitations:**
  - Background tasks are limited (doesn't run continuously like native apps)
  - Notifications work best when using native push notifications
  - Some APIs may not be available

- ✅ **Android Chrome PWA:**
  - Better support for background tasks
  - Periodic background sync available
  - Better notification support

- 🔐 **Security:**
  - Always use HTTPS
  - Service Workers can cache data
  - Clear cache if you encounter issues

## 🎯 Next Steps

1. **Deploy the files** to your server
2. **Test on iOS** by adding to home screen
3. **Configure backend** push notifications (optional but recommended)
4. **Enable debug mode** to verify everything is working
5. **Submit feedback** if you encounter issues

## 📞 Support

If notifications still don't work:

1. Verify you're on iOS 16.4+
2. Check that the app is installed as a home screen app (not Safari bookmark)
3. Ensure notifications are enabled in Settings
4. Try clearing Safari data and reinstalling
5. Check browser console (Safari Developer Tools) for errors

## 🚀 Performance Tips

- **Keep-alive:** Connection is checked every 30 seconds (configurable)
- **Battery:** Background tasks are optimized to minimize battery drain
- **Data:** Uses minimal bandwidth - only checks connection status
- **Storage:** Service Worker caches minimal data (~1MB)

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-07  
**Compatibility:** iOS 16.4+, Android Chrome 90+, Desktop Chrome/Edge
# splus-push-notfication-bridge-app
