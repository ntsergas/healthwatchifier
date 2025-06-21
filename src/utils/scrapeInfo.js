// import puppeteer from '@cloudflare/puppeteer';

import { PUBLICATION_NAMES, PAYWALLED_DOMAINS, FREE_DOMAINS } from './constants.js';
import { detectOpinionFromUrl, detectOpinionFromTitle } from './articleTypeDetection.js';
import { detectAuthorFromHtml } from './authorDetection.js';
import { logger } from './logger.js';
import { getSiteOptimizedHeaders } from './browserHeaders.js';

const decode = (s = "") =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&rsquo;?|&lsquo;?/g, "'")
    .replace(/&rdquo;?|&ldquo;?/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+)(?:\s*;)?/g, (_, n) => String.fromCharCode(+n));

const POSTMEDIA = [
  "nationalpost.com", "montrealgazette.com", "ottawacitizen.com",
  "vancouversun.com", "edmontonjournal.com", "calgaryherald.com",
  "leaderpost.com", "thestarphoenix.com", "windsorstar.com",
  "theprovince.com", "torontosun.com", "winnipegsun.com",
  "calgarysun.com", "edmontonsun.com", "lfpress.com", "ottawasun.com", "canada.com",
  "healthing.ca", "stcatharinesstandard.ca",
];

const paywallLogger = logger.child('PAYWALL');
const imageLogger = logger.child('IMAGE');
const metaLogger = logger.child('META');
const fetchLogger = logger.child('FETCH');
const headlineLogger = logger.child('HEADLINE');

// Helper functions
export function sanitizeUrl(input) {
  try {
    const u = new URL(input);
    for (const key of Array.from(u.searchParams.keys())) {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("utm_") ||
        lower === "cmp" ||
        lower === "fbclid" ||
        lower === "gclid" ||
        lower.startsWith("mc_")
      ) {
        u.searchParams.delete(key);
      }
    }
    return u.href;
  } catch {
    return input;
  }
}

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3, baseDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Check if we got a successful response
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      // Check if we got a valid HTML response
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        return text;
      }
      
      // If response isn't valid HTML, wait and retry
      await delay(baseDelay * Math.pow(2, i)); // Exponential backoff
    } catch (e) {
      fetchLogger.warn('Fetch attempt failed', { attempt: i + 1, error: e.message });
      if (i === retries - 1) throw e;
      await delay(baseDelay * Math.pow(2, i));
    }
  }
  throw new Error('Failed to fetch valid HTML after retries');
}

// Helper function to clean up headlines
function cleanupHeadline(headline, host) {
  if (!headline) return "(untitled)";

  headlineLogger.debug("Original headline", { headline });
  headline = headline.replace(/\s+/g, " ").trim();
  headlineLogger.debug("After whitespace cleanup", { headline });

  // Remove everything after pipe character (including the space before it)
  const pipeIndex = headline.indexOf('|');
  if (pipeIndex !== -1) {
    headline = headline.substring(0, pipeIndex).trim();
  }
  headlineLogger.debug("After pipe removal", { headline });

  headline = headline.replace(/\s+-\s+(National|Healthy Debate|The Globe and Mail|Canada Healthwatch|CANADIAN AFFAIRS|The Hill Times|Mother Jones|Brighter World|Barrie News)\s*$/i, "");
  
  // Remove em-dash suffixes (– and -) 
  headline = headline.replace(/\s*–\s*(Winnipeg Free Press|The Independent)\s*$/i, "");
  headline = headline.replace(/\s*-\s*(The Hub|19)\s*$/i, "");
  headlineLogger.debug("After dash suffix removal", { headline });

  // Remove NPR-specific suffix
  headline = headline.replace(/\s*:\s*Shots\s*-\s*Health\s+News\s*:\s*NPR\s*$/i, "");
  headlineLogger.debug("After NPR suffix removal", { headline });

  // Remove HTML entity dash suffixes (e.g., "&#x2d; Ars Technica")
  headline = headline.replace(/\s*&#x2d;\s*Ars Technica\s*$/i, "");
  headlineLogger.debug("After HTML entity dash suffix removal", { headline });

  // Remove common prefixes
  headline = headline.replace(/^(WATCH|LISTEN|READ|EXCLUSIVE|UPDATE|OPINION|OP-ED|Analysis):\s+/i, "");
  headlineLogger.debug("After prefix removal", { headline });

  // Fix common encoding issues
  headline = headline
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s*\|\s*$/g, "")
    .replace(/\s*\.{3,}\s*$/g, "");
  headlineLogger.debug("After encoding fixes", { headline });

  const final = decode(headline);
  headlineLogger.debug("Final headline", { final });
  return final;
}

