import { handleHealthwatchify } from './api/healthwatchify.js';
import { htmlTemplate } from './templates/html.js';
import { styles } from './styles/styles.js';
import { clientScript } from './client/script.js';
import { htmlResponse } from './utils/response.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname === '/api/healthwatchify') {
      return handleHealthwatchify(request);
    }

    // Handle image proxy requests
    if (url.pathname === '/api/proxy-image') {
      const imageUrl = url.searchParams.get('url');
      if (!imageUrl) {
        return new Response('No image URL provided', { status: 400 });
      }

      try {
        const response = await fetch(imageUrl);
        const contentType = response.headers.get('content-type');
        
        return new Response(response.body, {
          headers: {
            'Content-Type': contentType || 'image/jpeg',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
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