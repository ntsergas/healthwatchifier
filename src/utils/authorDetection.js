/**
 * Extracts author information from HTML using common byline patterns
 * Specifically handles patterns used by Healthing.ca and similar sites
 */
export function detectAuthorFromHtml(html, url) {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, '');
    
    // 🎯 POLICY OPTIONS SPECIFIC
    if (host === 'policyoptions.irpp.org') {
      // Look for: <span class="meta__author meta__author--banner">by&nbsp; <a href="...">Author Name </a></span>
      const policyOptionsMatch = html.match(/<span[^>]*class="[^"]*meta__author[^"]*"[^>]*>[\s\S]*?by&nbsp;\s*<a[^>]*href="[^"]*">([^<]+)<\/a>/i);
      if (policyOptionsMatch) {
        return policyOptionsMatch[1].trim();
      }
      
      // Fallback: Look for any link in meta-author div
      const authorLinkMatch = html.match(/<div[^>]*class="[^"]*meta-author[^"]*"[\s\S]*?<a[^>]*href="[^"]*authors[^"]*">([^<]+)<\/a>/i);
      if (authorLinkMatch) {
        return authorLinkMatch[1].trim();
      }
    }
    
    // 🎯 META TAG PATTERNS (for existing tests)
    const metaPatterns = [
      /<meta[^>]*(?:property|name)=["']?author["']?[^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']?author["']?/i
    ];
    
    for (const pattern of metaPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 🎯 BYLINE PATTERNS
    const byPatterns = [
      // "By Author Name" in paragraph/div - including "Published" cleanup
      /<(?:p|div)[^>]*>\s*By\s+([^<]+?)\s*(?:Published|\s*<|\s*$)/i,
      // "By Author:" pattern with cleanup
      /By\s+(?:Author:\s*)?([^<\n]+?)(?:\s+Published|\s*<|\s*$)/i,
      // General "By Author Name" at start
      /(?:^|\n|\r|\s)By\s+([A-Z][a-zA-Z\s,.''-]+?)(?:\s*\n|\s*<|\s*$|,\s*\w+\s+\w+)/i,
      /<span[^>]*>\s*By\s+([^<]+?)\s*<\/span>/i
    ];
    
    for (const pattern of byPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const author = match[1].trim()
          .replace(/^Author:\s*/i, '') // Remove "Author:" prefix
          .replace(/\s+/g, ' ')
          .replace(/[,\.]$/, ''); // Remove trailing punctuation
        if (author.length > 2 && author.length < 100) {
          return author;
        }
      }
    }
    
    // 🎯 AUTHOR ELEMENT PATTERNS
    const authorPatterns = [
      /<(?:div|span)[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/(?:div|span)>/i,
      /<(?:div|span)[^>]*class="[^"]*byline[^"]*"[^>]*>([^<]+)<\/(?:div|span)>/i,
      /<p[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/p>/i,
      /<a[^>]*rel="author"[^>]*>([^<]+)<\/a>/i
    ];
    
    for (const pattern of authorPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const author = match[1].trim()
          .replace(/^By\s+/i, '')
          .replace(/\s+/g, ' ');
        if (author.length > 2 && author.length < 100) {
          return author;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error in detectAuthorFromHtml:', error);
    return null;
  }
}