import { logger } from '../utils/logger.js';
import { generateRSSFeed, validateRSSData } from '../utils/rssGenerator.js';

const rssLogger = logger.child('LinkedIn RSS');

function generateGuidFromLink(link) {
  try {
    const url = new URL(link);
    const parts = url.pathname.split('/').filter(Boolean);
    const slug = parts.pop();
    const date = new Date().toISOString().split('T')[0];
    return `${slug}-${date}`;
  } catch (err) {
    return `unknown-${Date.now()}`;
  }
}

function generateRSSItem({ title, link, tagline, image }) {
  rssLogger.debug('🔍 Generating RSS item', { title, link, imagePresent: !!image });
  const pubDate = new Date().toUTCString();
  const guid = generateGuidFromLink(link);
  // Format: headline<space>link<space>tagline
  const description = `${title} ${link} ${tagline}`;

  // Log the image URL before escaping
  rssLogger.debug('🔍 Processing image URL', { 
    originalUrl: image,
    escapedUrl: escapeXml(image)
  });

  return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
      ${image ? `<media:content url="${escapeXml(image)}" type="image/jpeg"/>` : ''}
    </item>
  `.trim();
}

function escapeXml(str = '') {
  return str.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

/**
 * Add a new item to the LinkedIn RSS feed
 * @param {Object} data Article data
 * @param {Object} env Cloudflare Worker environment
 * @returns {Promise<void>}
 */
export async function addToLinkedInFeed(data, env) {
  try {
    rssLogger.debug('🔍 Adding new item to LinkedIn feed', { title: data.title });
    
    // Validate the data first
    validateRSSData(data);
    
    // Generate new item
    const newItem = generateRSSItem(data);

    // Read existing feed from KV
    let feedContent = await env.LINKEDIN_FEED.get('rss') || generateRSSFeed([]);
    
    // Extract existing items
    const itemsMatch = feedContent.match(/<item>[\s\S]*?<\/item>/g) || [];
    const items = [newItem, ...itemsMatch.slice(0, 14)]; // Keep last 15 items
    
    // Generate new feed
    const newFeed = generateRSSFeed(items);
    
    // Write updated feed to KV
    await env.LINKEDIN_FEED.put('rss', newFeed);
    rssLogger.info('🟢 Successfully added item to LinkedIn feed', { title: data.title });
  } catch (error) {
    rssLogger.error('❌ Failed to add item to LinkedIn feed', { 
      title: data.title,
      error: error.message
    });
    // Log stack trace at debug level
    rssLogger.debug('🔍 Error stack trace', { stack: error.stack });
    throw error;
  }
}

/**
 * Serve the LinkedIn RSS feed
 * @param {Object} env Cloudflare Worker environment
 * @returns {Promise<string>} RSS feed XML content
 */
export async function serveLinkedInFeed(env) {
  try {
    const feed = await env.LINKEDIN_FEED.get('rss');
    if (!feed) {
      rssLogger.info('⚠️ No feed found, generating empty feed');
      const emptyFeed = generateRSSFeed([]);
      await env.LINKEDIN_FEED.put('rss', emptyFeed);
      return emptyFeed;
    }
    return feed;
  } catch (error) {
    rssLogger.error('❌ Failed to serve LinkedIn feed', { 
      error: error.message
    });
    rssLogger.debug('🔍 Error stack trace', { stack: error.stack });
    throw error;
  }
}

/**
 * Empty the LinkedIn RSS feed
 * @param {Object} env Cloudflare Worker environment
 * @returns {Promise<void>}
 */
export async function emptyLinkedInFeed(env) {
  try {
    rssLogger.info('🔍 Emptying LinkedIn feed');
    const emptyFeed = generateRSSFeed([]);
    await env.LINKEDIN_FEED.put('rss', emptyFeed);
    rssLogger.info('🟢 Successfully emptied LinkedIn feed');
  } catch (error) {
    rssLogger.error('❌ Failed to empty LinkedIn feed', { 
      error: error.message
    });
    rssLogger.debug('🔍 Error stack trace', { stack: error.stack });
    throw error;
  }
} 