// Helper function to get high quality image URL
function getHighQualityImageUrl(imgUrl, host) {
  if (!imgUrl) return "";
  
  try {
    const url = new URL(imgUrl);
    
    // 🎯 TORONTO STAR AND OTHER BLOX SITES (bloximages.chicago2.vip.townnews.com)
    if (url.hostname.includes('bloximages.chicago2.vip.townnews.com')) {
      // Remove small resize parameters and replace with larger ones
      let processed = imgUrl
        // First, handle HTML entities
        .replace(/&amp;/g, '&');
      
      // Check if URL has query parameters
      const hasQuery = processed.includes('?');
      
      // Remove existing parameters we want to replace/remove
      processed = processed
        // Remove crop parameters entirely to get uncropped image
        .replace(/[&?]crop=[^&]*/g, '')
        // Remove existing resize parameters
        .replace(/[&?]resize=[^&]*/g, '')
        // Remove existing order parameters
        .replace(/[&?]order=[^&]*/g, '')
        // Clean up any double ampersands or trailing &
        .replace(/&&+/g, '&')
        .replace(/[&?]$/, '');
      
      // Add our high-quality parameters
      const separator = processed.includes('?') ? '&' : '?';
      processed += `${separator}resize=1200,800&order=resize`;
      
      return processed;
    }
    
    // Postmedia sites
    if (url.hostname.includes('smartcdn.gprod.postmedia.digital')) {
      return imgUrl.replace(/w=\d+/, 'w=1200')
                  .replace(/h=\d+/, 'h=800')
                  .replace(/quality=\d+/, 'quality=90');
    }
    
    // The Trillium (Village Media)
    if (url.hostname.includes('vmcdn.ca')) {
      return imgUrl.replace(/;w=\d+/, ';w=1200')
                  .replace(/;h=\d+/, ';h=800')
                  .replace(/;mode=crop/, ';mode=crop')
                  .replace(/;quality=\d+/, ';quality=85');
    }
    
    // CBC
    if (url.hostname.includes('cbc.ca')) {
      return imgUrl.replace(/\/derivatives\/\w+\//, '/derivatives/16x9_1180/')
                  .replace(/Resize%3D\d+/, 'Resize%3D1180');
    }
    
    // Global News
    if (url.hostname.includes('globalnews.ca')) {
      return imgUrl.replace(/w=\d+/, 'w=1200')
                  .replace(/h=\d+/, 'h=800')
                  .replace(/quality=\d+/, 'quality=85');
    }
    
    // Globe and Mail
    if (url.hostname.includes('theglobeandmail.com')) {
      return imgUrl.replace(/width=\d+/, 'width=1200')
                  .replace(/quality=\d+/, 'quality=85');
    }
    
    // 🎯 GUARDIAN: Clean and optimize image URLs
    if (url.hostname.includes('i.guim.co.uk')) {
      // 🚨 SIGNATURE PRESERVATION: Guardian uses signed URLs
      // Remove overlay parameters that cause image display issues
      // Handle both encoded and unencoded versions
      return imgUrl
        .replace(/[&?]overlay-align=[^&]*/g, '')
        .replace(/[&?]overlay-width=[^&]*/g, '')
        .replace(/[&?]overlay-base64=[^&]*/g, '')
        // Clean up parameter formatting
        .replace(/&+/g, '&')
        .replace(/[&?]$/, '');
    }
    
    // Generic WordPress sites (like Healthy Debate)
    if (imgUrl.includes('wp-content/uploads/')) {
      // Most WordPress installations keep high-res originals
      return imgUrl;
    }
    
    return imgUrl;
  } catch {
    return imgUrl;
  }
}

// 🎯 CONTENT-FIRST IMAGE EXTRACTION: Simple and elegant approach
function extractContentImage(html, url) {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, '');
    
    // 🌐 DOMAIN-SPECIFIC OVERRIDES: Some sites work better with social previews
    if (host === 'globalnews.ca') {
      // Global News: Social previews are actually high-quality and relevant
      return null; // Let it fall back to social preview extraction
    }
    
    if (host === 'cbc.ca') {
      // CBC: Social previews use the main story image, avoiding complex HTML parsing
      return null; // Let it fall back to social preview extraction
    }
    
    if (host === 'thetyee.ca') {
      // The Tyee: Social previews use the main story image, avoiding author byline images
      return null; // Let it fall back to social preview extraction
    }
    
    if (host === 'healthydebate.ca') {
      // Healthy Debate: Social previews are more reliable than content parsing
      return null; // Let it fall back to social preview extraction
    }

    if (host === 'cabinradio.ca') {
      // Cabin Radio: Social previews are more reliable than content parsing
      return null; // Let it fall back to social preview extraction
    }

    if (host === 'npr.org') {
      // NPR: Social previews are more reliable than content parsing
      return null; // Let it fall back to social preview extraction
    }

    if (host === 'ctvnews.ca') {
      // CTV News: Social previews are more reliable than content parsing
      return null; // Let it fall back to social preview extraction
    }
    
    if (host === 'theguardian.com') {
      // Guardian: Look for main article image in HTML to avoid overlay-laden social previews
      const guardianImgMatch = html.match(/<img[^>]+data-component="image"[^>]+src="([^"]+)"/i) ||
                              html.match(/<picture[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<\/picture>/i) ||
                              html.match(/<figure[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<\/figure>/i);
      
      if (guardianImgMatch) {
        let guardianImg = guardianImgMatch[1];
        // Convert relative URLs to absolute
        if (guardianImg.startsWith('/')) {
          guardianImg = new URL(guardianImg, url).href;
        }
        return guardianImg;
      }
      
      // Fallback to social preview only if no content image found
      return null; 
    }
    
    // Find the h1 tag first
    const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
    if (!h1Match) return null;
    
    // Get content after h1 (first 5KB for performance)
    const h1Index = html.indexOf(h1Match[0]) + h1Match[0].length;
    const contentAfterH1 = html.substring(h1Index, h1Index + 5000);
    
    // Find the first valid image in the content
    return findFirstValidImage(contentAfterH1, url);
    
  } catch (e) {
    imageLogger.warn('Error extracting content image', { error: e.message });
    return null;
  }
}

