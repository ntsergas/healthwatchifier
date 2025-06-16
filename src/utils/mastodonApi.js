import { logger } from './logger.js';

const mastodonLogger = logger.child('MASTODON');

export class MastodonAPI {
  constructor(instanceUrl) {
    this.baseUrl = instanceUrl;
    this.accessToken = null;
  }

  /**
   * Initialize the API with an access token
   */
  setAccessToken(token) {
    this.accessToken = token;
    mastodonLogger.info('Mastodon API initialized');
  }

  /**
   * Post text content to Mastodon
   * @param {string} text - The text content to post
   * @param {string} visibility - Post visibility: "public", "unlisted", "private", or "direct"
   * @returns {Promise<Object>} - Response from Mastodon API
   */
  async createTextPost(text, visibility = 'public') {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated. Call setAccessToken() first.');
      }

      mastodonLogger.info('Creating text post', { textLength: text.length });

      const response = await fetch(`${this.baseUrl}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: text,
          visibility
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Post creation failed: ${error.error || response.statusText}`);
      }

      const result = await response.json();
      mastodonLogger.info('Text post created successfully', { id: result.id });

      return {
        success: true,
        id: result.id,
        url: result.url
      };

    } catch (error) {
      mastodonLogger.error('Error creating text post', { error: error.message });
      throw error;
    }
  }

  /**
   * Upload media to Mastodon
   * @param {Uint8Array} mediaBuffer - The media file buffer
   * @param {string} description - Alt text for the media
   * @param {string} mimeType - MIME type of the media
   * @returns {Promise<string>} - Media ID from Mastodon
   */
  async uploadMedia(mediaBuffer, description = '', mimeType = 'image/jpeg') {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated. Call setAccessToken() first.');
      }

      mastodonLogger.info('Uploading media to Mastodon', { 
        size: mediaBuffer.length,
        mimeType 
      });

      // Create form data for the upload
      const formData = new FormData();
      const blob = new Blob([mediaBuffer], { type: mimeType });
      formData.append('file', blob);
      
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch(`${this.baseUrl}/api/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Media upload failed: ${error.error || response.statusText}`);
      }

      const result = await response.json();
      mastodonLogger.info('Media uploaded successfully', { id: result.id });

      return result.id;

    } catch (error) {
      mastodonLogger.error('Error uploading media', { error: error.message });
      throw error;
    }
  }

  /**
   * Post text with media to Mastodon
   * @param {string} text - The text content to post
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} altText - Alt text for the image
   * @param {string} visibility - Post visibility
   * @returns {Promise<Object>} - Response from Mastodon API
   */
  async createMediaPost(text, imageUrl, altText = '', visibility = 'public') {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated. Call setAccessToken() first.');
      }

      mastodonLogger.info('Creating media post', { 
        textLength: text.length,
        imageUrl 
      });

      // First fetch the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Upload the media first
      const mediaId = await this.uploadMedia(
        new Uint8Array(imageBuffer),
        altText,
        mimeType
      );

      // Create the post with the media
      const response = await fetch(`${this.baseUrl}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: text,
          media_ids: [mediaId],
          visibility
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Post creation failed: ${error.error || response.statusText}`);
      }

      const result = await response.json();
      mastodonLogger.info('Media post created successfully', { id: result.id });

      return {
        success: true,
        id: result.id,
        url: result.url
      };

    } catch (error) {
      mastodonLogger.error('Error creating media post', { error: error.message });
      throw error;
    }
  }

  /**
   * Main posting method - handles both text and media posts
   * @param {string} text - The text content to post
   * @param {string} imageUrl - Optional URL of image to include
   * @param {string} altText - Optional alt text for the image
   * @param {string} visibility - Post visibility
   * @returns {Promise<Object>} - Response from Mastodon API
   */
  async postToMastodon(text, imageUrl = null, altText = '', visibility = 'public') {
    try {
      if (imageUrl) {
        return await this.createMediaPost(text, imageUrl, altText, visibility);
      } else {
        return await this.createTextPost(text, visibility);
      }
    } catch (error) {
      mastodonLogger.error('Error posting to Mastodon', { error: error.message });
      throw error;
    }
  }
} 