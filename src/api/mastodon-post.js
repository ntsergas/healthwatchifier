import { MastodonAPI } from '../utils/mastodonApi.js';
import { logger } from '../utils/logger.js';

const mastodonPostLogger = logger.child('MASTODON-POST');

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { text, imageUrl, altText } = await request.json();

      // Validate required fields
      if (!text?.trim()) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Text content is required' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get credentials from environment
      const accessToken = env.MASTODON_ACCESS_TOKEN;
      const instanceUrl = env.MASTODON_INSTANCE_URL;
      
      if (!accessToken || !instanceUrl) {
        mastodonPostLogger.error('Missing Mastodon credentials in environment', { 
          hasAccessToken: !!accessToken,
          hasInstanceUrl: !!instanceUrl
        });
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Mastodon credentials not configured' 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create Mastodon API instance
      const mastodonApi = new MastodonAPI(instanceUrl);
      mastodonApi.setAccessToken(accessToken);

      // Post to Mastodon
      const result = await mastodonApi.postToMastodon(
        text,
        imageUrl || null,
        altText || ''
      );

      mastodonPostLogger.info('Successfully posted to Mastodon', { id: result.id });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Posted to Mastodon successfully',
        data: result
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      mastodonPostLogger.error('Error in mastodon-post endpoint', { error: error.message });
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}; 