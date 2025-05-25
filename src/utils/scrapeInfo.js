// import puppeteer from '@cloudflare/puppeteer';

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

function sanitizeUrl(input) {
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
    .replace(/\s*\|\s*(CBC News|CBC Radio|CBC|Globalnews\.ca|CTV News|Toronto Star|The Globe and Mail|National Post|National|Global News)\s*$/i, "")
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

// Main scraping function
export async function scrapeInfo(url, cf = { cacheTtl: 300 }, depth = 0, visited = new Set()) {
  url = sanitizeUrl(url);

  if (depth > 2) throw new Error("too many redirects");
  if (visited.has(url)) throw new Error("repeat url");
  visited.add(url);

  const host = new URL(url).hostname;
  const isCBC = host.endsWith("cbc.ca");
  const isPM = POSTMEDIA.some(d => host.endsWith(d));
  const isTrillium = host.endsWith("thetrillium.ca");

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

  // Original scraping logic continues unchanged...
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

  if (isCBC && /<title>\s*Access Denied/i.test(html)) {
    html = await (await fetch(url, { redirect: "follow", cf })).text();
  }

  // The Trillium-specific parser
  if (isTrillium) {
    // First try: meta tags with property attribute
    const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    const ogImage = (html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    
    if (ogTitle && ogImage && !ogImage.includes('logo_thetrillium')) {
      return { 
        headline: cleanupHeadline(ogTitle, host),
        image: getHighQualityImageUrl(ogImage, host),
        url 
      };
    }

    // Second try: meta tags with name attribute
    const nameTitle = (html.match(/<meta[^>]+name=["']title["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    const nameImage = (html.match(/<meta[^>]+name=["']image["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    
    if (nameTitle && nameImage && !nameImage.includes('logo_thetrillium')) {
      return { 
        headline: cleanupHeadline(nameTitle, host),
        image: getHighQualityImageUrl(nameImage, host),
        url 
      };
    }

    // Third try: article content
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const articleHtml = articleMatch[1];
      const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      
      // Look for images in the article, excluding logos
      const imgMatches = articleHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
      let articleImage = "";
      for (const match of imgMatches) {
        if (!match[1].includes('logo_thetrillium')) {
          articleImage = match[1];
          break;
        }
      }
      
      if (titleMatch && articleImage) {
        return {
          headline: cleanupHeadline(titleMatch[1].replace(/<[^>]*>/g, '').trim(), host),
          image: getHighQualityImageUrl(articleImage, host),
          url
        };
      }
    }

    // Fourth try: title tag and first non-logo image
    const titleTag = (html.match(/<title>([^<]+)<\/title>/i) || [])[1];
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    let firstNonLogo = "";
    for (const match of imgMatches) {
      if (!match[1].includes('logo_thetrillium')) {
        firstNonLogo = match[1];
        break;
      }
    }

    if (titleTag && firstNonLogo) {
      return {
        headline: cleanupHeadline(titleTag.replace(/\s*[-|]\s*The Trillium\s*$/, ''), host),
        image: getHighQualityImageUrl(firstNonLogo, host),
        url
      };
    }

    // If all attempts fail, try to at least get a title
    if (titleTag) {
      return {
        headline: cleanupHeadline(titleTag.replace(/\s*[-|]\s*The Trillium\s*$/, ''), host),
        image: "",
        url
      };
    }
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
          return {
            headline: cleanupHeadline(head, host),
            image: getHighQualityImageUrl(img, host),
            url
          };
        }
      } catch (_) {}
    }

    // Try meta tags as fallback
    const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    const ogImage = (html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || [])[1];
    
    if (ogTitle && ogImage) {
      return { 
        headline: cleanupHeadline(ogTitle, host),
        image: getHighQualityImageUrl(ogImage, host),
        url 
      };
    }

    // Try article schema as another fallback
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const articleHtml = articleMatch[1];
      const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const imgMatch = articleHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      
      if (titleMatch && imgMatch) {
        return {
          headline: cleanupHeadline(titleMatch[1].replace(/<[^>]*>/g, '').trim(), host),
          image: getHighQualityImageUrl(imgMatch[1], host),
          url
        };
      }
    }
  }

  const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || [])[1];
  const titleTag = (html.match(/<title>([^<]+)<\/title>/i) || [])[1];

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

  let head = ogTitle || pick("twitter:title") || pickRev("og:title") || titleTag;

  if (!head || head.length < 15 || /&#8217;?$/i.test(head) || /don$/.test(head) || head === "(untitled)") {
    const h1 = html.match(/<h1[^>]*>([\s\S]+?)<\/h1>/i);
    if (h1) head = h1[1].replace(/<[^>]*>/g, "").trim();
  }

  let img = pick("twitter:image", "twitter:image:src", "og:image", "og:image:url", "og:image:secure_url") ||
            pickRev("twitter:image") ||
            pickRev("og:image");

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

  if (!img && isPM) {
    const tm = html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/i);
    if (tm) img = tm[1];
  }

  if (img?.startsWith("/")) img = new URL(img, url).href;
  img = getHighQualityImageUrl(decode(img || "").trim(), host);

  return { 
    headline: cleanupHeadline(head, host),
    image: img,
    url 
  };
} 