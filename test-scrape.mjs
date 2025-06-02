import { scrapeInfo } from './src/utils/scrapeInfo.js';

console.log('Testing real scrape with Opera headers...');

try {
  const result = await scrapeInfo('https://nationalpost.com/health/america-canada-brain-drain');
  console.log('SUCCESS!');
  console.log('Title:', result.headline);
  console.log('Publication:', result.publication);
  console.log('Authors:', result.authors);
  console.log('Type:', result.articleType);
  console.log('Image:', result.image ? 'Found' : 'Missing');
} catch (error) {
  console.error('ERROR:', error.message);
} 