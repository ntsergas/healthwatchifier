/**
 * Comprehensive HTML entity decoder that handles both standard entities and special cases.
 * 
 * Handles:
 * - Standard HTML entities (&amp;, &lt;, &gt;, etc.)
 * - Quotes and apostrophes (&#x27;, &apos;, &rsquo;, &lsquo;, etc.)
 * - Numeric entities (&#8217;)
 * - Hyphens and dashes (&#x2d;, &mdash;, &ndash;)
 * - Special spaces (&nbsp;, &ensp;, &emsp;)
 * - Common accents (&eacute;, &egrave;, etc.)
 * - Unicode smart quotes (', ', ", ")
 * - Any other Unicode code points
 * 
 * @param {string} str - The string containing HTML entities to decode
 * @returns {string} The decoded string
 */
export function decode(str = "") {
  return str
    // Standard HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    
    // Quotes and apostrophes (both named and numeric)
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&rsquo;?|&lsquo;?/g, "'")
    .replace(/&rdquo;?|&ldquo;?/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&bdquo;|&ldquo;/g, '"')
    
    // Unicode smart quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    
    // Hyphens and dashes
    .replace(/&#x2d;/g, "-")
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&ndash;|&#8211;/g, "–")
    
    // Special spaces
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&ensp;/g, " ")
    .replace(/&emsp;/g, " ")
    
    // Common accents
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&uuml;/g, "ü")
    .replace(/&ntilde;/g, "ñ")
    
    // French characters
    .replace(/&ccedil;/g, "ç")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&acirc;/g, "â")
    .replace(/&ecirc;/g, "ê")
    .replace(/&icirc;/g, "î")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ucirc;/g, "û")
    .replace(/&euml;/g, "ë")
    
    // Any other numeric entities (decimal or hex)
    .replace(/&#(\d+)(?:\s*;)?/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+)(?:\s*;)?/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/**
 * List of common HTML entities we handle.
 * Useful for documentation and testing.
 */
export const COMMON_ENTITIES = {
  // Basic entities
  APOSTROPHE: "&#8217;",
  HYPHEN: "&#x2d;",
  RSQUO: "&rsquo;",
  LSQUO: "&lsquo;",
  RDQUO: "&rdquo;",
  LDQUO: "&ldquo;",
  APOS: "&apos;",
  QUOT: "&quot;",
  AMP: "&amp;",
  LT: "&lt;",
  GT: "&gt;",
  
  // Dashes
  MDASH: "&mdash;",
  NDASH: "&ndash;",
  MDASH_NUM: "&#8212;",
  NDASH_NUM: "&#8211;",
  
  // Special spaces
  NBSP: "&nbsp;",
  NBSP_NUM: "&#160;",
  ENSP: "&ensp;",
  EMSP: "&emsp;",
  
  // Common accents
  EACUTE: "&eacute;",
  EGRAVE: "&egrave;",
  UUML: "&uuml;",
  NTILDE: "&ntilde;",
  
  // French characters
  CCEDIL: "&ccedil;",
  CCEDIL_UP: "&Ccedil;",
  ACIRC: "&acirc;",
  ECIRC: "&ecirc;",
  ICIRC: "&icirc;",
  OCIRC: "&ocirc;",
  UCIRC: "&ucirc;",
  EUML: "&euml;",
  
  // Additional quotes
  BDQUO: "&bdquo;",
  LDQUO_NUM: "&#8220;",
  RDQUO_NUM: "&#8221;"
}; 