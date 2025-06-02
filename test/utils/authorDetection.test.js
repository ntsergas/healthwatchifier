import { TestSuite, assertEqual, assert } from './testFramework.js';
import { detectAuthorFromHtml } from '../../src/utils/authorDetection.js';

const authorDetectionSuite = new TestSuite('Author Detection');

// Test basic author detection patterns
authorDetectionSuite.test('should detect author from By pattern', () => {
  const html = 'Some content <p>By Dr. Michael Ouellette, PhD</p> Published May 27';
  const result = detectAuthorFromHtml(html, 'https://example.com');
  assertEqual(result, 'Dr. Michael Ouellette, PhD', 'Should extract author from By pattern');
});

authorDetectionSuite.test('should detect author from meta tag', () => {
  const html = '<meta name="author" content="Dr. Michael Ouellette, PhD">';
  const result = detectAuthorFromHtml(html, 'https://example.com');
  assertEqual(result, 'Dr. Michael Ouellette, PhD', 'Should extract author from meta tag');
});

authorDetectionSuite.test('should return null for no author', () => {
  const html = '<p>Some article content without author</p>';
  const result = detectAuthorFromHtml(html, 'https://example.com');
  assertEqual(result, null, 'Should return null when no author found');
});

authorDetectionSuite.test('should clean up author names', () => {
  const html = 'Content <p>By Author: Dr. Michael Ouellette, PhD Published today</p>';
  const result = detectAuthorFromHtml(html, 'https://example.com');
  assertEqual(result, 'Dr. Michael Ouellette, PhD', 'Should clean up author name properly');
});

export { authorDetectionSuite }; 