import { logger } from './logger.js';

const craftLogger = logger.child({ module: 'CRAFT-API' });

/**
 * Craft CMS API utility for Canada Healthwatch
 * Handles posting articles to Craft CMS with proper field mapping
 */
export class CraftAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.CRAFT_BASE_URL;
    this.apiToken = options.apiToken || process.env.CRAFT_API_TOKEN;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`,
      'Accept': 'application/json'
    };
  }

  /**
   * Create a new article entry in Craft CMS
   * @param {Object} articleData - The article data from healthwatchifier
   * @param {Object} craftOptions - Craft-specific options (topics, regions)
   * @returns {Promise<Object>} - The created entry response
   */
  async createArticle(articleData, craftOptions = {}) {
    try {
      craftLogger.info('Creating article in Craft CMS', { 
        headline: articleData.headline,
        publication: articleData.publication,
        articleType: articleData.articleType
      });

      // Map healthwatchifier data to Craft fields
      const craftEntry = this.mapToCraftFields(articleData, craftOptions);
      
      const response = await fetch(`${this.baseUrl}/entries`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(craftEntry)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Craft API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      craftLogger.info('Article created successfully', { entryId: result.id, slug: result.slug });
      
      return result;
    } catch (error) {
      craftLogger.error('Failed to create article', { error: error.message });
      throw error;
    }
  }

  /**
   * Upload an image to Craft's asset system
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} filename - Desired filename for the asset
   * @returns {Promise<Object>} - The uploaded asset response
   */
  async uploadImage(imageUrl, filename) {
    try {
      craftLogger.info('Uploading image to Craft', { imageUrl, filename });

      // First, fetch the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.blob();
      
      // Create form data for asset upload
      const formData = new FormData();
      formData.append('assets-upload', imageBlob, filename);
      formData.append('folderId', '1'); // Default folder - adjust as needed

      const uploadHeaders = {
        'Authorization': `Bearer ${this.apiToken}`
        // Don't set Content-Type for FormData - let browser set it with boundary
      };

      const response = await fetch(`${this.baseUrl}/assets`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Asset upload error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      craftLogger.info('Image uploaded successfully', { assetId: result.id, filename: result.filename });
      
      return result;
    } catch (error) {
      craftLogger.error('Failed to upload image', { error: error.message, imageUrl });
      throw error;
    }
  }

  /**
   * Map healthwatchifier data to Craft CMS field structure
   * @param {Object} articleData - Article data from scraping
   * @param {Object} craftOptions - Topics, regions, etc.
   * @returns {Object} - Craft entry data structure
   */
  mapToCraftFields(articleData, craftOptions) {
    const { topics = [], regions = [] } = craftOptions;
    
    // Determine section based on article type
    const section = articleData.articleType === 'opinion' ? 'Opinions' : 'News';
    
    const craftEntry = {
      sectionId: section === 'News' ? 2 : 3, // Adjust these IDs based on your Craft setup
      typeId: 1, // Article External type ID - adjust as needed
      title: articleData.headline,
      slug: this.generateSlug(articleData.headline),
      enabled: true,
      fields: {
        // Core fields
        url: articleData.url,
        publication: articleData.publication,
        paywalled: articleData.isPaywalled || false,
        
        // Topics and Regions (assuming these are categories/relations)
        topics: topics,
        regions: regions,
        
        // Only include author for Opinion articles
        ...(section === 'Opinions' && articleData.authors && articleData.authors.length > 0 && {
          author: articleData.authors.join(', ')
        })
      }
    };

    // Handle image if present
    if (articleData.image) {
      craftEntry.fields.photo = articleData.image; // Will need to be replaced with asset ID after upload
    }

    craftLogger.debug('Mapped Craft entry', { craftEntry });
    return craftEntry;
  }

  /**
   * Generate a URL-friendly slug from a headline
   * @param {string} headline - The article headline
   * @returns {string} - URL-friendly slug
   */
  generateSlug(headline) {
    return headline
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100); // Limit length
  }

  /**
   * Test the connection to Craft CMS API
   * @returns {Promise<boolean>} - Whether the connection is successful
   */
  async testConnection() {
    try {
      craftLogger.info('Testing Craft CMS connection');
      
      const response = await fetch(`${this.baseUrl}/entries?limit=1`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
      }

      craftLogger.info('Craft CMS connection successful');
      return true;
    } catch (error) {
      craftLogger.error('Craft CMS connection failed', { error: error.message });
      return false;
    }
  }
}

export default CraftAPI; 