// Helper function to find the first valid image in given content
function findFirstValidImage(content, url) {
  const imgRegex = /<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    let imgUrl = imgMatch[1];
    const fullImgTag = imgMatch[0];
    
    // 🎯 HTML ENTITY DECODING: Fix &#038; and other entities in URLs
    imgUrl = decode(imgUrl);
    
    // Skip base64 images (placeholders, lazy loading)
    if (imgUrl.startsWith('data:')) {
      continue;
    }
    
    // Convert relative URLs to absolute
    if (imgUrl.startsWith('/')) {
      imgUrl = new URL(imgUrl, url).href;
    }
    
    // 🚨 ROBUST VALIDATION: Reject broken/truncated URLs
    try {
      const urlObj = new URL(imgUrl);
      
      // Reject broken CloudFront URLs (too short, missing file extension)
      if (urlObj.hostname.includes('cloudfront.net')) {
        const pathname = urlObj.pathname;
        if (pathname.length < 20 || (!pathname.includes('.') && pathname.split('/').pop().length < 20)) {
          imageLogger.debug('Skipping broken CloudFront URL', { imgUrl });
          continue;
        }
      }
      
      // Reject URLs that are too short to be valid image URLs
      if (imgUrl.length < 50) {
        imageLogger.debug('Skipping too-short URL', { imgUrl });
        continue;
      }
    } catch (e) {
      continue; // Invalid URL, skip it
    }
    
    // 🎯 ENHANCED BYLINE FILTERING: Skip author photos, small icons, and non-content images
    if (imgUrl.includes('logo') || 
        imgUrl.includes('icon') || 
        imgUrl.includes('avatar') ||
        imgUrl.includes('badge') ||
        imgUrl.includes('button') ||
        imgUrl.includes('placeholder') ||
        imgUrl.includes('spacer') ||
        imgUrl.includes('transparent') ||
        imgUrl.includes('blank') ||
        imgUrl.includes('byline') ||
        imgUrl.includes('author') ||
        fullImgTag.includes('byline') ||
        fullImgTag.includes('c-byline') ||
        fullImgTag.includes('data-cy="author-image-img"') ||
        fullImgTag.includes('class="author-image"') ||
        fullImgTag.includes('class="authorprofile-image"') ||
        fullImgTag.includes('authorprofile-image') ||
        fullImgTag.includes('author-image')) {
      imageLogger.debug('Skipping author/byline/non-content image', { imgUrl });
      continue;
    }
    
    // Skip images with small dimensions
    const dimensionMatch = imgUrl.match(/(\d+)x(\d+)/);
    if (dimensionMatch) {
      const width = parseInt(dimensionMatch[1]);
      const height = parseInt(dimensionMatch[2]);
      if (width < 200 || height < 150) {
        continue;
      }
    }
    
    // Check HTML attributes for small dimensions
    const widthMatch = fullImgTag.match(/width=["']?(\d+)["']?/i);
    const heightMatch = fullImgTag.match(/height=["']?(\d+)["']?/i);
    if (widthMatch && heightMatch) {
      const width = parseInt(widthMatch[1]);
      const height = parseInt(heightMatch[1]);
      if (width < 200 || height < 150) {
        imageLogger.debug('Skipping small image', { width, height, imgUrl });
        continue;
      }
    }
    
    // 🎯 FIRST VALID IMAGE: Return immediately when we find a good image
    return imgUrl;
  }
  
  return null;
}

// Helper function to get publication name from URL
function getPublicationName(url) {
  try {
    const hostname = new URL(url).hostname;
    // Remove 'www.' prefix if present
    const host = hostname.replace(/^www\./, '');
    const domain = host.split('.').slice(-2).join('.');
    
    // Special case for CityNews subdomains (e.g. toronto.citynews.ca, vancouver.citynews.ca)
    if (host.endsWith('.citynews.ca') || host === 'citynews.ca') {
      return 'CityNews';
    }
    
    // Check for exact domain match
    if (PUBLICATION_NAMES[host]) {
      return PUBLICATION_NAMES[host];
    }

    // Check for domain match (e.g. nationalpost.com)
    if (PUBLICATION_NAMES[domain]) {
      return PUBLICATION_NAMES[domain];
    }
    
    // Check for subdomain matches (e.g. montreal.ctvnews.ca -> CTV News)
    for (const [key, value] of Object.entries(PUBLICATION_NAMES)) {
      if (host.endsWith('.' + key) || host.endsWith(key)) {
        return value;
      }
    }
    
    // Return placeholder if no match found
    return "Outlet: TKTKTK";
  } catch {
    return "Outlet: TKTKTK";
  }
}

// Helper function to detect article type (news vs opinion)
function detectArticleType(url, html, pick, headline = '') {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, '');

    // Always return 'opinion' for Policy Options
    if (host === 'policyoptions.irpp.org') {
      return 'opinion';
    }

    // 🎯 HEALTHY DEBATE SPECIFIC: Check for categories in HTML
    if (host === 'healthydebate.ca') {
      // Look for category headers in the HTML content
      if (html.match(/<[^>]*>Article<\/[^>]*>/i) || 
          html.match(/>\s*Article\s*</i)) {
        return 'news';
      }
      if (html.match(/<[^>]*>Opinion<\/[^>]*>/i) || 
          html.match(/>\s*Opinion\s*</i) ||
          html.match(/<[^>]*>First Person<\/[^>]*>/i) || 
          html.match(/>\s*First Person\s*</i)) {
        return 'opinion';
      }
      // Default to opinion for /topic/ URLs if no category found (as per user info)
      if (url.includes('/topic/')) {
        return 'opinion';
      }
    }

    // 1. Check URL patterns using our improved helper
    if (detectOpinionFromUrl(url)) {
      return 'opinion';
    }

    // 2. Check headline/title patterns using our helper
    if (detectOpinionFromTitle(headline)) {
      return 'opinion';
    }

    // 3. Check meta tags
    const articleType = pick('article:type', 'og:type', 'article:section', 'article:genre');
    if (articleType) {
      const typeLower = articleType.toLowerCase();
      if (typeLower.includes('opinion') || 
          typeLower.includes('analysis') || 
          typeLower.includes('perspective') ||
          typeLower.includes('editorial') ||
          typeLower.includes('commentary')) {
        return 'opinion';
      }
    }

    // 4. Check JSON-LD data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const cleaned = jsonLdMatch[1].replace(/[\x00-\x1F\x7F]/g, "");
        const json = JSON.parse(cleaned);
        
        // Check article type/genre in JSON-LD
        const articleSection = json.articleSection || json.genre || '';
        if (typeof articleSection === 'string' && 
            (articleSection.toLowerCase().includes('opinion') ||
             articleSection.toLowerCase().includes('analysis') ||
             articleSection.toLowerCase().includes('perspective'))) {
          return 'opinion';
        }
      } catch (_) {}
    }

    // 5. Check common article markers in HTML
    const markers = html.match(/<div[^>]*class="[^"]*(?:article-type|content-type|article-label)[^"]*"[^>]*>([^<]+)<\/div>/i) ||
                   html.match(/<span[^>]*class="[^"]*(?:article-type|content-type|article-label)[^"]*"[^>]*>([^<]+)<\/span>/i);
    if (markers) {
      const markerText = markers[1].toLowerCase();
      if (markerText.includes('opinion') || 
          markerText.includes('analysis') || 
          markerText.includes('perspective') ||
          markerText.includes('editorial') ||
          markerText.includes('commentary')) {
        return 'opinion';
      }
    }

    // Default to 'news' if no opinion markers found
    return 'news';
  } catch (e) {
    logger.warn('Error detecting article type', { error: e });
    return 'news'; // Default to news if detection fails
  }
}

