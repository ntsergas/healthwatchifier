import { TestSuite, assertEqual } from './testFramework.js';
import { scrapeInfo } from '../../src/utils/scrapeInfo.js';
import { logger } from '../../src/utils/logger.js';

const policyOptionsSuite = new TestSuite('Policy Options Article Detection');

const testLogger = logger.child('POLICY-OPTIONS-TEST');

// Test specific Policy Options article
policyOptionsSuite.test('should detect Holly Mathias as author for womens health article', async () => {
  testLogger.entry('Policy Options article test');
  
  const url = 'https://policyoptions.irpp.org/magazines/may-2025/womens-health-research/';
  
  const result = await scrapeInfo(url);
  testLogger.info('Scrape result', result);
  
  // Test all the expected fields
  assertEqual(result.headline, "When women's health loses, we all lose", 'Should have correct headline');
  assertEqual(result.publication, 'Policy Options', 'Should detect Policy Options as publication');
  assertEqual(result.articleType, 'opinion', 'Should detect as opinion article');
  assertEqual(result.authors && result.authors.length > 0, true, 'Should have authors');
  assertEqual(result.authors[0] !== 'TKTKTK', true, 'Should not have placeholder author');
  assertEqual(result.authors[0], 'Holly Mathias', 'Should detect correct author');
  
  testLogger.exit('Policy Options article test', { result });
});

export { policyOptionsSuite }; 