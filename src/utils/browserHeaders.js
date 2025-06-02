import { logger } from './logger.js';

// 🎯 2025 BROWSER HEADER SPOOFING UTILITY
// Optimized for Opera and modern anti-bot evasion

const headerLogger = logger.child('BROWSER_HEADERS');

// 🔥 REALISTIC BROWSER PROFILES (Updated for 2025)
const BROWSER_PROFILES = {
  // 🎯 OPERA PROFILES (Primary - matches user's actual browser)
  opera_110_windows: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0",
    secChUa: '"Opera";v="110", "Chromium";v="124", "Not:A-Brand";v="99"',
    secChUaMobile: "?0",
    secChUaPlatform: '"Windows"',
    acceptLanguage: "en-US,en;q=0.9",
    platform: "windows"
  },
  opera_109_windows: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0",
    secChUa: '"Opera";v="109", "Chromium";v="123", "Not:A-Brand";v="99"',
    secChUaMobile: "?0",
    secChUaPlatform: '"Windows"',
    acceptLanguage: "en-US,en;q=0.9",
    platform: "windows"
  },
  
  // 🎯 CHROME PROFILES (Fallback options)
  chrome_131_windows: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaMobile: "?0",
    secChUaPlatform: '"Windows"',
    acceptLanguage: "en-US,en;q=0.9",
    platform: "windows"
  },
  
  // 🎯 FIREFOX PROFILE (No Client Hints)
  firefox_132_windows: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
    acceptLanguage: "en-US,en;q=0.5", // Firefox uses different q-values
    platform: "windows"
  }
};

// 🎯 ORGANIC REFERER SOURCES (Rotated for realistic traffic patterns)
const COMMON_REFERERS = [
  "https://www.google.com/",
  "https://www.google.ca/",
  "https://www.bing.com/",
  "https://duckduckgo.com/",
  "https://news.google.com/",
  "https://www.reddit.com/",
  "https://twitter.com/",
  "https://www.facebook.com/"
];

/**
 * 🎯 GENERATE REALISTIC BROWSER HEADERS FOR 2025 ANTI-BOT EVASION
 * @param {Object} options - Configuration options
 * @param {string} options.url - Target URL for context-aware headers
 * @param {string} options.profile - Browser profile to use (defaults to Opera)
 * @param {string} options.referer - Custom referer (optional, will use smart default)
 * @param {boolean} options.sameOrigin - Whether this is a same-origin request
 * @returns {Object} Complete header object ready for fetch() - IN BROWSER ORDER
 */
export function generateBrowserHeaders(options = {}) {
  const { url, profile, referer, sameOrigin = false } = options;
  
  headerLogger.debug('Generating browser headers', { url, profile, sameOrigin });
  
  // 🎯 DEFAULT TO OPERA (user's actual browser)
  const selectedProfile = profile || 'opera_110_windows';
  const browserProfile = BROWSER_PROFILES[selectedProfile];
  
  if (!browserProfile) {
    throw new Error(`Unknown browser profile: ${selectedProfile}`);
  }
  
  headerLogger.debug('Selected browser profile', { selectedProfile });
  
  // 🎯 SMART REFERER LOGIC
  let smartReferer = referer;
  if (!smartReferer && url) {
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname.replace(/^www\./, '');
      
      if (sameOrigin) {
        // For same-origin requests, use the site's homepage
        smartReferer = `https://${urlObj.hostname}/`;
      } else {
        // For cross-origin, use a random search engine (weighted toward Google)
        const refererWeights = [
          "https://www.google.com/",
          "https://www.google.com/",
          "https://www.google.com/", // 3x weight for Google
          "https://www.google.ca/",
          "https://www.bing.com/",
          "https://duckduckgo.com/",
          "https://news.google.com/"
        ];
        smartReferer = refererWeights[Math.floor(Math.random() * refererWeights.length)];
      }
    } catch (e) {
      // Fallback to Google if URL parsing fails
      smartReferer = "https://www.google.com/";
    }
  }
  
  // 🎯 BUILD HEADERS IN EXACT BROWSER ORDER (Critical for advanced detection)
  const headers = {};
  
  // Core headers in typical browser order
  headers["User-Agent"] = browserProfile.userAgent;
  headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
  headers["Accept-Language"] = browserProfile.acceptLanguage;
  headers["Accept-Encoding"] = "gzip, deflate, br"; // 🎯 CRITICAL: Include Brotli
  headers["Connection"] = "keep-alive";
  
  // Add referer early in the order (browsers typically send it here)
  if (smartReferer) {
    headers["Referer"] = smartReferer;
  }
  
  headers["Cache-Control"] = "max-age=0";
  headers["Upgrade-Insecure-Requests"] = "1";
  
  // 🎯 SEC-FETCH HEADERS (Modern browser requirement)
  headers["Sec-Fetch-Site"] = sameOrigin ? "same-origin" : "none";
  headers["Sec-Fetch-Mode"] = "navigate";
  headers["Sec-Fetch-User"] = "?1";
  headers["Sec-Fetch-Dest"] = "document";
  
  // 🎯 CHROME CLIENT HINTS (Only for Chromium-based browsers)
  if (browserProfile.secChUa) {
    headers["Sec-CH-UA"] = browserProfile.secChUa;
    headers["Sec-CH-UA-Mobile"] = browserProfile.secChUaMobile;
    headers["Sec-CH-UA-Platform"] = browserProfile.secChUaPlatform;
  }
  
  headerLogger.debug('Generated headers', { 
    profile: selectedProfile, 
    referer: smartReferer,
    headerCount: Object.keys(headers).length,
    hasClientHints: !!browserProfile.secChUa
  });
  
  return headers;
}

