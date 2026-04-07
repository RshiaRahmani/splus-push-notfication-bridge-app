const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname)));

// Set proper MIME types
app.use((req, res, next) => {
    if (req.url.endsWith('.json')) {
        res.type('application/json');
    } else if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    
    // Service Worker headers
    if (req.url === '/sw.js') {
        res.set('Service-Worker-Allowed', '/');
        res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════╗
    ║                                                ║
    ║      Messenger Web App Server                  ║
    ║                                                ║
    ║      Server running at:                        ║
    ║      http://localhost:${PORT}                      ║
    ║                                                ║
    ║      For HTTPS (required for Service Worker):  ║
    ║      - Use ngrok: ngrok http 3000              ║
    ║      - Or deploy to Netlify/Heroku             ║
    ║                                                ║
    ║      Press Ctrl+C to stop                      ║
    ║                                                ║
    ╚════════════════════════════════════════════════╝
    `);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
