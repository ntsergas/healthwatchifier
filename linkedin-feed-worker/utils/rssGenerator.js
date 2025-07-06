import { logger } from './logger.js';

const rssLogger = logger.child('RSS');

// Maximum lengths for RSS fields based on LinkedIn's limits
const RSS_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 500,
  LINK_MAX_LENGTH: 2048,
  IMAGE_URL_MAX_LENGTH: 2048
};

/**
 * Validate RSS item data before generation
 * @param {Object} data Article data to validate
 * @throws {Error} If validation fails
 */
function validateRSSData(data) {
  const { title, link, tagline, image } = data;
  
  rssLogger.debug('Validating RSS data', { 
    hasTitle: !!title, 
    hasLink: !!link, 
    hasTagline: !!tagline,
    hasImage: !!image,
    imageType: image ? (image.startsWith('data:') ? 'data-url' : 'regular-url') : 'none'
  });
  
  // Check required fields
  if (!title?.trim()) throw new Error('Title is required');
  if (!link?.trim()) throw new Error('Link is required');
  if (!tagline?.trim()) throw new Error('Tagline is required');
  if (!image?.trim()) throw new Error('Image is required');
  
  // Check field lengths
  if (title.length > RSS_LIMITS.TITLE_MAX_LENGTH) {
    throw new Error(`Title exceeds ${RSS_LIMITS.TITLE_MAX_LENGTH} characters`);
  }
  
  // Validate URLs
  try {
    new URL(link); // Throws if invalid
    if (link.length > RSS_LIMITS.LINK_MAX_LENGTH) {
      throw new Error(`Link exceeds ${RSS_LIMITS.LINK_MAX_LENGTH} characters`);
    }
    
    // Skip image validation for data URLs
    if (!image.startsWith('data:')) {
      new URL(image); // Throws if invalid
      if (image.length > RSS_LIMITS.IMAGE_URL_MAX_LENGTH) {
        throw new Error(`Image URL exceeds ${RSS_LIMITS.IMAGE_URL_MAX_LENGTH} characters`);
      }
      
      // Verify image extension for regular URLs, handling query parameters
      const imageExt = image.split('?')[0].split('.').pop().toLowerCase();
      rssLogger.debug('Validating image extension', { imageExt, originalUrl: image });
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'];
      if (!validExtensions.map(ext => ext.toLowerCase()).includes(imageExt)) {
        throw new Error('Image must be jpg, jpeg, png, webp, or gif (case insensitive)');
      }
    } else {
      rssLogger.debug('Skipping validation for data URL image');
      throw new Error('Data URLs are not supported for images in RSS feeds');
    }
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Generate a complete RSS feed with channel information
 * @param {string[]} items Array of RSS item XML strings
 * @returns {string} Complete RSS feed XML
 */
export function generateRSSFeed(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Canada Healthwatch</title>
    <link>https://canadahealthwatch.ca</link>
    <description>The latest health news curated by Canada Healthwatch</description>
    <language>en-ca</language>
    <atom:link href="https://feed.strikethroughediting.ca" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items.join('\n    ')}
  </channel>
</rss>`;
}

export { validateRSSData, RSS_LIMITS }; 