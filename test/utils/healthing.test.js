import { TestSuite, assertEqual, assertContains } from './testFramework.js';
import { logger } from '../../src/utils/logger.js';
import { scrapeInfo } from '../../src/utils/scrapeInfo.js';

const healthingSuite = new TestSuite('Healthing.ca Article Detection');

const testLogger = logger.child('HEALTHING-TEST');

// Test the specific Healthing.ca article that was failing
healthingSuite.test('should detect Dr. Michael Ouellette as author for opinion piece', async () => {
  testLogger.entry('Healthing.ca article test');
  
  const url = 'https://www.healthing.ca/workforce/opinion-outdated-rules-keeping-qualified-mental-health-professionals-on-the-sidelines-in-quebec';
  
  const result = await scrapeInfo(url);
  testLogger.info('Scrape result', result);
  
  // Test all the expected fields
  assertEqual(result.headline.includes('Outdated rules keeping qualified mental health professionals'), true, 'Should have correct headline');
  assertEqual(result.publication, 'Healthing', 'Should detect Healthing as publication');
  assertEqual(result.articleType, 'opinion', 'Should detect as opinion article');
  assertEqual(result.authors && result.authors.length > 0, true, 'Should have authors');
  assertEqual(result.authors[0] !== 'TKTKTK', true, 'Should not have placeholder author');
  assertEqual(result.authors[0], 'Dr. Michael Ouellette, PhD', 'Should detect correct author');
  
  testLogger.exit('Healthing.ca article test', { result });
});

// Test specifically for Healthing.ca unique author extraction
healthingSuite.test('should extract author from Healthing.ca JSON-LD structure', async () => {
  testLogger.entry('Healthing.ca JSON-LD test');
  
  const url = 'https://www.healthing.ca/workforce/opinion-outdated-rules-keeping-qualified-mental-health-professionals-on-the-sidelines-in-quebec';
  
  const result = await scrapeInfo(url);
  
  // This should now work with our Healthing-specific fix
  assertEqual(result.authors[0], 'Dr. Michael Ouellette, PhD', 'Should extract author from JSON-LD array structure');
  
  testLogger.exit('Healthing.ca JSON-LD test', { author: result.authors[0] });
});

export { healthingSuite }; 