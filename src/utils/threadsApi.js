import { logger } from './logger.js';

const threadsLogger = logger.child('THREADS');

export class ThreadsAPI {
  constructor() {
    this.baseUrl = 'https://graph.threads.net/v1.0';
  }

  /**
   * Step 1: Create a Threads media container (following official docs exactly)
   */
  async createContainer(userId, accessToken, mediaType, text, imageUrl = null) {
    try {
      threadsLogger.info('Creating Threads container', { 
        userId, 
        mediaType, 
        textLength: text?.length,
        hasImage: !!imageUrl 
      });

      // Build query parameters exactly as shown in official docs
      const params = new URLSearchParams({
        media_type: mediaType,
        access_token: accessToken
      });

      // Add text parameter (required for TEXT posts)
      if (text) {
        params.append('text', text);
      }

      // Add image_url parameter for IMAGE posts
      if (imageUrl && mediaType === 'IMAGE') {
        params.append('image_url', imageUrl);
      }

      // Use query parameters only, no JSON body (as per official docs)
      const url = `${this.baseUrl}/${userId}/threads?${params.toString()}`;
      
      // 🔍 DEBUG: Log the exact URL and parameters we're sending
      threadsLogger.info('Threads API call details', {
        baseUrl: this.baseUrl,
        userId,
        mediaType,
        textPreview: text ? text.substring(0, 100) + '...' : 'null',
        textLength: text?.length || 0,
        hasImageUrl: !!imageUrl,
        fullUrl: url.length > 200 ? url.substring(0, 200) + '...' : url,
        paramsString: params.toString()
      });
      
      // 🔍 FINAL URL CHECK: Log exactly what we're about to fetch
      threadsLogger.info('Final container URL about to be fetched', { 
        url: url,
        method: 'POST'
      });
      
      // 🧪 EXPERIMENT: Try JSON body approach instead of query params
      const useJsonBody = true; // Toggle this for testing
      
      let response;
      if (useJsonBody) {
        // JSON body approach (as suggested by user research)
        const jsonBody = {
          media_type: mediaType,
          text: text,
          access_token: accessToken
        };
        
        if (imageUrl && mediaType === 'IMAGE') {
          jsonBody.image_url = imageUrl;
        }
        
        threadsLogger.info('Using JSON body approach', { jsonBody });
        
        response = await fetch(`${this.baseUrl}/${userId}/threads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonBody)
        });
      } else {
        // Original query params approach
        response = await fetch(url, {
          method: 'POST',
          // No Authorization header needed - access_token is in query params
          // No Content-Type header needed - no JSON body
        });
      }

      const data = await response.text();
      
      // 🔍 LOG RATE LIMIT HEADERS: Check for rate limiting information
      const headers = {};
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().includes('usage') || 
            key.toLowerCase().includes('limit') || 
            key.toLowerCase().includes('rate') ||
            key.toLowerCase().startsWith('x-')) {
          headers[key] = value;
        }
      });
      
      if (Object.keys(headers).length > 0) {
        threadsLogger.info('Rate limiting headers detected', { headers });
      }
      
      threadsLogger.info('Threads container API response', { 
        status: response.status,
        data: data.substring(0, 500) // Log first 500 chars
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(data);
        } catch (e) {
          errorData = { message: data };
        }
        
        threadsLogger.error('Threads container creation error', { 
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          error: errorData.error,
          errorMessage: errorData.error?.message || errorData.message,
          fullResponse: data
        });
        
        throw new Error(`Container creation failed (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
      }

      const result = JSON.parse(data);
      
      if (!result.id) {
        throw new Error('No container ID returned from Threads API');
      }

      threadsLogger.info('Threads container created successfully', { 
        containerId: result.id 
      });

      return result.id;

    } catch (error) {
      threadsLogger.error('Error creating Threads container', { error: error.message });
      throw error;
    }
  }

  /**
   * Step 2: Publish a Threads media container (following official docs exactly)
   */
  async publishContainer(userId, accessToken, creationId) {
    try {
      threadsLogger.info('Publishing Threads container', { 
        userId, 
        creationId 
      });

      // Build query parameters exactly as shown in official docs
      const params = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken
      });

      const url = `${this.baseUrl}/${userId}/threads_publish?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'POST',
        // No Authorization header needed - access_token is in query params
        // No Content-Type header needed - no JSON body
      });

      const data = await response.text();
      
      threadsLogger.info('Threads publish API response', { 
        status: response.status,
        data: data.substring(0, 500)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(data);
        } catch (e) {
          errorData = { message: data };
        }
        
        threadsLogger.error('Threads publish error', { 
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          fullResponse: data
        });
        
        throw new Error(`Publish failed (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
      }

      const result = JSON.parse(data);
      
      if (!result.id) {
        throw new Error('No media ID returned from Threads publish API');
      }

      threadsLogger.info('Threads post published successfully', { 
        mediaId: result.id 
      });

      return result.id;

    } catch (error) {
      threadsLogger.error('Error publishing Threads container', { error: error.message });
      throw error;
    }
  }

  /**
   * Post text-only to Threads (complete workflow)
   */
  async postTextOnly(userId, accessToken, text) {
    try {
      // 🧪 TEMPORARY: Use super simple test text to isolate content issues
      text = "Hello Threads! Testing from our app!";
      
      // Truncate text to 500 characters (official limit)
      if (text.length > 500) {
        text = text.substring(0, 497) + '...';
      }

      threadsLogger.info('Creating text-only Threads post', { 
        userId, 
        textLength: text.length,
        actualText: text
      });

      // Step 1: Create container with media_type=TEXT (AFTER text override)
      const containerId = await this.createContainer(userId, accessToken, 'TEXT', text);

      // Step 2: Publish container
      const mediaId = await this.publishContainer(userId, accessToken, containerId);

      return { 
        success: true, 
        mediaId,
        containerId,
        message: 'Text post published successfully' 
      };

    } catch (error) {
      threadsLogger.error('Error posting text to Threads', { error: error.message });
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Post image with text to Threads (complete workflow)
   */
  async postImageWithText(userId, accessToken, text, imageUrl) {
    try {
      // Truncate text to 500 characters (official limit)
      if (text.length > 500) {
        text = text.substring(0, 497) + '...';
      }

      threadsLogger.info('Creating image Threads post', { 
        userId, 
        textLength: text.length,
        imageUrl 
      });

      // Step 1: Create container with media_type=IMAGE
      const containerId = await this.createContainer(userId, accessToken, 'IMAGE', text, imageUrl);

      // Step 2: Publish container  
      const mediaId = await this.publishContainer(userId, accessToken, containerId);

      return { 
        success: true, 
        mediaId,
        containerId,
        message: 'Image post published successfully' 
      };

    } catch (error) {
      threadsLogger.error('Error posting image to Threads', { error: error.message });
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Complete workflow: Post text + optional image to Threads
   */
  async postToThreads(userId, accessToken, text, imageUrl = null) {
    try {
      // For now, always post text-only to test authentication
      return await this.postTextOnly(userId, accessToken, text);
      
      /* TODO: Re-enable once text posting works
      if (imageUrl) {
        return await this.postImageWithText(userId, accessToken, text, imageUrl);
      } else {
        return await this.postTextOnly(userId, accessToken, text);
      }
      */
    } catch (error) {
      threadsLogger.error('Error posting to Threads', { error: error.message });
      return { success: false, error: error.message };
    }
  }
} 