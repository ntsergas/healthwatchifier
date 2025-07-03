import { logger } from './logger.js';

const captionLogger = logger.child('CAPTION');

/**
 * Clean up image caption text by removing common unwanted elements
 * @param {string} caption - The raw caption text
 * @returns {string} - The cleaned caption
 */
export function cleanupImageCaption(caption) {
  if (!caption || typeof caption !== 'string') {
    return '';
  }
  
  let cleaned = caption.trim();
  
  // Fix HTML entities first
  cleaned = cleaned
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  
  // Remove "FILE - " prefix
  cleaned = cleaned.replace(/^FILE\s*-\s*/i, '');
  
  // Remove "WATCH: " prefix
  cleaned = cleaned.replace(/^WATCH:\s*/i, '');
  
  // Remove anything in parentheses
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  
  // Remove "CREDIT" and anything after it
  cleaned = cleaned.replace(/\s*CREDIT.*/i, '');
  
  // Remove "Photo by" and anything after it
  cleaned = cleaned.replace(/\s*Photo by.*/i, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Extract image caption from HTML content
 * @param {string} html - The HTML content to parse
 * @param {string} url - The URL of the article (for context)
 * @returns {string} - The extracted caption or empty string
 */
export function extractImageCaption(html, url) {
  try {
    captionLogger.debug('Extracting image caption', { url });
    
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, '');
    
    // Canadian Press - look for caption in div.caption-text or div.caption
    if (host.includes('thecanadianpressnews.ca')) {
      // Try the real structure first: <div class="caption-text"><p>content</p></div>
      const captionTextMatch = html.match(/<div[^>]*class="[^"]*caption-text[^"]*"[^>]*><p>([^<]+)<\/p><\/div>/i);
      if (captionTextMatch) {
        return cleanupImageCaption(captionTextMatch[1]);
      }
      
      // Fallback to simpler structure: <div class="caption">content</div>
      const captionMatch = html.match(/<div[^>]*class="[^"]*caption[^"]*"[^>]*>([^<]+)<\/div>/i);
      if (captionMatch) {
        return cleanupImageCaption(captionMatch[1]);
      }
    }
    
    // CBC - look for figcaption content
    if (host.includes('cbc.ca')) {
      // Try the newer structure: <figcaption class="image-caption">content</figcaption>
      const figcaptionMatch = html.match(/<figcaption[^>]*class="[^"]*image-caption[^"]*"[^>]*>([^<]+)[\s\S]*?<\/figcaption>/i);
      if (figcaptionMatch) {
        return cleanupImageCaption(figcaptionMatch[1]);
      }
      
      // Fallback to older structure: <figcaption><span class="caption-text">content</span></figcaption>
      const spanCaptionMatch = html.match(/<figcaption[^>]*>[\s\S]*?<span[^>]*class="[^"]*caption-text[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<\/figcaption>/i);
      if (spanCaptionMatch) {
        return cleanupImageCaption(spanCaptionMatch[1]);
      }
    }
    
    // Postmedia sites (Edmonton Journal, etc.) - look for wp-caption-text
    if (host.includes('edmontonjournal.com') || host.includes('nationalpost.com') || host.includes('calgaryherald.com')) {
      const captionMatch = html.match(/<p[^>]*class="[^"]*wp-caption-text[^"]*"[^>]*>([^<]+)<\/p>/i);
      if (captionMatch) {
        return cleanupImageCaption(captionMatch[1]);
      }
    }
    
    // Global News - look for video-caption content
    if (host.includes('globalnews.ca')) {
      const videoCaptionMatch = html.match(/<div[^>]*class="[^"]*video-caption[^"]*"[^>]*>[\s\S]*?<strong>WATCH:<\/strong>\s*([^<]+)<\/div>/i);
      if (videoCaptionMatch) {
        return cleanupImageCaption(`WATCH: ${videoCaptionMatch[1].trim()}`);
      }
    }
    
    // Ars Technica - descriptive caption is in div.caption-content before credit
    if (host.includes('arstechnica.com')) {
      // Prefer the nested caption inside the pswp-caption-content wrapper
      let arsCaptionMatch = html.match(/<div[^>]*class=["'][^"']*pswp-caption-content[^"']*["'][^>]*>[\s\S]*?<div[^>]*class=["'][^"']*caption-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      if (!arsCaptionMatch) {
        // Fallback: standalone caption-content div
        arsCaptionMatch = html.match(/<div[^>]*class=["'][^"']*caption-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      }
      if (arsCaptionMatch) {
        // Strip any nested HTML tags
        const raw = arsCaptionMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return cleanupImageCaption(raw);
      }
    }
    
    // Generic fallback patterns for any other sites
    captionLogger.debug('Trying generic caption patterns');
    
    // Pattern 1: Simple figcaption with text content
    const simpleFigcaptionMatch = html.match(/<figcaption[^>]*>([^<]+)<\/figcaption>/i);
    if (simpleFigcaptionMatch) {
      const caption = simpleFigcaptionMatch[1].trim();
      if (caption.length > 10) { // Only use if it's substantial content
        captionLogger.debug('Found simple figcaption', { caption });
        return cleanupImageCaption(caption);
      }
    }
    
    // Pattern 2: Any element with "caption" in class name
    const genericCaptionMatch = html.match(/<[^>]+class="[^"]*caption[^"]*"[^>]*>([^<]+)<\/[^>]*>/i);
    if (genericCaptionMatch) {
      const caption = genericCaptionMatch[1].trim();
      if (caption.length > 10) { // Only use if it's substantial content
        captionLogger.debug('Found generic caption element', { caption });
        return cleanupImageCaption(caption);
      }
    }
    
    // Pattern 3: Look for figcaption with any nested content
    const nestedFigcaptionMatch = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    if (nestedFigcaptionMatch) {
      // Extract text content, removing HTML tags
      const textContent = nestedFigcaptionMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (textContent.length > 10) {
        captionLogger.debug('Found figcaption with nested content', { caption: textContent });
        return cleanupImageCaption(textContent);
      }
    }
    
    return '';
    
  } catch (error) {
    captionLogger.error('Error extracting image caption', { error: error.message, url });
    return '';
  }
} 