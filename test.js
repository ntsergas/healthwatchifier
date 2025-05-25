import { scrapeInfo } from './src/utils/scrapeInfo.js';

const urls = [
  // Postmedia sites
  'https://nationalpost.com/opinion/terry-newman-over-300-ostriches-to-be-put-to-death-they-may-not-even-be-sick',
  'https://vancouversun.com/opinion/op-ed/jason-sutherland-trumps-tariffs-would-upend-canadian-health-care',
  'https://edmontonjournal.com/news/politics/alberta-premier-danielle-smith-defends-breaking-up-health-minister-role-into-four-portfolios',
  'https://www.montrealgazette.com/news/article931534.html',
  
  // Other Canadian news sites
  'https://www.cbc.ca/radio/asithappens/george-floyd-anniversary-cousin-1.7542391',
  'https://globalnews.ca/news/11181405/arsenic-rice-what-to-know/',
  'https://www.theglobeandmail.com/canada/article-ontario-budget-2025-deficit-tariffs-housing-highlights/',
  'https://healthydebate.ca/2025/05/topic/license-to-kill-the-pandemic-on-our-roads/',

  // Guardian articles
  'https://www.theguardian.com/science/2025/may/23/blood-test-could-speed-diagnosis-rare-diseases-babies',
  'https://www.theguardian.com/us-news/live/2025/may/23/harvard-university-international-students-donald-trump-republicans-democrats-us-politics-latest-news',

  // New York Times articles
  'https://www.nytimes.com/2025/05/20/well/eat/red-meat-heart-health.html',
  'https://www.nytimes.com/2025/05/20/health/covid-variants-immunity.html',
  'https://www.nytimes.com/2025/05/20/science/climate-change-health-effects.html'
];

async function testImageLoad(imageUrl) {
  console.log('Testing image load for:', imageUrl);
  
  try {
    // Test basic image loading
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Basic validation
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const size = contentLength ? parseInt(contentLength) : 0;
    if (size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image too large (>10MB)');
    }

    console.log('Image details:', {
      status: response.status,
      contentType,
      size: contentLength ? `${(size / (1024 * 1024)).toFixed(2)}MB` : 'unknown'
    });

    return true;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testUrls() {
  console.log('Testing article scraping...\n');
  let successCount = 0;
  let imageSuccessCount = 0;
  
  for (const url of urls) {
    console.log('Testing:', url);
    try {
      const result = await scrapeInfo(url);
      console.log('Success:', JSON.stringify(result, null, 2), '\n');
      successCount++;

      // If we got an image URL, test loading it
      if (result.image) {
        console.log('Testing image load for this article...');
        if (await testImageLoad(result.image)) {
          imageSuccessCount++;
        }
      }
    } catch (error) {
      console.error('Error:', error.message, '\n');
    }
    // Add a small delay between requests to be nice to the servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\nTest Summary:');
  console.log(`Articles: ${successCount}/${urls.length} successful`);
  console.log(`Images: ${imageSuccessCount}/${urls.length} successful`);
}

// Run the tests
testUrls().catch(console.error); 