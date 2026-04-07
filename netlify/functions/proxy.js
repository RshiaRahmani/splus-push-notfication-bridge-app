const axios = require('axios');
const url = require('url');

exports.handler = async (event) => {
    try {
        const targetUrl = event.queryStringParameters?.url;
        
        if (!targetUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL parameter required' })
            };
        }
        
        // Validate URL
        let parsedUrl;
        try {
            parsedUrl = new URL(targetUrl);
        } catch {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid URL' })
            };
        }
        
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)',
            },
            timeout: 15000,
            maxRedirects: 5
        });
        
        let body = response.data;
        const contentType = response.headers['content-type'] || '';
        
        // Rewrite relative URLs in HTML
        if (contentType.includes('text/html')) {
            body = rewriteHTML(body, targetUrl);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300'
            },
            body: body
        };
        
    } catch (error) {
        console.error('Proxy error:', error.message);
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch URL: ' + error.message,
                status: error.response?.status
            })
        };
    }
};

function rewriteHTML(html, baseUrl) {
    const baseUrlObj = new URL(baseUrl);
    const baseOrigin = baseUrlObj.origin;
    
    // Rewrite all relative URLs
    html = html
        // Fix href attributes
        .replace(/href=["']\/(?!\/)/g, (match) => `href="/.netlify/functions/proxy?url=${baseOrigin}/`)
        .replace(/href=["'](?!https?:|\/|data:|#|\.\/|\.\.\/)/g, (match) => `href="/.netlify/functions/proxy?url=${baseUrl.replace(/\/$/, '')}/`)
        
        // Fix src attributes
        .replace(/src=["']\/(?!\/)/g, (match) => `src="/.netlify/functions/proxy?url=${baseOrigin}/`)
        .replace(/src=["'](?!https?:|\/|data:|blob:|\.\/|\.\.\/)/g, (match) => `src="/.netlify/functions/proxy?url=${baseUrl.replace(/\/$/, '')}/`)
        
        // Fix srcset attributes
        .replace(/srcset=["'][^"']*["']/g, (match) => {
            return match.replace(/(?!https?:|\/\/)/g, (m) => `/.netlify/functions/proxy?url=${baseOrigin}`);
        })
        
        // Remove X-Frame-Options meta tags if present
        .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '')
        
        // Fix CSS @import
        .replace(/@import\s+(?:url\()?"(?!https?:)([^"]+)"/g, (match, p1) => {
            const fullUrl = new URL(p1, baseUrl).href;
            return `@import url("/.netlify/functions/proxy?url=${encodeURIComponent(fullUrl)}")`;
        });
    
    return html;
}
