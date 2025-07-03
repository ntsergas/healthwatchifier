import { logger } from '../utils/logger.js';
import { CraftAPI } from '../utils/craftApi.js';
import { jsonResponse } from '../utils/response.js';

const craftPostLogger = logger.child({ module: 'CRAFT-POST-API' });

// List of allowed origins
const ALLOWED_ORIGINS = [
  'https://strikethroughediting.ca',
  'https://canadahealthwatch.ca',
  // Add localhost for development
  'http://localhost:8787',
  'http://127.0.0.1:8787'
];

// Helper to validate and get the origin
function getValidatedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return ALLOWED_ORIGINS[0]; // Default to primary domain if invalid
  }
  return origin;
}

export default {
  async fetch(request, env, ctx) {
    const origin = getValidatedOrigin(request);

    // Common CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Vary': 'Origin' // Important for CDN caching
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204, // No Content is more appropriate for OPTIONS
        headers: corsHeaders
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    try {
      const requestData = await request.json();
      craftPostLogger.info('Craft post request received', { 
        headline: requestData.headline,
        publication: requestData.publication,
        articleType: requestData.articleType
      });

      // Validate required fields
      const { headline, url, publication, articleType } = requestData;
      if (!headline || !url || !publication || !articleType) {
        return jsonResponse({ 
          error: 'Missing required fields: headline, url, publication, articleType' 
        }, 400, corsHeaders);
      }

      // Extract Craft-specific options
      const { topics = [], regions = [], authorId = 25385 } = requestData;
      const craftOptions = { topics, regions, authorId };

      // Initialize Craft API
      const craftApi = new CraftAPI(env.CRAFT_API_TOKEN);

      // Check if API token is available
      if (!env.CRAFT_API_TOKEN) {
        return jsonResponse({ 
          error: 'Craft API token not configured. Please set CRAFT_API_TOKEN secret.' 
        }, 500, corsHeaders);
      }

      // Test connection first
      try {
        await craftApi.testConnection();
        craftPostLogger.info('Craft CMS connection successful');
      } catch (connectionError) {
        craftPostLogger.error('Craft CMS connection failed', { error: connectionError.message });
        return jsonResponse({ 
          error: 'Unable to connect to Craft CMS. Please check API configuration.' 
        }, 500, corsHeaders);
      }

      // Prepare article data for GraphQL
      const articleData = {
        headline,
        title: requestData.headline, // Match fallback logic in CraftAPI
        url,
        publication,
        articleType,
        authors: requestData.authors || [],
        isPaywalled: requestData.isPaywalled || false,
        image: requestData.image // CraftAPI will handle image upload internally
      };

      // Log full payload before creating article
      craftPostLogger.info('Full payload for createArticle', { 
        articleData,
        craftOptions,
        hasImage: !!requestData.image,
        topicsCount: craftOptions.topics?.length || 0,
        regionsCount: craftOptions.regions?.length || 0
      });

      // Create the article in Craft using GraphQL
      let result;
      try {
        result = await craftApi.createArticle(articleData, craftOptions);
      } catch (createError) {
        craftPostLogger.error('Article creation failed', {
          error: createError.message,
          stack: createError.stack,
          articleData: {
            headline: articleData.headline,
            url: articleData.url,
            publication: articleData.publication,
            articleType: articleData.articleType,
            hasAuthors: articleData.authors?.length > 0,
            hasImage: !!articleData.image,
            isPaywalled: articleData.isPaywalled
          },
          craftOptions: {
            topics: craftOptions.topics,
            regions: craftOptions.regions,
            authorId: craftOptions.authorId
          }
        });
        throw createError;
      }

      craftPostLogger.info('Article posted to Craft successfully', { 
        entryId: result.id,
        headline: requestData.headline,
        slug: result.slug,
        uri: result.uri
      });

      return jsonResponse({
        success: true,
        message: 'Article published to web successfully!',
        entryId: result.id,
        slug: result.slug,
        uri: result.uri,
        url: `https://canadahealthwatch.ca/${result.uri}`,
        articleData: {
          articleUrl: result.articleUrl,
          articlePublication: result.articlePublication,
          articleAuthor: result.articleAuthor,
          articlePaywalled: result.articlePaywalled,
          publishStatus: result.publishStatus,
          articleSection: result.articleSection,
          articlePhoto: result.articlePhoto
        },
        originalInput: requestData // Store original request for debugging/replay
      }, 200, corsHeaders);

    } catch (error) {
      craftPostLogger.error('Craft post failed', { 
        error: error.message,
        stack: error.stack 
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to publish to web';
      if (error.message.includes('GraphQL errors')) {
        errorMessage = 'Craft CMS validation error. Please check field requirements.';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Craft CMS authentication failed. Please check API token.';
      } else if (error.message.includes('Failed to fetch image')) {
        errorMessage = 'Image upload failed. Article may be posted without image.';
      }

      return jsonResponse({
        success: false,
        error: errorMessage,
        details: error.message
      }, 500, corsHeaders);
    }
  }
}; 