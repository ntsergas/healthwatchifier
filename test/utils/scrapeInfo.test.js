import { TestSuite, assertEqual, assertContains, assert } from './testFramework.js';
import { sanitizeUrl } from '../../src/utils/scrapeInfo.js';

const urlSanitizationSuite = new TestSuite('URL Sanitization');

// Test URL sanitization - one feature at a time
urlSanitizationSuite.test('should remove utm parameters', () => {
  const input = 'https://example.com/article?utm_source=facebook&utm_medium=social';
  const expected = 'https://example.com/article';
  const result = sanitizeUrl(input);
  assertEqual(result, expected);
});

urlSanitizationSuite.test('should remove fbclid parameter', () => {
  const input = 'https://example.com/article?fbclid=IwAR123456';
  const expected = 'https://example.com/article';
  const result = sanitizeUrl(input);
  assertEqual(result, expected);
});

urlSanitizationSuite.test('should preserve valid parameters', () => {
  const input = 'https://example.com/article?id=123&category=health';
  const result = sanitizeUrl(input);
  assertContains(result, 'id=123');
  assertContains(result, 'category=health');
});

urlSanitizationSuite.test('should handle malformed URLs gracefully', () => {
  const input = 'not-a-url';
  const result = sanitizeUrl(input);
  assertEqual(result, input); // Should return input unchanged
});

urlSanitizationSuite.test('should remove multiple tracking parameters', () => {
  const input = 'https://example.com/article?utm_source=test&gclid=abc&mc_cid=123&normal=keep';
  const result = sanitizeUrl(input);
  assert(!result.includes('utm_source'));
  assert(!result.includes('gclid'));
  assert(!result.includes('mc_cid'));
  assertContains(result, 'normal=keep');
});

export { urlSanitizationSuite }; 