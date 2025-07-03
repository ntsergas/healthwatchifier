import { logger } from './logger.js';
import { PUBLICATION_IDS } from './publication-constants.js';
import { AUTHOR_IDS } from './authors-constants.js';

const craftLogger = logger.child({ module: 'CRAFT-API' });

// Craft CMS GraphQL API endpoint
const CRAFT_GRAPHQL_ENDPOINT = 'https://canadahealthwatch.ca/index.php?action=graphql/api';

// Hardcoded section IDs from Craft CMS (ensure integers)
const NEWS_SECTION_ID = parseInt(20, 10);
const OPINION_SECTION_ID = parseInt(60803, 10);

// Hardcoded region IDs from Craft CMS (ensure integers)
const REGION_IDS = {
  WEST: parseInt(42382, 10),
  QUEBEC: parseInt(46536, 10),
  PRAIRIES: parseInt(42383, 10),
  ONTARIO: parseInt(47388, 10),
  NORTH: parseInt(46537, 10),
  ATLANTIC: parseInt(42385, 10)
};

const TOPIC_IDS = {
  'CANADA': parseInt(26320, 10),
  'US': parseInt(26836, 10),
  'INTERNATIONAL': parseInt(26321, 10),
  'TECHNOLOGY': parseInt(26322, 10),
  'POLICY': parseInt(26323, 10),
  'OPINION': parseInt(26835, 10),
  'RESEARCH': parseInt(37224, 10),
  'PHARMA': parseInt(41889, 10),
  'COVID': parseInt(69275, 10),
  'BUSINESS': parseInt(69276, 10),
  'H5N1': parseInt(102010, 10)
};

// Utility to cast arrays to string arrays for GraphQL [ID] fields
const toStringArray = arr => arr?.filter(Boolean).map(id => String(id));

// Utility to cast [Int] fields to numbers for Craft GraphQL
function normalizeCraftIds(entryData, keys = []) {
  keys.forEach(key => {
    if (Array.isArray(entryData[key])) {
      entryData[key] = entryData[key].map(val => Number(val));
    } else if (typeof entryData[key] === 'string') {
      entryData[key] = Number(entryData[key]);
    }
  });
}

/**
 * Craft CMS GraphQL API utility for Canada Healthwatch
 * Handles posting articles to Craft CMS with proper field mapping
 */