// Helper function to clean up author names
function cleanupAuthor(author) {
  if (!author || typeof author !== 'string') return author;
  
  return decode(author)
    // Remove trailing publication suffixes
    .replace(/\s+The\s+Associated\s+Press$/i, '')
    .replace(/\s+-\s+ICI\.Radio-Canada\.ca$/i, '')
    .replace(/\s+The\s+Canadian\s+Press$/i, '')
    // Clean up common prefixes and suffixes
    .replace(/^Zone\s+\w+\s+-\s+/i, '') // Remove "Zone Politique - " style prefixes
    .replace(/^Author:\s*/i, '') // Remove "Author:" prefix
    .replace(/\s*(?:Contributor|Contributors)\s*$/i, '') // Remove Contributor/Contributors suffix
    .trim();
}

// Helper function to detect article authors
function detectAuthors(url, html, pick) {
  try {
    // Special cases: these domains always return TKTKTK
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, '');
    if (host === 'justanoldcountrydoctor.com' || host === 'cidrap.umn.edu') {
      return { authors: ['Author: TKTKTK'], wasAssociatedPress: false };
    }

    // Helper function to check if original text contains Associated Press
    function checkForAssociatedPress(originalText) {
      if (!originalText || typeof originalText !== 'string') return false;
      const lower = originalText.toLowerCase();
      return lower.includes('the associated press') || lower.includes('associated press');
    }

    // 🎯 HEALTHY DEBATE-SPECIFIC AUTHOR EXTRACTION (EARLY PRIORITY)
    if (host === 'healthydebate.ca') {
      // Look for the specific author structure: <div class="author">...<span class="author-list"><a>Author Name</a>
      const healthyDebateAuthorMatch = html.match(/<div[^>]*class="[^"]*author[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*author-list[^"]*"[^>]*>[\s\S]*?<a[^>]*href="[^"]*">([^<]+)<\/a>/i);
      
      if (healthyDebateAuthorMatch) {
        const author = healthyDebateAuthorMatch[1].trim();
        // Validate it's a reasonable author name
        if (author.length > 2 && author.length < 50) {
          return { 
            authors: [cleanupAuthor(author)], 
            wasAssociatedPress: false 
          };
        }
      }
      
      // If no structured byline found, this is likely a Maddi Dellplain piece (staff writer)
      return { 
        authors: ['Maddi Dellplain'], 
        wasAssociatedPress: false 
      };
    }

    // 🎯 POLICY OPTIONS-SPECIFIC AUTHOR EXTRACTION
    if (host === 'policyoptions.irpp.org') {
      // Look for Policy Options specific pattern first
      const policyOptionsMatch = html.match(/<span[^>]*class="[^"]*meta__author[^"]*"[^>]*>[\s\S]*?by&nbsp;\s*<a[^>]*href="[^"]*">([^<]+)<\/a>/i);
      if (policyOptionsMatch) {
        return { 
          authors: [cleanupAuthor(policyOptionsMatch[1])], 
          wasAssociatedPress: false 
        };
      }
      
      // Fallback: Look for any link in meta-author div
      const authorLinkMatch = html.match(/<div[^>]*class="[^"]*meta-author[^"]*"[\s\S]*?<a[^>]*href="[^"]*authors[^"]*">([^<]+)<\/a>/i);
      if (authorLinkMatch) {
        return { 
          authors: [cleanupAuthor(authorLinkMatch[1])], 
          wasAssociatedPress: false 
        };
      }
    }

    // 🎯 GUARDIAN-SPECIFIC AUTHOR EXTRACTION 
    if (host === 'theguardian.com') {
      // Guardian meta tags contain URLs, but JSON-LD has the actual names
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (jsonLdMatch) {
        try {
          const cleaned = jsonLdMatch[1].replace(/[\x00-\x1F\x7F]/g, "");
          const json = JSON.parse(cleaned);
          
          // Handle both single objects and arrays
          const jsonArray = Array.isArray(json) ? json : [json];
          
          for (const obj of jsonArray) {
            if (obj.author) {
              if (Array.isArray(obj.author)) {
                const originalTexts = obj.author.map(a => a.name || a);
                const wasAP = originalTexts.some(checkForAssociatedPress);
                const authors = originalTexts.map(cleanupAuthor).filter(Boolean);
                if (authors.length) return { authors, wasAssociatedPress: wasAP };
              } else if (typeof obj.author === 'object' && obj.author.name) {
                const originalText = obj.author.name;
                return { 
                  authors: [cleanupAuthor(originalText)], 
                  wasAssociatedPress: checkForAssociatedPress(originalText) 
                };
              }
            }
          }
        } catch (e) {
          // JSON parsing failed, continue to fallback
        }
      }
    }

    // 🎯 POSTMEDIA-SPECIFIC AUTHOR EXTRACTION
    const isPM = POSTMEDIA.some(d => host.endsWith(d));
    
    if (isPM) {
      // First try JSON-LD for Postmedia sites
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (jsonLdMatch) {
        try {
          const cleaned = jsonLdMatch[1].replace(/[\x00-\x1F\x7F]/g, "");
          const json = JSON.parse(cleaned);
          
          // Helper function to extract author from a single object
          function extractAuthorFromObject(obj) {
            if (obj.author && Array.isArray(obj.author)) {
              const originalTexts = obj.author.map(a => a.name || a);
              const wasAP = originalTexts.some(checkForAssociatedPress);
              const authors = originalTexts.map(cleanupAuthor).filter(Boolean);
              if (authors.length) return { authors, wasAssociatedPress: wasAP };
            } else if (obj.author && typeof obj.author === 'object' && obj.author.name) {
              const originalText = obj.author.name;
              return { 
                authors: [cleanupAuthor(originalText)], 
                wasAssociatedPress: checkForAssociatedPress(originalText) 
              };
            }
            return null;
          }
          
          // Handle array of JSON-LD objects (like Healthing.ca)
          if (Array.isArray(json)) {
            for (const item of json) {
              const result = extractAuthorFromObject(item);
              if (result) {
                return result;
              }
            }
          } else {
            // Handle single JSON-LD object
            const result = extractAuthorFromObject(json);
            if (result) {
              return result;
            }
          }
        } catch (e) {
          // JSON parsing failed
        }
      }
      
      // Try parsely-author meta tag as fallback
      const parselyAuthor = pick('parsely-author');
      if (parselyAuthor) {
        return { 
          authors: [cleanupAuthor(parselyAuthor)], 
          wasAssociatedPress: checkForAssociatedPress(parselyAuthor) 
        };
      }
    }

    // 🎯 EMPTY-FIRST APPROACH: Check official "no author" indicators
    // 1. Check JSON-LD for explicit empty/null indicators
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const cleaned = jsonLdMatch[1].replace(/[\x00-\x1F\x7F]/g, "");
        const json = JSON.parse(cleaned);
        
        // If JSON-LD explicitly says no authors, respect that
        if (json.authors && Array.isArray(json.authors) && json.authors.length === 0) {
          return { authors: ['Author: TKTKTK'], wasAssociatedPress: false };
        }
        if (json.byline === null || json.byline === "") {
          return { authors: ['Author: TKTKTK'], wasAssociatedPress: false };
        }
        
        // Handle both single author and multiple authors
        if (json.author) {
          if (Array.isArray(json.author)) {
            const originalTexts = json.author.map(a => a.name || a);
            const wasAP = originalTexts.some(checkForAssociatedPress);
            const authors = originalTexts.map(cleanupAuthor).filter(Boolean);
            if (authors.length) return { authors, wasAssociatedPress: wasAP };
          } else if (typeof json.author === 'object') {
            if (json.author.name) {
              const originalText = json.author.name;
              return { 
                authors: [cleanupAuthor(originalText)], 
                wasAssociatedPress: checkForAssociatedPress(originalText) 
              };
            }
          } else if (typeof json.author === 'string') {
            const originalText = json.author;
            return { 
              authors: [cleanupAuthor(originalText)], 
              wasAssociatedPress: checkForAssociatedPress(originalText) 
            };
          }
        }
      } catch (_) {}
    }

    // 2. Check meta tags for explicit empty indicators
    const metaAuthors = pick('article:author', 'author', 'dc.creator', 'byl');
    if (metaAuthors === "" || metaAuthors === null) {
      return { authors: ['Author: TKTKTK'], wasAssociatedPress: false };
    }
    if (metaAuthors) {
      const wasAP = checkForAssociatedPress(metaAuthors);
      // Split on commas or 'and' if multiple authors
      const authors = metaAuthors.split(/,|\sand\s/).map(a => 
        cleanupAuthor(a.replace(/^by\s+|^By\s+/, '').trim())
      ).filter(Boolean);
      return { authors, wasAssociatedPress: wasAP };
    }

    // 3. Try improved HTML author detection (last resort)
    const htmlAuthor = detectAuthorFromHtml(html, url);
    if (htmlAuthor) {
      const wasAP = checkForAssociatedPress(htmlAuthor);
      return { authors: [htmlAuthor], wasAssociatedPress: wasAP };
    }

    return { authors: ['Author: TKTKTK'], wasAssociatedPress: false }; // Default to placeholder if nothing found
  } catch (error) {
    logger.error('Error detecting authors', { error });
    return { authors: ['Author: TKTKTK'], wasAssociatedPress: false }; // Return placeholder on error
  }
}

