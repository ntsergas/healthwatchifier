import { TestSuite, assertEqual } from './testFramework.js';
import { logger } from '../../src/utils/logger.js';

// Import the function we need to test (we'll need to extract this from scrapeInfo.js)
// For now, let's create a simple test for the constants
import { PUBLICATION_NAMES } from '../../src/utils/constants.js';

const publicationSuite = new TestSuite('Publication Name Detection');

const testLogger = logger.child('PUBLICATION-TEST');

// Test NPR publication detection
publicationSuite.test('should detect NPR from npr.org domain', () => {
  testLogger.entry('NPR domain test');
  
  const result = PUBLICATION_NAMES['npr.org'];
  assertEqual(result, 'NPR', 'NPR should be detected from npr.org domain');
  
  testLogger.exit('NPR domain test', { result });
});

publicationSuite.test('should have NPR in publication names', () => {
  testLogger.entry('NPR existence test');
  
  const hasNPR = Object.values(PUBLICATION_NAMES).includes('NPR');
  assertEqual(hasNPR, true, 'NPR should exist in publication names');
  
  testLogger.exit('NPR existence test', { hasNPR });
});

// Test Healthing.ca as Postmedia site  
publicationSuite.test('should detect Healthing from healthing.ca domain', () => {
  testLogger.entry('Healthing domain test');
  
  const result = PUBLICATION_NAMES['healthing.ca'];
  assertEqual(result, 'Healthing', 'Healthing should be detected from healthing.ca domain');
  
  testLogger.exit('Healthing domain test', { result });
});

export { publicationSuite }; 