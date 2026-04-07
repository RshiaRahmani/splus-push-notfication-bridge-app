const axios = require('axios');

exports.handler = async (event) => {
    try {
        const url = event.queryStringParameters?.url;
        
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL parameter required' })
            };
        }
        
        // Validate URL
        try {
            new URL(url);
        } catch {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid URL' })
            };
        }
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)'
            },
            timeout: 10000
        });
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': response.headers['content-type'] || 'text/html',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            },
            body: response.data
        };
        
    } catch (error) {
        console.error('Proxy error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch URL: ' + error.message })
        };
    }
};
