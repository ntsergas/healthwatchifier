import { TestSuite, assertEqual } from './testFramework.js';
import { detectOpinionFromUrl, detectOpinionFromTitle } from '../../src/utils/articleTypeDetection.js';

const articleTypeSuite = new TestSuite('Article Type Detection');

// Test URL-based opinion detection
articleTypeSuite.test('should detect opinion from URL with slash pattern', () => {
  const url = 'https://example.com/opinion/some-article';
  const result = detectOpinionFromUrl(url);
  assertEqual(result, true, 'Should detect opinion from /opinion/ pattern');
});

articleTypeSuite.test('should detect opinion from URL with dash pattern', () => {
  const url = 'https://www.healthing.ca/workforce/opinion-outdated-rules-keeping-qualified-mental-health-professionals-on-the-sidelines-in-quebec';
  const result = detectOpinionFromUrl(url);
  assertEqual(result, true, 'Should detect opinion from /opinion- pattern');
});

articleTypeSuite.test('should detect analysis from URL', () => {
  const url = 'https://example.com/analysis-of-healthcare';
  const result = detectOpinionFromUrl(url);
  assertEqual(result, true, 'Should detect opinion from /analysis- pattern');
});

articleTypeSuite.test('should not detect opinion from news URL', () => {
  const url = 'https://example.com/news/healthcare-update';
  const result = detectOpinionFromUrl(url);
  assertEqual(result, false, 'Should not detect opinion from news URL');
});

// Test title-based opinion detection
articleTypeSuite.test('should detect opinion from title prefix', () => {
  const title = 'Opinion: Outdated rules keeping qualified mental health professionals on the sidelines';
  const result = detectOpinionFromTitle(title);
  assertEqual(result, true, 'Should detect opinion from "Opinion:" prefix');
});

articleTypeSuite.test('should detect editorial from title prefix', () => {
  const title = 'Editorial: Healthcare needs reform';
  const result = detectOpinionFromTitle(title);
  assertEqual(result, true, 'Should detect opinion from "Editorial:" prefix');
});

articleTypeSuite.test('should not detect opinion from regular news title', () => {
  const title = 'Healthcare system sees improvements';
  const result = detectOpinionFromTitle(title);
  assertEqual(result, false, 'Should not detect opinion from regular news title');
});

export { articleTypeSuite }; 