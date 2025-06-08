#!/usr/bin/env node

import { logger, LOG_LEVELS } from './src/utils/logger.js';
import { urlSanitizationSuite } from './test/utils/scrapeInfo.test.js';
import { publicationSuite } from './test/utils/constants.test.js';
import { healthingSuite } from './test/utils/healthing.test.js';
import { articleTypeSuite } from './test/utils/articleTypeDetection.test.js';
import { authorDetectionSuite } from './test/utils/authorDetection.test.js';
import { policyOptionsSuite } from './test/utils/policyoptions.test.js';
import { imageQualitySuite } from './test/utils/imageQuality.test.js';
import { guardianSuite } from './test/utils/guardian.test.js';
import { imageCaptionSuite } from './test/utils/imageCaptions.test.js';

// Set up test environment
const testLogger = logger.child('TEST-RUNNER');

// Enable debug logging for tests
logger.level = LOG_LEVELS.DEBUG;

async function runAllTests() {
  testLogger.info('🚀 Starting Unit Tests (TDD)');
  testLogger.info('=============================');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  const suites = [
    urlSanitizationSuite,
    publicationSuite, 
    healthingSuite,
    articleTypeSuite,
    authorDetectionSuite,
    policyOptionsSuite,
    imageQualitySuite,
    guardianSuite,
    imageCaptionSuite
  ];

  for (const suite of suites) {
    testLogger.info(`\n📋 Running ${suite.name}...`);
    const results = await suite.run();
    
    totalTests += results.total;
    passedTests += results.passed;
    failedTests += results.failed;
    
    if (results.failed > 0) {
      testLogger.error(`❌ ${suite.name}: ${results.failed}/${results.total} failed`);
    } else {
      testLogger.info(`✅ ${suite.name}: All ${results.passed} tests passed`);
    }
  }

  testLogger.info('\n🏁 Test Summary');
  testLogger.info('================');
  testLogger.info(`Total Tests: ${totalTests}`);
  testLogger.info(`✅ Passed: ${passedTests}`);
  testLogger.info(`❌ Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    testLogger.info('🎉 ALL TESTS PASSED!');
    process.exit(0);
  } else {
    testLogger.error('💥 SOME TESTS FAILED!');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  testLogger.error('Test runner crashed:', error);
  process.exit(1);
}); 