import { LinkedInAPI } from '../utils/linkedinApi.js';
import { logger } from '../utils/logger.js';

const linkedinPostLogger = logger.child('LINKEDIN-POST');

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
      const { text, imageUrl, articleUrl } = await request.json();

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
      const accessToken = env.LINKEDIN_ACCESS_TOKEN;
      const personId = env.LINKEDIN_PERSON_ID;
      
      if (!accessToken || !personId) {
        linkedinPostLogger.error('Missing LinkedIn credentials in environment', { 
          hasAccessToken: !!accessToken,
          hasPersonId: !!personId
        });
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'LinkedIn credentials not configured' 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create LinkedIn API instance
      const linkedinApi = new LinkedInAPI();

      // Post to LinkedIn
      const result = await linkedinApi.postToLinkedIn(
        accessToken,
        personId,
        text,
        imageUrl || null,
        articleUrl || null
      );

      if (result.success) {
        linkedinPostLogger.info('Successfully posted to LinkedIn');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Posted to LinkedIn successfully',
          data: result.data
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        linkedinPostLogger.error('Failed to post to LinkedIn', { error: result.error });
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
      linkedinPostLogger.error('Error in linkedin-post endpoint', { error: error.message });
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