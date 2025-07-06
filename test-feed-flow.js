import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock logger since we're in a test environment
const logger = {
  child: (name) => ({
    info: (...args) => console.log(`[${name} INFO]`, ...args),
    debug: (...args) => console.log(`[${name} DEBUG]`, ...args),
    error: (...args) => console.error(`[${name} ERROR]`, ...args)
  })
};

const testLogger = logger.child('Test Feed Flow');

// Mock validateRSSData function
function validateRSSData(data) {
  const { title, link, tagline, image } = data;
  
  testLogger.debug('Validating RSS data', { 
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
  
  try {
    new URL(link);
    if (image) {
      if (!image.startsWith('data:')) {
        new URL(image);
        const imageExt = image.split('?')[0].split('.').pop().toLowerCase();
        testLogger.debug('Validating image extension', { imageExt });
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'];
        if (!validExtensions.map(ext => ext.toLowerCase()).includes(imageExt)) {
          throw new Error('Image must be jpg, jpeg, png, webp, or gif (case insensitive)');
        }
      } else {
        throw new Error('Data URLs are not supported for images in RSS feeds');
      }
    }
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

// Mock generateRSSItem function
function generateRSSItem({ title, link, tagline, image }) {
  testLogger.debug('Generating RSS item', { title, link, imagePresent: !!image });
  const pubDate = new Date().toUTCString();
  const guid = `${link.split('/').pop()}-${new Date().toISOString().split('T')[0]}`;
  const description = `${title} ${link} ${tagline}`;

  function escapeXml(str = '') {
    return str.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
  }

  // Log the image URL before escaping
  testLogger.debug('Processing image URL', { 
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
      <media:content url="${escapeXml(image)}" type="image/jpeg"/>
    </item>
  `.trim();
}

async function simulateHealthwatchifier(articleUrl) {
  testLogger.info('Starting test with article URL', { articleUrl });

  // Simulate article data extraction
  const articleData = {
    title: "With the U.S. abandoning global vaccine programs, childhood deaths could soar",
    link: articleUrl,
    tagline: "More news → CanadaHealthwatch.ca 🍁",
    // The actual image URL from the article
    image: "https://www.theglobeandmail.com/resizer/v2/OKWOFXMRY5HWXABEJGNF54MLAY.JPG?auth=6fa11e3070c471b5a91333a86d4428ada3e790b15a60dd360d60548fd4858c93&width=1200&quality=85"
  };

  testLogger.debug('Extracted article data', articleData);

  try {
    // Step 1: Validate the data
    testLogger.info('Validating RSS data...');
    validateRSSData(articleData);
    testLogger.info('RSS data validation passed');

    // Step 2: Generate RSS item
    testLogger.info('Generating RSS item...');
    const rssItem = generateRSSItem(articleData);
    testLogger.info('RSS item generated successfully');
    console.log('\nGenerated RSS Item:\n', rssItem);

    return rssItem;
  } catch (error) {
    testLogger.error('Error in feed flow', { error: error.message });
    console.error('\nError:', error.message);
    
    // Additional debugging for image-related errors
    if (error.message.includes('Image')) {
      const imageUrl = articleData.image;
      console.log('\nImage URL analysis:');
      console.log('- Full URL:', imageUrl);
      console.log('- Extension:', imageUrl.split('?')[0].split('.').pop());
      console.log('- Contains query params:', imageUrl.includes('?'));
      
      // Try to fetch the image to verify it exists
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        console.log('- Image accessibility:', response.status, response.statusText);
        console.log('- Content-Type:', response.headers.get('content-type'));
      } catch (fetchError) {
        console.log('- Image fetch error:', fetchError.message);
      }
    }
    
    throw error;
  }
}

// Run the test
const articleUrl = "https://www.theglobeandmail.com/opinion/article-vaccine-programs-childhood-deaths-health-disease/";
simulateHealthwatchifier(articleUrl)
  .then(() => testLogger.info('Test completed successfully'))
  .catch(error => testLogger.error('Test failed', { error: error.message })); 