function isPaywalled(url, html, pick) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    
    // 0. Check FREE_DOMAINS first (never paywalled)
    if (FREE_DOMAINS.some(domain => host.endsWith(domain))) {
      paywallLogger.debug('Domain-based free content detection', { host });
      return false;
    }
    
    // 1. Check PAYWALLED_DOMAINS (always paywalled)
    if (PAYWALLED_DOMAINS.some(domain => host.endsWith(domain))) {
      paywallLogger.debug('Domain-based paywall detection', { host });
      return true;
    }

    // 2. Special handling for The Star
    if (host.endsWith('thestar.com')) {
      // Check for subscriber/premium indicators
      const isSubscriberContent = 
        html.includes('For Subscribers') ||
        html.includes('class="basic-paywall"') ||
        html.includes('class="premium-paywall"') ||
        html.includes('data-access="premium"') ||
        html.includes('data-access="metered"');

      if (isSubscriberContent) {
        paywallLogger.debug('Toronto Star premium content detected');
        return true;
      }

      // Check for explicit free content markers
      const isFreeContent = 
        html.includes('data-access="free"') ||
        html.includes('class="free-content"');

      if (isFreeContent) {
        paywallLogger.debug('Toronto Star free content detected');
        return false;
      }
    }

    // 3. Check meta tags (reliable when present)
    const metaAccessible = pick('isAccessibleForFree');
    const contentTier = pick('article:content_tier');
    
    if (metaAccessible === 'false' || contentTier === 'premium' || contentTier === 'metered') {
      paywallLogger.debug('Meta-based paywall detection', { metaAccessible, contentTier });
      return true;
    }

    // 4. Postmedia-specific paywall detection
    const POSTMEDIA = [
      "nationalpost.com", "montrealgazette.com", "ottawacitizen.com",
      "vancouversun.com", "edmontonjournal.com", "calgaryherald.com",
      "leaderpost.com", "thestarphoenix.com", "windsorstar.com",
      "theprovince.com", "torontosun.com", "winnipegsun.com",
      "calgarysun.com", "edmontonsun.com", "lfpress.com", "ottawasun.com", "canada.com",
      "healthing.ca", "stcatharinesstandard.ca"
    ];
    
    const isPostmedia = POSTMEDIA.some(d => host.endsWith(d));
    
    if (isPostmedia) {
      // For Postmedia, check for subscription barriers immediately after article content
      // This distinguishes between promotional content (hidden) and actual content blocking
      
      // Check for explicit paywall indicators first
      const actualPaywallIndicators = [
        'class="paywall"',
        'id="paywall"',
        'data-paywall="true"',
        'subscription-required',
        'content-gate'
      ];
      
      const hasActualPaywall = actualPaywallIndicators.some(indicator => 
        html.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (hasActualPaywall) {
        paywallLogger.debug('Postmedia explicit paywall indicator detected');
        return true;
      }
      
      // Look for subscription content immediately after the article body
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        const afterArticleIndex = html.indexOf(articleMatch[0]) + articleMatch[0].length;
        const afterArticle = html.substring(afterArticleIndex, afterArticleIndex + 3000).toLowerCase();
        
        // Check for subscription barriers right after article content (not promotional sidebars)
        const hasPostArticleBarrier = (
          afterArticle.includes('subscribe') || 
          afterArticle.includes('premium') ||
          afterArticle.includes('continue')
        ) && !afterArticle.includes('class="intro-body__premium hidden"');
        
        if (hasPostArticleBarrier) {
          paywallLogger.debug('Postmedia subscription barrier found after article content');
          return true;
        }
      }
      
      // Very specific paywall phrases that indicate actual blocking
      const definitePaywallPhrases = [
        'this article is exclusive to subscribers',
        'premium subscriber content only',
        'subscription required to read this article',
        'content blocked for non-subscribers'
      ];
      
      for (const phrase of definitePaywallPhrases) {
        if (html.toLowerCase().includes(phrase)) {
          paywallLogger.debug('Postmedia definite paywall phrase detected', { phrase });
          return true;
        }
      }
      
      // For Postmedia sites, default to free unless we have strong evidence of paywall
      paywallLogger.debug('Postmedia site - no definitive paywall indicators found');
      return false;
    }

    // 5. Content analysis (for non-Postmedia dynamic paywalls)
    const paywallPhrases = [
      'subscribe to continue reading',
      'sign in to keep reading',
      'subscribe to read more',
      'subscribers only',
      'premium content',
      'subscribe now to read'
    ];

    const hasPaywallPhrase = paywallPhrases.some(phrase => 
      html.toLowerCase().includes(phrase)
    );

    if (hasPaywallPhrase) {
      paywallLogger.debug('Content-based paywall detection');
      return true;
    }

    return false;

  } catch (error) {
    paywallLogger.error('Error in paywall detection:', error);
    // If we can't determine, assume not paywalled
    return false;
  }
}

