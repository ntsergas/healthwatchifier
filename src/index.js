import { handleHealthwatchify } from './api/healthwatchify.js';
import blueskyPost from './api/bluesky-post.js';
import craftPost from './api/craft-post.js';
import mastodonPost from './api/mastodon-post.js';
import { htmlTemplate } from './templates/html.js';
import { privacyTemplate } from './templates/privacy.js';
import { dataDeletionTemplate } from './templates/data-deletion.js';
import { styles } from './styles/styles.js';
import { clientScript } from './client/script.js';
import { htmlResponse } from './utils/response.js';
import { getSiteOptimizedHeaders } from './utils/browserHeaders.js';
import { generateBrowserHeaders } from './utils/browserHeaders.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Handle API requests
    if (pathname === '/api/healthwatchify') {
      return handleHealthwatchify(request);
    }

    // Handle Bluesky posting
    if (pathname === '/api/bluesky-post') {
      return blueskyPost.fetch(request, env, ctx);
    }

    // Handle Craft CMS posting
    if (pathname === '/api/craft-post') {
      return craftPost.fetch(request, env, ctx);
    }

    // Handle Mastodon posting
    if (pathname === '/api/mastodon-post') {
      return mastodonPost.fetch(request, env, ctx);
    }

    // Handle privacy policy
    if (pathname === '/privacy') {
      return new Response(privacyTemplate(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle data deletion instructions
    if (pathname === '/data-deletion') {
      return new Response(dataDeletionTemplate(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle image proxy requests
    if (pathname === '/api/proxy-image') {
      const imageUrl = url.searchParams.get('url');
      if (!imageUrl) {
        return new Response('No image URL provided', { status: 400 });
      }

      try {
        // Get optimized headers for the image URL's domain
        const imageUrlObj = new URL(imageUrl);
        const headers = getSiteOptimizedHeaders(imageUrlObj.hostname);
        
        // Add image-specific accept headers
        headers['Accept'] = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
        
        const response = await fetch(imageUrl, { headers });
        
        // Get original headers
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        const cacheControl = response.headers.get('cache-control');
        
        // Construct response headers
        const responseHeaders = {
            'Content-Type': contentType || 'image/jpeg',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': cacheControl || 'public, max-age=31536000',
          'X-Content-Type-Options': 'nosniff',
          'Accept-Ranges': 'bytes'
        };
        
        // Add content length if available
        if (contentLength) {
          responseHeaders['Content-Length'] = contentLength;
        }
        
        return new Response(response.body, { headers: responseHeaders });
      } catch (error) {
        return new Response('Failed to fetch image', { status: 500 });
      }
    }
    
    // Serve main page
    return htmlResponse(htmlTemplate({
      styles,
      script: clientScript
    }));
  }
};