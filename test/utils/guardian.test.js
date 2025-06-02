import { TestSuite, assertEqual, assertContains, assert } from './testFramework.js';
import { logger } from '../../src/utils/logger.js';
import { scrapeInfo } from '../../src/utils/scrapeInfo.js';

const guardianSuite = new TestSuite('Guardian Author Detection');

const testLogger = logger.child('GUARDIAN-TEST');

// Test the specific Guardian article that was getting URL instead of name
guardianSuite.test('should extract Joseph Gedeon as author from JSON-LD, not URL from meta tag', async () => {
  testLogger.entry('Guardian author detection test');
  
  const url = 'https://www.theguardian.com/us-news/2025/may/28/rfk-jr-medical-journals';
  const expected = 'Joseph Gedeon';
  
  testLogger.info('Testing URL:', url);
  testLogger.info('Expected author:', expected);
  
  const result = await scrapeInfo(url);
  
  testLogger.info('Scrape result:', {
    headline: result.headline,
    publication: result.publication,
    author: result.authors[0],
    articleType: result.articleType
  });
  
  // Test the core functionality
  assertEqual(result.authors[0], expected, 'Should extract author name from JSON-LD');
  assertEqual(result.publication, 'The Guardian', 'Should detect Guardian as publication');
  assertEqual(result.articleType, 'news', 'Should detect article type as news');
  
  // Test that we got the name, not the URL
  assert(!result.authors[0].includes('theguardian.com'), 'Should not return URL from meta tag');
  assert(!result.authors[0].includes('/profile/'), 'Should not contain profile URL path');
  
  testLogger.exit('Guardian test passed');
});

export { guardianSuite }; 