// Main scraping function
export async function scrapeInfo(url, cf = { cacheTtl: 300 }, depth = 0, visited = new Set()) {
  url = sanitizeUrl(url);

  if (depth > 2) throw new Error("too many redirects");
  if (visited.has(url)) throw new Error("repeat url");
  visited.add(url);

  const urlObj = new URL(url);
  const host = urlObj.hostname.replace(/^www\./, '');
  const isCBC = host.endsWith("cbc.ca");
  const isPM = POSTMEDIA.some(d => host.endsWith(d));
  const isTrillium = host === "thetrillium.ca";
  const isCP = host === "thecanadianpressnews.ca";

  // Get publication name early
  let publication = getPublicationName(url);

  // 🎯 USE NEW 2025 OPERA-POWERED BROWSER HEADERS UTILITY
  const headers = getSiteOptimizedHeaders(url);

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort("timeout"), isPM ? 8000 : 4000);

  let html = "";
  try {
    if (isPM) {
      html = await fetchWithRetry(url, {
        headers,
        redirect: "follow",
        signal: ctrl.signal,
        cf,
      });
    } else {
      html = await (
        await fetch(url, {
          headers,
          redirect: "follow",
          signal: ctrl.signal,
          cf,
        })
      ).text();
    }
  } catch (e) {
    fetchLogger.error('Failed to fetch URL', { url, error: e.message });
    if (!isPM) throw e;
  } finally {
    clearTimeout(tid);
  }

  if (isCBC && /<title>\s*Access Denied/i.test(html)) {
    html = await (await fetch(url, { redirect: "follow", cf })).text();
  }

  // Helper functions for meta tag extraction (moved up for use in Postmedia parser)
  function pick(...names) {
    for (const n of names) {
      metaLogger.debug("Checking meta tag", { tag: n });
      
      // Original regex for properly formatted HTML
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']?${n}["']?[^>]*content=(["'])([\\s\\S]*?)\\1`, "i");
      const match = re.exec(html);
      if (match) {
        metaLogger.debug("Found meta tag match", { tag: n, content: match[2].trim() });
        return match[2].trim();
      }
      
      // Additional regex for malformed HTML where content and name/property are smashed together
      // BUT with better boundaries to avoid capturing too much
      const malformedRe = new RegExp(`<meta[^>]*content=(["'])([^"'<>]{1,200}?)\\1\\s*(?:property|name)=["']?${n}["']?`, "i");
      const malformedMatch = malformedRe.exec(html);
      if (malformedMatch) {
        metaLogger.debug("Found malformed meta tag match", { tag: n, content: malformedMatch[2].trim() });
        return malformedMatch[2].trim();
      }
    }
    return "";
  }

  function pickRev(n) {
    metaLogger.debug("Checking reversed meta tag", { tag: n });
    const re = new RegExp(`<meta[^>]*content=(["'])([\\s\\S]*?)\\1[^>]*(?:property|name)=["']?${n}["']?`, "i");
    const match = re.exec(html);
    if (match) {
      metaLogger.debug("Found reversed meta tag match", { tag: n, content: match[2].trim() });
    }
    return match ? match[2].trim() : "";
  }

  // 🧠 Postmedia-specific parser
  if (isPM) {
    // Helper function for Postmedia author extraction
    function extractPostmediaAuthors(json) {
      // 🎯 HEALTHING.CA SPECIFIC: Handle JSON-LD array structure
      if (host === 'healthing.ca' && Array.isArray(json)) {
        const newsArticle = json.find(item => item['@type'] === 'NewsArticle');
        if (newsArticle) {
          if (newsArticle.author && newsArticle.author.name) {
            return [cleanupAuthor(newsArticle.author.name)];
          }
        }
      } else if (json && json.author && Array.isArray(json.author)) {
        const authors = json.author.map(a => cleanupAuthor(a.name || a)).filter(Boolean);
        if (authors.length) return authors;
      } else if (json && json.author && typeof json.author === 'object' && json.author.name) {
        return [cleanupAuthor(json.author.name)];
      }
      
      // Try parsely-author meta tag as fallback
      const parselyAuthor = pick('parsely-author');
      if (parselyAuthor) {
        return [cleanupAuthor(parselyAuthor)];
      }
      
      return ['Author: TKTKTK']; // Default fallback
    }

    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const cleaned = jsonLdMatch[1].replace(/[\x00-\x1F\x7F]/g, "");
        const json = JSON.parse(cleaned);

        let head, img;
        
        // 🎯 HEALTHING.CA SPECIFIC: Handle array structure
        if (host === 'healthing.ca' && Array.isArray(json)) {
          const newsArticle = json.find(item => item['@type'] === 'NewsArticle');
          if (newsArticle) {
            head = newsArticle.headline?.trim();
            img = Array.isArray(newsArticle.image)
              ? newsArticle.image[0]?.url?.trim()
              : newsArticle.image?.url?.trim();
          }
        } else {
          // Standard Postmedia structure
          head = json.headline?.trim();
          img = Array.isArray(json.image)
            ? json.image[0]?.url?.trim()
            : json.image?.url?.trim();
        }

        if (head && img) {
          // Get article type and authors before returning
          const articleType = detectArticleType(url, html, pick, head);
          const authors = extractPostmediaAuthors(json);
          return {
            headline: cleanupHeadline(head, host),
            image: getHighQualityImageUrl(img, host),
            url,
            publication,
            articleType,
            authors,
            isPaywalled: isPaywalled(url, html, pick),
            html
          };
        }
      } catch (_) {}
    }

    // Try meta tags as fallback
    const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=(["'])([^]*?)\\1[^>]*>/i) || [])[2];
    const ogImage = (html.match(/<meta[^>]+property=["']og:image["'][^>]*content=(["'])([^]*?)\\1[^>]*>/i) || [])[2];
    
    if (ogTitle && ogImage) {
      // Get article type and authors before returning
      const articleType = detectArticleType(url, html, pick, ogTitle);
      const authors = extractPostmediaAuthors(null);
      return { 
        headline: cleanupHeadline(ogTitle, host),
        image: getHighQualityImageUrl(ogImage, host),
        url,
        publication,
        articleType,
        authors,
        isPaywalled: isPaywalled(url, html, pick),
        html
      };
    }

    // Try article schema as another fallback
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const articleHtml = articleMatch[1];
      const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const imgMatch = articleHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      
      if (titleMatch && imgMatch) {
        // Get article type and authors before returning
        const articleType = detectArticleType(url, html, pick, titleMatch[1].replace(/<[^>]*>/g, '').trim());
        const authors = extractPostmediaAuthors(null);
        return {
          headline: cleanupHeadline(titleMatch[1].replace(/<[^>]*>/g, '').trim(), host),
          image: getHighQualityImageUrl(imgMatch[1], host),
          url,
          publication,
          articleType,
          authors,
          isPaywalled: isPaywalled(url, html, pick),
          html
        };
      }
    }
  }

  // For Postmedia sites, try to get the headline from JSON-LD first
  let head = "";
  if (isPM || isTrillium) {
    // First try to get the title from meta tags for Postmedia sites
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      head = titleMatch[1].replace(/\s*\|\s*National Post$/, '');
    }

    // Also try og:title as backup
    if (!head) {
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=(["'])([^]*?)\\1[^>]*>/i);
      if (ogTitleMatch) {
        head = ogTitleMatch[2];
      }
    }

    // Try JSON-LD as last resort
    if (!head) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">\s*({[^<]+})\s*<\/script>/i);
      if (jsonLdMatch) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          if (data["@type"] === "NewsArticle" && data.headline) {
            head = data.headline;
          }
        } catch (e) {
          logger.error("Failed to parse JSON-LD", { error: e.message });
        }
      }
    }
  }

  // If still no headline, try other meta tags
  if (!head) {
    headlineLogger.debug("Trying meta tags for headline");
    const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=(["'])([^]*?)\\1[^>]*>/i) || [])[2];
    const titleTag = (html.match(/<title>([^<]+)<\/title>/i) || [])[1];
    headlineLogger.debug("Meta tag results", { ogTitle, titleTag });
    head = ogTitle || titleTag;
  }

  // If still no headline, try other meta tags
  if (!head || head.length < 15) {
    headlineLogger.debug("Trying additional meta tags");
    head = pick("twitter:title") || pickRev("og:title");
  }

  // If still no headline, try h1
  if (!head || head.length < 15 || /&#8217;?$/i.test(head) || /don$/.test(head) || head === "(untitled)") {
    headlineLogger.debug("Trying h1 tag");
    const h1 = html.match(/<h1[^>]*>([\s\S]+?)<\/h1>/i);
    if (h1) {
      headlineLogger.debug("Found h1", { content: h1[1] });
      head = h1[1].replace(/<[^>]*>/g, "").trim();
    }
  }

  let img = "";
  
  // For Postmedia sites, try to get image from JSON-LD first
  if (isPM || isTrillium) {
    const jsonLd = html.match(/<script type="application\/ld\+json">\s*({[\s\S]+?})\s*<\/script>/i);
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd[1]);
        if (data.image && Array.isArray(data.image) && data.image[0] && data.image[0].url) {
          img = data.image[0].url;
        }
      } catch (e) {
        logger.error("Failed to parse JSON-LD for image", { error: e.message });
      }
    }
  }

  // If no image from JSON-LD, try content-first extraction, then fallback to meta tags
  if (!img) {
    // 🎯 CONTENT-FIRST: Try to find the first image after h1 (article content)
    const contentImg = extractContentImage(html, url);
    if (contentImg) {
      img = contentImg;
      imageLogger.debug('Found content image after h1', { img });
    } else {
      // Fallback to social preview images
      img = pick("twitter:image", "twitter:image:src", "og:image", "og:image:url", "og:image:secure_url") ||
            pickRev("twitter:image") ||
            pickRev("og:image");
      imageLogger.debug('Using social preview image', { img });
    }
  }

  // For Postmedia sites, try to get image from link tags
  if ((!img || img.includes('scorecardresearch.com')) && isPM) {
    const linkMatch = html.match(/<link[^>]+imagesrcset=["']([^"']+)["']/i);
    if (linkMatch) {
      const srcset = linkMatch[1];
      const match = srcset.match(/https:\/\/smartcdn\.gprod\.postmedia\.digital\/[^,\s]+/);
      if (match) {
        img = match[0];
      }
    }
  }

  // For The Trillium, try to get image from vmcdn.ca
  if ((!img || img.includes('width=device-width')) && isTrillium) {
    const vmcdnMatch = html.match(/https:\/\/www\.vmcdn\.ca\/[^"'\s]+/i);
    if (vmcdnMatch) {
      img = vmcdnMatch[0];
    }
  }

  if (!img || img.length < 5) {
    // Try Guardian-specific image pattern first
    const guardianMatch = html.match(/data-picture-src="([^"]+)"|data-original-url="([^"]+)"|data-component="image-block"[^>]*data-url="([^"]+)"/i);
    if (guardianMatch) {
      img = guardianMatch[1] || guardianMatch[2] || guardianMatch[3];
    }
    
    // Fallback to general image pattern
    if (!img) {
      const match = html.match(/<img[^>]+(?:src|data-src|data-hires|data-original)=["']([^"']+)["']/i);
      if (match) {
        try {
          img = new URL(match[1], url).href;
        } catch {
          img = match[1];
        }
      }
    }
  }

  if (!img && isCBC) {
    const tm = html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/i);
    if (tm) img = tm[1];
  }

  if (img?.startsWith("/")) img = new URL(img, url).href;
  img = getHighQualityImageUrl(decode(img || "").trim(), host);

  // Get article type
  const articleType = detectArticleType(url, html, pick, head);

  // Get authors
  const authorsInfo = detectAuthors(url, html, pick);

  // More targeted Canadian Press vs Associated Press detection
  if (isCP && authorsInfo.wasAssociatedPress) {
    publication = "Associated Press";
  }

  // For Canada Healthwatch, try h1 first since it's the most reliable
  if (host === "canadahealthwatch.ca") {
    const h1Match = html.match(/<h1[^>]*>([\s\S]+?)<\/h1>/i);
    if (h1Match) {
      const headline = h1Match[1].replace(/<[^>]*>/g, "").trim();
      const articleType = detectArticleType(url, html, pick, headline);
      return {
        headline: cleanupHeadline(head, host),
        image: '', // We'll implement image extraction later
        url,
        publication,
        articleType,
        html
      };
    }
  }

  // Return with publication and article type
  return { 
    headline: cleanupHeadline(head, host),
    image: img,
    url,
    publication,
    articleType,
    authors: authorsInfo.authors,
    wasAssociatedPress: authorsInfo.wasAssociatedPress,
    isPaywalled: isPaywalled(url, html, pick),
    html
  };
} 