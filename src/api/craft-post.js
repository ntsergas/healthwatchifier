import { logger } from '../utils/logger.js';
import { CraftAPI } from '../utils/craftApi.js';
import { createResponse } from '../utils/response.js';

const craftPostLogger = logger.child({ module: 'CRAFT-POST-API' });

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
      return createResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const requestData = await request.json();
      craftPostLogger.info('Craft post request received', { 
        headline: requestData.headline,
        publication: requestData.publication 
      });

      // Validate required fields
      const { headline, url, publication, articleType } = requestData;
      if (!headline || !url || !publication || !articleType) {
        return createResponse({ 
          error: 'Missing required fields: headline, url, publication, articleType' 
        }, 400);
      }

      // Extract Craft-specific options
      const { topics = [], regions = [] } = requestData;
      const craftOptions = { topics, regions };

      // Initialize Craft API
      const craftApi = new CraftAPI({
        baseUrl: env.CRAFT_BASE_URL,
        apiToken: env.CRAFT_API_TOKEN
      });

      // Test connection first
      const connectionOk = await craftApi.testConnection();
      if (!connectionOk) {
        return createResponse({ 
          error: 'Unable to connect to Craft CMS. Please check API configuration.' 
        }, 500);
      }

      // Handle image upload if present
      let imageAssetId = null;
      if (requestData.image) {
        try {
          const imageFilename = `${Date.now()}-${requestData.headline.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.jpg`;
          const uploadedAsset = await craftApi.uploadImage(requestData.image, imageFilename);
          imageAssetId = uploadedAsset.id;
          craftPostLogger.info('Image uploaded for article', { assetId: imageAssetId });
        } catch (imageError) {
          craftPostLogger.warn('Image upload failed, proceeding without image', { 
            error: imageError.message 
          });
          // Continue without image rather than failing the entire post
        }
      }

      // Prepare article data
      const articleData = {
        headline,
        url,
        publication,
        articleType,
        authors: requestData.authors || [],
        isPaywalled: requestData.isPaywalled || false,
        image: imageAssetId // Use asset ID instead of URL
      };

      // Create the article in Craft
      const result = await craftApi.createArticle(articleData, craftOptions);

      craftPostLogger.info('Article posted to Craft successfully', { 
        entryId: result.id,
        headline: requestData.headline 
      });

      return createResponse({
        success: true,
        message: 'Article published to web successfully!',
        entryId: result.id,
        slug: result.slug,
        url: `https://canadahealthwatch.ca/${result.slug}` // Adjust URL pattern as needed
      });

    } catch (error) {
      craftPostLogger.error('Craft post failed', { 
        error: error.message,
        stack: error.stack 
      });

      return createResponse({
        success: false,
        error: error.message || 'Failed to publish to web'
      }, 500);
    }
  }
}; 