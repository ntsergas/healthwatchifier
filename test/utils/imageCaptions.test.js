import { TestSuite, assertEqual } from './testFramework.js';
import { extractImageCaption } from '../../src/utils/imageCaptions.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load fixture HTML
function loadFixture(filename) {
  const fixturePath = join(__dirname, '..', 'fixtures', filename);
  return readFileSync(fixturePath, 'utf-8');
}

const imageCaptionSuite = new TestSuite('Image Caption Extraction');

// Test Canadian Press caption extraction
imageCaptionSuite.test('should extract Canadian Press caption from HTML', () => {
  const html = loadFixture('canadian-press-utah.html');
  const url = 'https://www.thecanadianpressnews.ca/health/utah-lawmakers-said-gender-affirming-care-is-harmful-to-kids-their-own-study-contradicts-that/article_f6b83fd6-976e-5327-b673-f303dc6178fc.html';
  
  const caption = extractImageCaption(html, url);
  
  assertEqual(caption, 'People gather in support of transgender youth during a rally at the Utah State Capitol Tuesday, Jan. 24, 2023, in Salt Lake City.');
});

// Test CBC caption extraction
imageCaptionSuite.test('should extract CBC caption from HTML', () => {
  const html = loadFixture('cbc-minister-ostriches.html');
  const url = 'https://www.cbc.ca/news/canada/british-columbia/federal-minister-ostriches-1.7546052';
  
  const caption = extractImageCaption(html, url);
  
  assertEqual(caption, 'Minister of Agriculture and Agri-Food Heath MacDonald leaves a caucus meeting on Parliament Hill in Ottawa on Wednesday, May 28, 2025.');
});

// Test Edmonton Journal (Postmedia) caption extraction
imageCaptionSuite.test('should extract Edmonton Journal Postmedia caption from HTML', () => {
  const html = loadFixture('edmonton-journal-smith.html');
  const url = 'https://edmontonjournal.com/news/politics/alberta-premier-danielle-smith-defends-breaking-up-health-minister-role-into-four-portfolios';
  
  const caption = extractImageCaption(html, url);
  
  assertEqual(caption, 'Premier Danielle Smith speaks to reporters during a press conference at the Alberta legislature in Edmonton on May 6, 2025.');
});

// Test Global News video caption extraction
imageCaptionSuite.test('should extract Global News video caption from HTML', () => {
  const html = loadFixture('global-news-quebec-doctors.html');
  const url = 'https://globalnews.ca/news/11197626/quebec-family-physicians-bill-106/';
  
  const caption = extractImageCaption(html, url);
  
  assertEqual(caption, 'Quebec family doctors speak out against new bill, say it will hurt the quality-of-care patients receive – May 26, 2025');
});

// Test graceful handling when no caption found
imageCaptionSuite.test('should return empty string when no caption found', () => {
  const html = '<html><body><img src="test.jpg"></body></html>';
  const url = 'https://example.com/article';
  
  const caption = extractImageCaption(html, url);
  
  assertEqual(caption, '');
});

// Test graceful handling of malformed HTML
imageCaptionSuite.test('should handle malformed HTML gracefully', () => {
  const html = '<html><body><img src="test.jpg" alt="incomplete';
  const url = 'https://example.com/article';
  
  const caption = extractImageCaption(html, url);
  
  assertEqual(caption, '');
});

export { imageCaptionSuite }; 