export class CraftAPI {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.graphqlEndpoint = CRAFT_GRAPHQL_ENDPOINT;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`,
      'Accept': 'application/json'
    };
  }

  /**
   * Execute a GraphQL mutation or query
   * @param {string} query - The GraphQL query/mutation
   * @param {Object} variables - Variables for the query
   * @returns {Promise<Object>} - The GraphQL response
   */
  async executeGraphQL(query, variables = {}) {
    try {
      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      // Return the full result (including potential errors) for proper handling
      return result;
    } catch (error) {
      craftLogger.error('GraphQL request failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new article entry in Craft CMS using GraphQL
   * @param {Object} articleData - The article data from healthwatchifier
   * @param {Object} craftOptions - Craft-specific options (topics, regions)
   * @returns {Promise<Object>} - The created entry response
   */
  async createArticle(articleData, craftOptions = {}) {
    try {
      craftLogger.info('Creating article in Craft CMS', { 
        headline: articleData.headline,
        publication: articleData.publication,
        articleType: articleData.articleType,
        hasImage: !!articleData.image,
        craftOptions: {
          topicsCount: craftOptions.topics?.length || 0,
          regionsCount: craftOptions.regions?.length || 0,
          authorId: craftOptions.authorId
        }
      });

      // First upload image if present
      let photoAssetId;  // Don't initialize to null
      if (articleData.image) {
        craftLogger.info('Article has image, starting upload process', {
          imageUrl: articleData.image,
          imageUrlLength: articleData.image?.length,
          isDataUrl: articleData.image?.startsWith('data:'),
          isHttpUrl: articleData.image?.startsWith('http')
        });
        
        try {
          const filename = this.generateImageFilename(articleData.headline);
          craftLogger.debug('Generated filename for image', { 
            originalHeadline: articleData.headline,
            generatedFilename: filename 
          });
          
          const uploadedAsset = await this.uploadImage(articleData.image, filename);
          photoAssetId = parseInt(uploadedAsset.id); // Ensure it's an integer
          
          craftLogger.info('Image upload completed successfully', { 
            photoAssetId,
            assetUrl: uploadedAsset.url,
            assetFilename: uploadedAsset.filename,
            assetSize: uploadedAsset.size
          });
        } catch (imageError) {
          craftLogger.error('Image upload failed, continuing without image', { 
            error: imageError.message,
            imageUrl: articleData.image?.substring(0, 100) + '...', // Truncate for logging
            stack: imageError.stack,
            errorType: imageError.constructor.name
          });
          // Continue without image rather than failing the whole request
          photoAssetId = null; // Explicitly set to null on failure
        }
      } else {
        craftLogger.debug('No image provided with article');
      }

      // Map healthwatchifier data to Craft fields
      const entryData = await this.mapToCraftFields(articleData, craftOptions, photoAssetId);
      
      // Always keep authorId as string, but cast all [Int] fields to numbers
      normalizeCraftIds(entryData, [
        'articlePhoto',
        'articleTopic',
        'articleRegion',
        'articleSection',
        'articlePublication',
        'articleAuthor'
      ]);
      
      // Log the mapped data before executing GraphQL
      craftLogger.debug('Mapped entry data', { 
        entryData: {
          ...entryData,
          articlePhoto: entryData.articlePhoto ? 'present' : 'omitted'
        }
      });

      // Log the exact payload being sent to Craft
      craftLogger.info('Sending entryData to executeGraphQL', { entryData });

      const mutation = `
      mutation PushArticle(
        $authorId: ID!
        $title: String!
        $articleUrl: String!
        $articlePhoto: [Int]
        $enabled: Boolean
        $articleTopic: [Int]
        $articleRegion: [Int]
        $articleAuthor: [Int]
        $articlePaywalled: Boolean
        $articleSection: [Int]
        $articlePublication: [Int]
      ) {
        save_article_articleExternal_Entry(
          authorId: $authorId
          title: $title
          articleUrl: $articleUrl
          articlePhoto: $articlePhoto
          enabled: $enabled
          articleTopic: $articleTopic
          articleRegion: $articleRegion
          articleAuthor: $articleAuthor
          articlePaywalled: $articlePaywalled
          articleSection: $articleSection
          articlePublication: $articlePublication
        ) {
          id
          title
          slug
          uri
          dateCreated
          articleUrl
          articleAuthor {
            id
            title
          }
          articlePaywalled
          articlePublication {
            id
            title
          }
          articleSection {
            id
            title
          }
        }
      }
    `;     

      const result = await this.executeGraphQL(mutation, entryData);
      
      // Check for GraphQL errors first
      if (result.errors) {
        craftLogger.error('GraphQL validation errors', { 
          errors: result.errors,
          variables: {
            ...entryData
          }
        });
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      // Check for missing entry data
      if (!result?.data?.save_article_articleExternal_Entry) {
        craftLogger.error('No entry returned after article creation', { 
          result,
          variables: {
            ...entryData
          }
        });
        throw new Error('Craft CMS returned success but no entry data');
      }
      
      const createdEntry = result.data.save_article_articleExternal_Entry;
      
      craftLogger.info('Article created successfully', { 
        entryId: createdEntry.id, 
        slug: createdEntry.slug,
        uri: createdEntry.uri,
        photoIncluded: !!entryData.articlePhoto,
        topicsIncluded: entryData.articleTopic?.length || 0,
        regionsIncluded: entryData.articleRegion?.length || 0
      });
      
      return createdEntry;
    } catch (error) {
      craftLogger.error('Failed to create article', { 
        error: error.message,
        stack: error.stack,
        articleData: {
          headline: articleData.headline,
          publication: articleData.publication,
          hasImage: !!articleData.image,
          articleType: articleData.articleType,
          hasAuthors: articleData.authors?.length > 0
        },
        craftOptions: {
          topicsCount: craftOptions.topics?.length || 0,
          regionsCount: craftOptions.regions?.length || 0,
          authorId: craftOptions.authorId
        }
      });
      throw error;
    }
  }

/**
 * Upload an image to Craft's Images CDN via GraphQL
 * Tries folderId 38 ("articles/") first, falls back to 37 (root) if needed
 * @param {string} imageUrl - Remote image URL
 * @param {string} filename - Desired filename
 * @returns {Promise<Object>} - The created asset
 */
async uploadImage(imageUrl, filename) {
  const mutation = `
    mutation UploadImage($_file: FileInput!, $newFolderId: ID) {
      save_imagesCDN_Asset(
        _file: $_file
        newFolderId: $newFolderId
        enabled: true
      ) {
        id
        url
        filename
        size
        width
        height
      }
    }
  `;

  const attemptUpload = async (folderId, label) => {
    const variables = {
      _file: { filename, url: imageUrl },
      newFolderId: folderId.toString()
    };

    craftLogger.info(`Attempting image upload to folder ${label}`, { folderId, filename });

    const result = await this.executeGraphQL(mutation, variables);
    const asset = result?.data?.save_imagesCDN_Asset;

    craftLogger.debug(`Upload result for folder ${label}`, {
      hasErrors: !!result.errors,
      hasAsset: !!asset,
      assetId: asset?.id,
      errors: result.errors
    });

    if (result.errors || !asset?.id) {
      throw new Error(`Upload to folder ${label} failed`);
    }

    craftLogger.info(`Image upload successful to folder ${label}`, {
      assetId: asset.id,
      filename: asset.filename,
      url: asset.url,
      dimensions: asset.width && asset.height ? `${asset.width}x${asset.height}` : 'unknown'
    });

    return asset;
  };

  try {
    return await attemptUpload("38", 'articles (38)');
  } catch (primaryError) {
    craftLogger.warn('Upload to folder 38 failed, attempting fallback to folder 37', {
      error: primaryError.message
    });

    try {
      return await attemptUpload("37", 'fallback root (37)');
    } catch (fallbackError) {
      craftLogger.error('Image upload failed in both primary and fallback folders', {
        primaryError: primaryError.message,
        fallbackError: fallbackError.message
      });
      throw fallbackError;
    }
  }
}

  /**
   * Map healthwatchifier data to Craft fields
   * @param {Object} articleData - Article data from scraping
   * @param {Object} craftOptions - Topics, regions, etc.
   * @param {number|null} photoAssetId - Uploaded photo asset ID
   * @returns {Object} - Craft entry input structure
   */
  async mapToCraftFields(articleData, craftOptions, photoAssetId = null) {
    // Validate required fields
    if (!articleData.headline && !articleData.title) {
      craftLogger.error('Missing required title/headline field', { articleData });
      throw new Error('Article title or headline is required');
    }

    const { topics = [], regions = [], authorId: defaultAuthorId = 25385 } = craftOptions; // Default to Nick Tsergas
    
    // Topics and regions are now sent as IDs from frontend, just ensure they're integers
    const topicIds = topics
      .filter(id => id) // Remove any falsy values
      .map(id => parseInt(id, 10)); // Ensure integers

    const regionIds = regions
      .filter(id => id) // Remove any falsy values
      .map(id => parseInt(id, 10)); // Ensure integers
    
    // Get publication ID from constants
    let publicationId = null;
    if (articleData.publication && PUBLICATION_IDS[articleData.publication.trim()]) {
      publicationId = PUBLICATION_IDS[articleData.publication.trim()];
      craftLogger.debug('Using publication from articleData', { publication: articleData.publication, publicationId });
    } else if (craftOptions.publication && PUBLICATION_IDS[craftOptions.publication.trim()]) {
      publicationId = PUBLICATION_IDS[craftOptions.publication.trim()];
      craftLogger.debug('Using publication from craftOptions', { publication: craftOptions.publication, publicationId });
    } else if (articleData.publication) {
      craftLogger.warn('Publication not found in PUBLICATION_IDS', {
        publication: articleData.publication,
        available: Object.keys(PUBLICATION_IDS)
      });
    }

    // Get author ID for opinion pieces
    let articleAuthorId = null;
    if (articleData.articleType === 'opinion' && articleData.authors?.length > 0) {
      // Combine multiple authors into a single string, just like they appear in Craft
      const combinedAuthorName = articleData.authors.join(', ');
      
      // Normalize accented characters and convert to uppercase, then replace spaces/punctuation with underscores
      const authorKey = combinedAuthorName
        .normalize('NFD')  // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '')  // Remove accent marks
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      articleAuthorId = AUTHOR_IDS[authorKey];

      craftLogger.debug('Author mapping attempt', {
        combinedAuthorName,
        normalizedName: combinedAuthorName.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        authorKey,
        foundId: articleAuthorId,
        articleType: articleData.articleType
      });

      if (!articleAuthorId) {
        craftLogger.warn('Author entry not found in AUTHOR_IDS', {
          combinedAuthorName,
          authorKey,
          authors: articleData.authors,
          available: Object.keys(AUTHOR_IDS).slice(0, 20) // Show first 20 for brevity
        });
      }
    }
    
              // Log incoming data for title field
    craftLogger.debug('Title field data', {
      headline: articleData.headline,
      title: articleData.title,
      finalTitle: articleData.headline || articleData.title
    });

    // Map to proper Craft fields based on the actual mutation arguments
    let sectionId;
    if (craftOptions.section) {
      sectionId = parseInt(craftOptions.section, 10);
      craftLogger.debug('Using section from craftOptions', { section: craftOptions.section, sectionId });
    } else {
      sectionId = parseInt(articleData.articleType?.toLowerCase() === 'opinion' ? OPINION_SECTION_ID : NEWS_SECTION_ID, 10);
      craftLogger.debug('Using section from articleType', { articleType: articleData.articleType, sectionId });
    }
    const entryData = {
      // Required fields per Craft documentation
      authorId: String(defaultAuthorId),
      title: articleData.headline || articleData.title, // Try headline first, fall back to title
      articleUrl: articleData.url,
      articleSection: toStringArray(sectionId ? [sectionId] : []),
      enabled: true,
    };

    // Only add optional fields if they have valid values - NEVER add empty arrays
    if (topicIds && topicIds.length > 0) {
      entryData.articleTopic = toStringArray(topicIds);
    }

    if (regionIds && regionIds.length > 0) {
      entryData.articleRegion = toStringArray(regionIds);
    }

    if (photoAssetId) {
      entryData.articlePhoto = toStringArray([parseInt(photoAssetId, 10)]);
    }

    if (articleAuthorId) {
      entryData.articleAuthor = toStringArray([parseInt(articleAuthorId, 10)]);
    }

    // Always set articlePaywalled explicitly
    if (typeof articleData.isPaywalled === 'boolean') {
      entryData.articlePaywalled = articleData.isPaywalled;
    }

    if (publicationId) {
      entryData.articlePublication = toStringArray([parseInt(publicationId, 10)]);
    }

    // Only add publishStatus if explicitly set in craftOptions or articleData
    if (craftOptions.publishStatus) {
      entryData.publishStatus = craftOptions.publishStatus;
    } else if (articleData.publishStatus) {
      entryData.publishStatus = articleData.publishStatus;
    }

    // Debug log to confirm we're not adding empty arrays
    craftLogger.debug('Final entryData before GraphQL', {
      hasArticleTopic: 'articleTopic' in entryData,
      hasArticleRegion: 'articleRegion' in entryData,
      hasArticlePhoto: 'articlePhoto' in entryData,
      hasArticleAuthor: 'articleAuthor' in entryData,
      hasArticlePublication: 'articlePublication' in entryData,
      articleTopicLength: entryData.articleTopic?.length,
      articleRegionLength: entryData.articleRegion?.length
    });

    return entryData;
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
   * Generate a filename for the uploaded image
   * @param {string} headline - The article headline
   * @returns {string} - Image filename
   */
  generateImageFilename(headline) {
    const slug = this.generateSlug(headline);
    const timestamp = Date.now();
    return `${slug}-${timestamp}.jpg`;
  }

  /**
   * Test the connection to Craft CMS GraphQL API
   * @returns {Promise<boolean>} - Whether the connection is successful
   */
  async testConnection() {
    try {
      craftLogger.info('Testing Craft CMS GraphQL connection');
      
      const query = `
        query TestConnection {
          entries(limit: 1) {
            id
            title
          }
        }
      `;

      const result = await this.executeGraphQL(query);
      
      if (result.errors) {
        throw new Error(`Connection test failed: ${JSON.stringify(result.errors)}`);
      }
      craftLogger.info('Craft CMS GraphQL connection successful');
      return true;
    } catch (error) {
      craftLogger.error('Craft CMS GraphQL connection failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get available topics for the topic field
   * @returns {Promise<Object>} - Map of topic names to their IDs
   */
  async getTopics() {
    try {
      const query = `
        query GetTopics {
          entries(section: "topic") {
            id
            title
          }
        }
      `;

      const result = await this.executeGraphQL(query);
      
      if (!result?.data?.entries) {
        craftLogger.warn('No topics found in Craft CMS');
        return {};
      }

      const topics = result.data.entries;
      const topicMap = {};
      for (const topic of topics) {
        topicMap[topic.title] = parseInt(topic.id);
      }

      craftLogger.debug('Fetched topics from Craft', { 
        count: topics.length,
        topics: topicMap
      });

      return topicMap;
    } catch (error) {
      craftLogger.error('Failed to fetch topics', { error: error.message });
      return {};
    }
  }

  /**
   * Get available regions for the region field
   * @returns {Promise<Array>} - Array of available regions
   */
  async getRegions() {
    try {
      const query = `
        query GetRegions {
          categoryGroups {
            name
            handle
            categories {
              id
              title
              slug
            }
          }
        }
      `;

      const result = await this.executeGraphQL(query);
      return result.categoryGroups;
    } catch (error) {
      craftLogger.error('Failed to fetch regions', { error: error.message });
      return [];
    }
  }

  async uploadPhoto(photoUrl) {
    // Implementation
  }
}

export default CraftAPI; 