/**
 * 🎯 GET SITE-OPTIMIZED HEADERS (Based on known anti-bot patterns)
 * @param {string} url - Target URL
 * @returns {Object} Site-optimized headers
 */
export function getSiteOptimizedHeaders(url) {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, '');
    
    headerLogger.debug('Getting site-optimized headers', { host });
    
    const baseOptions = { url };
    
    // 🎯 POSTMEDIA SITES (Known to be picky)
    if (host.includes('postmedia') || 
        host.endsWith('nationalpost.com') || 
        host.endsWith('calgaryherald.com') || 
        host.endsWith('vancouversun.com') ||
        host.endsWith('edmontonjournal.com') ||
        host.endsWith('montrealgazette.com') ||
        host.endsWith('ottawacitizen.com') ||
        host.endsWith('healthing.ca')) {
      return generateBrowserHeaders({
        ...baseOptions,
        sameOrigin: true,
        profile: 'opera_110_windows', // Opera works well with Postmedia
        referer: `https://${host}/`
      });
    }
    
    // 🎯 CBC (Sometimes blocks, use varied approach)
    if (host.endsWith('cbc.ca')) {
      return generateBrowserHeaders({
        ...baseOptions,
        profile: 'opera_110_windows',
        referer: 'https://www.cbc.ca/'
      });
    }
    
    // 🎯 GUARDIAN (Sophisticated detection)
    if (host.endsWith('theguardian.com')) {
      return generateBrowserHeaders({
        ...baseOptions,
        profile: 'opera_110_windows' // Full Opera fingerprint
      });
    }
    
    // 🎯 NYT AND OTHER PREMIUM SITES
    if (host.endsWith('nytimes.com') || 
        host.endsWith('wsj.com') || 
        host.endsWith('ft.com')) {
      return generateBrowserHeaders({
        ...baseOptions,
        profile: 'opera_110_windows',
        referer: 'https://www.google.com/' // They're referral-sensitive
      });
    }
    
    // 🎯 DEFAULT: Use Opera for all other sites
    return generateBrowserHeaders({
      ...baseOptions,
      profile: 'opera_110_windows'
    });
    
  } catch (e) {
    headerLogger.warn('Error generating site-optimized headers, using defaults', { error: e.message });
    return generateBrowserHeaders({ 
      url,
      profile: 'opera_110_windows' 
    });
  }
}

/**
 * 🎯 ROTATE BETWEEN OPERA VERSIONS (Avoid detection from repeated requests)
 * @returns {string} A fresh Opera User-Agent string
 */
export function getRotatedOperaUserAgent() {
  const operaProfiles = Object.entries(BROWSER_PROFILES)
    .filter(([key]) => key.startsWith('opera_'))
    .map(([, profile]) => profile.userAgent);
  
  return operaProfiles[Math.floor(Math.random() * operaProfiles.length)];
}

/**
 * 🎯 VALIDATE HEADERS FOR DEBUGGING (Catch common mistakes)
 * @param {Object} headers - Headers object to validate
 * @returns {Object} Validation result with warnings
 */
export function validateHeaders(headers) {
  const warnings = [];
  const required = ['User-Agent', 'Accept', 'Accept-Language', 'Accept-Encoding'];
  
  // Check for required headers
  for (const header of required) {
    if (!headers[header]) {
      warnings.push(`❌ Missing required header: ${header}`);
    }
  }
  
  // Check for Brotli support
  if (headers['Accept-Encoding'] && !headers['Accept-Encoding'].includes('br')) {
    warnings.push('⚠️ Missing Brotli (br) in Accept-Encoding - major bot tell');
  }
  
  // Check for Opera UA without proper Client Hints
  const ua = headers['User-Agent'] || '';
  if (ua.includes('OPR/') && !headers['Sec-CH-UA']?.includes('Opera')) {
    warnings.push('⚠️ Opera User-Agent without matching Sec-CH-UA');
  }
  
  // Check for outdated versions
  const operaMatch = ua.match(/OPR\/(\d+)/);
  if (operaMatch && parseInt(operaMatch[1]) < 108) {
    warnings.push('⚠️ Opera version appears outdated (< 108)');
  }
  
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && parseInt(chromeMatch[1]) < 120) {
    warnings.push('⚠️ Chrome version appears outdated (< 120)');
  }
  
  // Check for missing Sec-Fetch headers
  const secFetchHeaders = ['Sec-Fetch-Site', 'Sec-Fetch-Mode', 'Sec-Fetch-User', 'Sec-Fetch-Dest'];
  const missingSec = secFetchHeaders.filter(h => !headers[h]);
  if (missingSec.length > 0) {
    warnings.push(`⚠️ Missing Sec-Fetch headers: ${missingSec.join(', ')}`);
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
    score: Math.max(0, 100 - (warnings.length * 15)) // Scoring system
  };
}

// Export profiles for advanced usage
export { BROWSER_PROFILES, COMMON_REFERERS }; 