import { logger } from '../utils/logger.js';
import { CraftAPI } from '../utils/craftApi.js';
import { createResponse } from '../utils/response.js';

const craftTestLogger = logger.child({ module: 'CRAFT-TEST-API' });

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'GET') {
      return createResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      craftTestLogger.info('Testing Craft CMS connection');

      // Initialize Craft API
      const craftApi = new CraftAPI({
        baseUrl: env.CRAFT_BASE_URL,
        apiToken: env.CRAFT_API_TOKEN
      });

      // Test connection
      const connectionOk = await craftApi.testConnection();

      if (connectionOk) {
        craftTestLogger.info('Craft CMS connection test successful');
        return createResponse({
          success: true,
          message: 'Craft CMS connection successful!',
          baseUrl: env.CRAFT_BASE_URL ? 'configured' : 'missing',
          apiToken: env.CRAFT_API_TOKEN ? 'configured' : 'missing'
        });
      } else {
        craftTestLogger.error('Craft CMS connection test failed');
        return createResponse({
          success: false,
          error: 'Craft CMS connection failed',
          baseUrl: env.CRAFT_BASE_URL ? 'configured' : 'missing',
          apiToken: env.CRAFT_API_TOKEN ? 'configured' : 'missing'
        }, 500);
      }

    } catch (error) {
      craftTestLogger.error('Craft test error', { 
        error: error.message,
        stack: error.stack 
      });

      return createResponse({
        success: false,
        error: error.message || 'Craft test failed',
        baseUrl: env.CRAFT_BASE_URL ? 'configured' : 'missing',
        apiToken: env.CRAFT_API_TOKEN ? 'configured' : 'missing'
      }, 500);
    }
  }
}; 