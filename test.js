import { scrapeInfo } from './src/utils/scrapeInfo.js';

// Test URLs with tracking parameters
const urlsToSanitize = [
  'https://nationalpost.com/opinion/terry-newman-over-300-ostriches-to-be-put-to-death-they-may-not-even-be-sick?utm_source=twitter&utm_medium=social&utm_campaign=test',
  'https://www.theglobeandmail.com/canada/article-ontario-pharmacists-prescribing-powers/?fbclid=123&gclid=456&cmp=share',
  'https://www.cbc.ca/news/canada/toronto/ontario-pharmacists-prescribing-power-1.7122918?mc_cid=abc&mc_eid=123',
  'https://www.thestar.com/news/canada/ontario-to-expand-pharmacists-prescribing-powers-to-include-birth-control-travel-vaccines/article_6c4c6c2c-e0c4-5c9c-9c2c-c5c9c2c4c6c2.html?cmp=share_btn&utm_medium=social',
  'https://vancouversun.com/news/canada/canadian-measles-seattle/wcm/851748a9-d947-4a68-a0c1-e61bf14e54d3?mc_cid=123&mc_eid=456',
];

// Main test URLs for article scraping
const urls = [
  // Postmedia sites
  'https://nationalpost.com/opinion/terry-newman-over-300-ostriches-to-be-put-to-death-they-may-not-even-be-sick',
  'https://nationalpost.com/health/america-canada-brain-drain',
  'https://vancouversun.com/opinion/op-ed/jason-sutherland-trumps-tariffs-would-upend-canadian-health-care',
  'https://vancouversun.com/news/canada/canadian-measles-seattle/wcm/851748a9-d947-4a68-a0c1-e61bf14e54d3',
  'https://edmontonjournal.com/news/politics/alberta-premier-danielle-smith-defends-breaking-up-health-minister-role-into-four-portfolios',
  'https://edmontonjournal.com/news/local-news/acute-care-alberta-details-announced',
  'https://www.montrealgazette.com/news/article931534.html',
  'https://www.montrealgazette.com/news/article806974.html',
  'https://thestarphoenix.com/opinion/letters/letters-moes-demands-for-saskatchewan-autonomy-are-unreasonable',
  'https://thestarphoenix.com/news/local-news/saskatoon-police-investigating-suspicious-death-in-sutherland',
  'https://www.thestar.com/news/canada/ontario-to-expand-pharmacists-prescribing-powers-to-include-birth-control-travel-vaccines/article_6c4c6c2c-e0c4-5c9c-9c2c-c5c9c2c4c6c2.html',
  'https://www.theglobeandmail.com/canada/article-ontario-pharmacists-prescribing-powers/',
  'https://healthydebate.ca/2024/02/topic/ontario-pharmacists-prescribing/',
  'https://www.theguardian.com/world/2024/feb/28/canada-pharmacare-deal-ndp-liberals',
  'https://cabinradio.ca/239214/news/politics/shauna-morgan-introduces-nurses-collective-bargaining-bill/',
  'https://www.thecanadianpressnews.ca/health/a-planned-parenthood-affiliate-plans-to-close-4-clinics-in-iowa-and-another-4-in/article_d7bb7008-8f99-5cff-8afc-b5b3b8243778.html'
];

// Expected publications for each URL
const expectedPublications = {
  'nationalpost.com': 'National Post',
  'vancouversun.com': 'Vancouver Sun',
  'edmontonjournal.com': 'Edmonton Journal',
  'montrealgazette.com': 'Montreal Gazette',
  'thestarphoenix.com': 'Saskatoon StarPhoenix',
  'thestar.com': 'Toronto Star',
  'cbc.ca': 'CBC News',
  'globalnews.ca': 'Global News',
  'theglobeandmail.com': 'The Globe and Mail',
  'healthydebate.ca': 'Healthy Debate',
  'thetrillium.ca': 'The Trillium',
  'theguardian.com': 'The Guardian',
  'thecanadianpressnews.ca': 'The Canadian Press',
  'ap.org': 'Associated Press'
};

async function testImageLoad(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    return true;
  } catch (error) {
    console.error('Image Error:', error.message);
    return false;
  }
}

async function runTests() {
  // First test URL sanitization
  console.log('🧹 Testing URL sanitization...\n');
  for (const url of urlsToSanitize) {
    console.log('Original URL:', new URL(url).hostname);
    console.log('Path:', new URL(url).pathname);
    try {
      const result = await scrapeInfo(url);
      console.log('✅ Sanitized URL:', new URL(result.url).pathname);
      console.log('---\n');
    } catch (error) {
      console.log('❌ Error:', error.message);
      console.log('---\n');
    }
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Then test article scraping
  console.log('\n📰 Testing article scraping...\n');
  let successCount = 0;
  let imageSuccessCount = 0;
  let publicationSuccessCount = 0;
  
  for (const url of urls) {
    const urlObj = new URL(url);
    console.log('\n📝 Testing:', urlObj.hostname);
    console.log('Path:', urlObj.pathname);
    try {
      const result = await scrapeInfo(url);
      console.log('✅ Success!');
      
      // Log core information
      console.log('Publication:', result.publication);
      console.log('Article Type:', result.articleType);
      console.log('Title:', result.headline);
      
      // Test publication detection
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const expectedPublication = expectedPublications[hostname.split('.').slice(-2).join('.')];
      if (expectedPublication === result.publication) {
        console.log('✅ Publication matched:', result.publication);
        publicationSuccessCount++;
      } else {
        console.log('❌ Publication mismatch:', {
          expected: expectedPublication,
          got: result.publication
        });
      }

      // Test image
      if (result.image) {
        console.log('🖼 Image found');
        if (await testImageLoad(result.image)) {
          console.log('✅ Image loaded successfully');
          imageSuccessCount++;
        }
      } else {
        console.log('❌ No image URL found');
      }

      successCount++;
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Articles: ${successCount}/${urls.length} successful`);
  console.log(`Images: ${imageSuccessCount}/${urls.length} successful`);
  console.log(`Publications: ${publicationSuccessCount}/${urls.length} successful`);
}

// Run all tests
runTests().catch(console.error); 