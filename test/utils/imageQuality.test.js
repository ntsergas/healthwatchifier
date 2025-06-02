import { TestSuite, assertEqual, assert } from './testFramework.js';
import { scrapeInfo } from '../../src/utils/scrapeInfo.js';
import { logger } from '../../src/utils/logger.js';

const imageQualitySuite = new TestSuite('Image Quality Detection');

const testLogger = logger.child('IMAGE-QUALITY-TEST');

// Test specific Toronto Star article image quality
imageQualitySuite.test('should extract high-quality image for Toronto Star TPH article', async () => {
  testLogger.entry('Toronto Star image quality test');
  
  const url = 'https://www.thestar.com/news/gta/toronto-public-health-faces-staffing-crisis-plummeting-public-trust-and-dwindling-resources-report-finds/article_fcc36314-95c9-4c7b-b602-57624fa128fa.html';
  
  const result = await scrapeInfo(url);
  testLogger.info('Scrape result image URL', { imageUrl: result.image });
  
  // Test that we get a high-quality bloximages URL
  assert(result.image.includes('bloximages.chicago2.vip.townnews.com'), 'Should use bloximages CDN');
  assert(result.image.includes('resize=1200,800'), 'Should have high-quality resize parameters');
  assert(!result.image.includes('resize=438'), 'Should not have thumbnail resize parameters');
  
  testLogger.info('Final image URL for quality check', { imageUrl: result.image });
  testLogger.exit('Toronto Star image quality test passed');
});

// Test content-first image extraction strategy
imageQualitySuite.test('should prioritize first image after h1 over social preview images', async () => {
  testLogger.entry('Content-first image extraction test');
  
  // Test with a site that has both social preview and article content images
  const url = 'https://www.theguardian.com/us-news/2025/may/28/rfk-jr-medical-journals';
  
  const result = await scrapeInfo(url);
  testLogger.info('Guardian image result', { imageUrl: result.image });
  
  // Should get an article content image, not just a social preview
  assert(result.image && result.image.length > 0, 'Should extract an image');
  
  // ❌ FAIL: Check that we're NOT getting social preview artifacts
  assert(!result.image.includes('overlay-base64='), 'Should not have social media overlay branding');
  assert(!result.image.includes('width=1200&height=630'), 'Should not have Twitter card dimensions (1200x630)');
  assert(!result.image.includes('fit=crop&overlay-align='), 'Should not have social media cropping parameters');
  
  // ✅ PASS: Should get clean article content image
  if (result.image.includes('i.guim.co.uk')) {
    testLogger.info('Using Guardian CDN - checking for content vs social image');
    // Content images should not have social media overlays
    assert(result.image.includes('master/') || result.image.includes('original/'), 'Should use original/master image path for content');
  }
  
  testLogger.exit('Content-first image test completed');
});

export { imageQualitySuite }; 