import { ThreadsAPI } from '../utils/threadsApi.js';
import { logger } from '../utils/logger.js';

const threadsPostLogger = logger.child('THREADS-POST');

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
      const { headline, imageUrl, caption } = await request.json();

      // Validate required fields
      if (!headline?.trim()) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Headline is required' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get credentials from environment
      const accessToken = env.THREADS_ACCESS_TOKEN;
      const userId = env.THREADS_USER_ID;
      
      if (!accessToken || !userId) {
        threadsPostLogger.error('Missing Threads credentials in environment', { 
          hasAccessToken: !!accessToken,
          hasUserId: !!userId
        });
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Threads credentials not configured' 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create Threads API instance
      const threadsApi = new ThreadsAPI();

      // Post to Threads (FIXED PARAMETER ORDER!)
      const result = await threadsApi.postToThreads(
        userId,         // ✅ CORRECT: User ID first
        accessToken,    // ✅ CORRECT: Access token second  
        headline,       // ✅ CORRECT: Text third
        imageUrl || null // ✅ CORRECT: Image URL fourth
      );

      if (result.success) {
        threadsPostLogger.info('Successfully posted to Threads');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Posted to Threads successfully',
          data: result.data
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        threadsPostLogger.error('Failed to post to Threads', { error: result.error });
        return new Response(JSON.stringify({ 
          success: false, 
          error: result.error 
        }), { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

    } catch (error) {
      threadsPostLogger.error('Error in threads-post endpoint', { error: error.message });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
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