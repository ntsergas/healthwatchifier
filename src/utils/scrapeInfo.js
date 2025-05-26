// import puppeteer from '@cloudflare/puppeteer';

import { PUBLICATION_NAMES } from './constants.js';

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
  "calgarysun.com", "edmontonsun.com", "ottawasun.com", "canada.com",
];

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
      console.warn(`Attempt ${i + 1} failed:`, e.message);
      if (i === retries - 1) throw e;
      await delay(baseDelay * Math.pow(2, i));
    }
  }
  throw new Error('Failed to fetch valid HTML after retries');
}

// Helper function to clean up headlines
function cleanupHeadline(headline, host) {
  if (!headline) return "(untitled)";
  
  headline = headline.replace(/\s+/g, " ").trim()
    // Remove site-specific suffixes
    .replace(/\s*\|\s*(CBC News|CBC Radio|CBC|Globalnews\.ca|CTV News|Toronto Star|The Globe and Mail|National Post|National|Vancouver Sun|Edmonton Journal|Montreal Gazette|The Trillium)\s*$/i, "")
    .replace(/\s+-\s+(National|Healthy Debate|The Globe and Mail)\s*$/i, "")
    // Remove common prefixes
    .replace(/^(WATCH|LISTEN|READ|EXCLUSIVE|UPDATE):\s+/i, "")
    // Fix common encoding issues
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s*\|\s*$/g, "");

  return decode(headline);
}

// Helper function to get high quality image URL
function getHighQualityImageUrl(imgUrl, host) {
  if (!imgUrl) return "";
  
  try {
    const url = new URL(imgUrl);
    
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

// Helper function to get publication name from URL
function getPublicationName(url) {
  try {
    const hostname = new URL(url).hostname;
    // Remove 'www.' prefix if present
    const host = hostname.replace(/^www\./, '');
    const domain = host.split('.').slice(-2).join('.');
    
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
    
    // Return null if no match found
    return null;
  } catch {
    return null;
  }
}

// Helper function to detect article type (news vs opinion)
function detectArticleType(url, html, pick) {
  try {
    // 1. Check URL patterns
    const urlLower = url.toLowerCase();
    if (urlLower.includes('/opinion/') || 
        urlLower.includes('/analysis/') || 
        urlLower.includes('/perspectives/') ||
        urlLower.includes('/perspective/') ||
        urlLower.includes('/op-ed/')) {
      return 'opinion';
    }

    // 2. Check meta tags
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

    // 3. Check JSON-LD data
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

    // 4. Check common article markers in HTML
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
    console.warn('Error detecting article type:', e);
    return 'news'; // Default to news if detection fails
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

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0"
  };

  if (isCBC) headers.Referer = "https://www.cbc.ca/";
  if (isPM) {
    headers.Referer = `https://${host}/`;
    headers["Sec-Fetch-Site"] = "same-origin";
  }

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
    console.error(`Failed to fetch ${url}:`, e.message);
    if (!isPM) throw e;
  } finally {
    clearTimeout(tid);
  }

  // Special handling for Associated Press articles on The Canadian Press website
  if (isCP) {
    // Look for Associated Press byline in multiple places
    const bylineMatch = html.match(/By\s+([^<]+)\s+The\s+Associated\s+Press/i) ||
                       html.match(/<div[^>]*class="[^"]*byline[^"]*"[^>]*>([^<]+)<\/div>/i) ||
                       html.match(/<div[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/div>/i);
    
    // Also check the article content for AP attribution
    const apMention = html.match(/By\s+([^<]+)\s+The\s+Associated\s+Press/i) ||
                     html.match(/The\s+Associated\s+Press/i);
    
    if ((bylineMatch && bylineMatch[1].toLowerCase().includes('associated press')) || apMention) {
      publication = "Associated Press";
    }
  }

  if (isCBC && /<title>\s*Access Denied/i.test(html)) {
    html = await (await fetch(url, { redirect: "follow", cf })).text();
  }

  // 🧠 Postmedia-specific parser
  if (isPM) {
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const cleaned = jsonLdMatch[1].replace(/[\x00-\x1F\x7F]/g, "");
        const json = JSON.parse(cleaned);

        const head = json.headline?.trim();
        const img = Array.isArray(json.image)
          ? json.image[0]?.url?.trim()
          : json.image?.url?.trim();

        if (head && img) {
          // Get article type before returning
          const articleType = detectArticleType(url, html, pick);
          return {
            headline: cleanupHeadline(head, host),
            image: getHighQualityImageUrl(img, host),
            url,
            publication,
            articleType
          };
        }
      } catch (_) {}
    }

    // Try meta tags as fallback
    const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    const ogImage = (html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    
    if (ogTitle && ogImage) {
      // Get article type before returning
      const articleType = detectArticleType(url, html, pick);
      return { 
        headline: cleanupHeadline(ogTitle, host),
        image: getHighQualityImageUrl(ogImage, host),
        url,
        publication,
        articleType
      };
    }

    // Try article schema as another fallback
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const articleHtml = articleMatch[1];
      const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const imgMatch = articleHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      
      if (titleMatch && imgMatch) {
        // Get article type before returning
        const articleType = detectArticleType(url, html, pick);
        return {
          headline: cleanupHeadline(titleMatch[1].replace(/<[^>]*>/g, '').trim(), host),
          image: getHighQualityImageUrl(imgMatch[1], host),
          url,
          publication,
          articleType
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
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      if (ogTitleMatch) {
        head = ogTitleMatch[1];
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
          console.error("Failed to parse JSON-LD:", e.message);
        }
      }
    }
  }

  // If still no headline, try other meta tags
  if (!head) {
    const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    const titleTag = (html.match(/<title>([^<]+)<\/title>/i) || [])[1];
    head = ogTitle || titleTag;
  }

  function pick(...names) {
    for (const n of names) {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']?${n}["']?[^>]*content=(["'])([\\s\\S]*?)\\1`, "i");
      const match = re.exec(html);
      if (match) return match[2].trim();
    }
    return "";
  }

  function pickRev(n) {
    const re = new RegExp(`<meta[^>]*content=(["'])([\\s\\S]*?)\\1[^>]*(?:property|name)=["']?${n}["']?`, "i");
    const match = re.exec(html);
    return match ? match[2].trim() : "";
  }

  // If still no headline, try other meta tags
  if (!head || head.length < 15) {
    head = pick("twitter:title") || pickRev("og:title");
  }

  // If still no headline, try h1
  if (!head || head.length < 15 || /&#8217;?$/i.test(head) || /don$/.test(head) || head === "(untitled)") {
    const h1 = html.match(/<h1[^>]*>([\s\S]+?)<\/h1>/i);
    if (h1) head = h1[1].replace(/<[^>]*>/g, "").trim();
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
        console.error("Failed to parse JSON-LD for image:", e.message);
      }
    }
  }

  // If no image from JSON-LD, try meta tags
  if (!img) {
    img = pick("twitter:image", "twitter:image:src", "og:image", "og:image:url", "og:image:secure_url") ||
          pickRev("twitter:image") ||
          pickRev("og:image");
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
  const articleType = detectArticleType(url, html, pick);

  // Return with publication and article type
  return { 
    headline: cleanupHeadline(head, host),
    image: img,
    url,
    publication,
    articleType
  };
} 