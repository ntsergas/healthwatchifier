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
  'https://www.theguardian.com/us-news/live/2025/may/23/harvard-university-international-students-donald-trump-republicans-democrats-us-politics-latest-news'
];

async function testUrls() {
  console.log('Testing URLs...\n');
  for (const url of urls) {
    console.log('Testing:', url);
    try {
      const result = await scrapeInfo(url);
      console.log('Success:', JSON.stringify(result, null, 2), '\n');
    } catch (error) {
      console.error('Error:', error.message, '\n');
    }
    // Add a small delay between requests to be nice to the servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testUrls(); 