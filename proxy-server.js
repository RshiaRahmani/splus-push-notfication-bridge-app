const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Remove X-Frame-Options header proxy route
app.get('/proxy', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        
        if (!targetUrl) {
            return res.status(400).json({ error: 'URL parameter required' });
        }
        
        // Validate URL to prevent abuse
        const urlObj = new URL(targetUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return res.status(400).json({ error: 'Invalid protocol' });
        }
        
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15'
            }
        });
        
        // Remove security headers that block framing
        const headers = {
            'Content-Type': response.headers['content-type'] || 'text/html',
            'Access-Control-Allow-Origin': '*',
        };
        
        // Remove these blocking headers
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        
        res.set(headers);
        res.send(response.data);
        
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: 'Failed to fetch URL' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log(`Use iframe src: https://your-domain.com/proxy?url=https://web.splus.ir`);
});
