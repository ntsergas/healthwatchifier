import { logger } from './logger.js';

const detectionLogger = logger.child('ARTICLE-TYPE');

/**
 * Detects if a URL indicates an opinion article based on URL patterns
 * Handles both slash and dash patterns (e.g., /opinion/ and /opinion-)
 */
export function detectOpinionFromUrl(url) {
  detectionLogger.entry('detectOpinionFromUrl', { url });
  
  try {
    const urlLower = url.toLowerCase();
    
    // Check for opinion patterns - both with slashes and dashes
    const opinionPatterns = [
      '/opinion/',
      '/opinion-',
      '/analysis/',
      '/analysis-',
      '/perspectives/',
      '/perspective/',
      '/op-ed/',
      '/op-ed-',
      '/editorial/',
      '/editorial-',
      '/commentary/',
      '/commentary-',
      '/commentisfree/'  // Guardian opinion articles
    ];
    
    // 🎯 HEALTHY DEBATE SPECIFIC: All /topic/ URLs but need to check content for actual type
    // This is handled in detectArticleType function with HTML parsing
    
    const hasOpinionPattern = opinionPatterns.some(pattern => 
      urlLower.includes(pattern)
    );
    
    detectionLogger.exit('detectOpinionFromUrl', { hasOpinionPattern });
    return hasOpinionPattern;
    
  } catch (error) {
    detectionLogger.error('Error in detectOpinionFromUrl:', error);
    return false;
  }
}

/**
 * Detects opinion articles from title/headline content
 * Looks for "Opinion:" prefix or similar markers
 */
export function detectOpinionFromTitle(title) {
  detectionLogger.entry('detectOpinionFromTitle', { title });
  
  if (!title || typeof title !== 'string') {
    detectionLogger.exit('detectOpinionFromTitle', { result: false });
    return false;
  }
  
  const titleLower = title.toLowerCase().trim();
  const opinionPrefixes = [
    'opinion:',
    'op-ed:',
    'editorial:',
    'commentary:',
    'analysis:',
    'perspective:'
  ];
  
  const hasOpinionPrefix = opinionPrefixes.some(prefix => 
    titleLower.startsWith(prefix)
  );
  
  detectionLogger.exit('detectOpinionFromTitle', { hasOpinionPrefix });
  return hasOpinionPrefix;
} 