import { BlueskyAPI } from '../utils/blueskyApi.js';

export default {
  async fetch(request, env, ctx) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data = await request.json();
      const { text, imageUrl, altText } = data;

      // Get credentials from Cloudflare secrets
      const handle = env.BLUESKY_HANDLE;
      const appPassword = env.BLUESKY_APP_PASSWORD;

      // Validate required fields
      if (!handle || !appPassword) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing Bluesky credentials in environment variables'
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      if (!text) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required field: text'
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Create Bluesky API instance and post
      const blueskyApi = new BlueskyAPI();
      const result = await blueskyApi.postToBluesky(
        handle, 
        appPassword, 
        text, 
        imageUrl || null, 
        altText || ''
      );

      return new Response(JSON.stringify({
        success: true,
        message: 'Posted to Bluesky successfully!',
        uri: result.uri,
        cid: result.cid
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Error in Bluesky post:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message
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