import { serveLinkedInFeed, addToLinkedInFeed, emptyLinkedInFeed } from './api/linkedin-rss.js';
import { logger } from './utils/logger.js';

const workerLogger = logger.child('Worker');
const rssLogger = logger.child('RSS Feed');

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }

      // Empty feed endpoint
      if (url.pathname === '/empty' && request.method === 'POST') {
        await emptyLinkedInFeed(env);
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Serve feed
      if (request.method === 'GET') {
        // Log request details
        const ua = request.headers.get('User-Agent') || 'Unknown UA';
        const ip = request.headers.get('CF-Connecting-IP') || 'Unknown IP';
        
        // Identify the requester
        if (ua.includes('Opera')) {
          rssLogger.info('👤 Opera browser accessing feed', { ua, ip });
        } else if (/linkedin/i.test(ua)) {
          rssLogger.info('🔗 LinkedIn bot polling feed', { ua, ip });
        } else {
          rssLogger.info('⚠️ Unknown client accessing feed', { ua, ip });
        }

        const feed = await serveLinkedInFeed(env);
        
        // Log item count
        const itemCount = (feed.match(/<item>/g) || []).length;
        rssLogger.info(`Served RSS feed with ${itemCount} item(s)`);

        return new Response(feed, {
          headers: {
            'Content-Type': 'application/xml',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Add to feed
      if (request.method === 'POST') {
        const data = await request.json();
        await addToLinkedInFeed(data, env);
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response('Method not allowed', { status: 405 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(error.message, { status: 500 });
    }
  }
};