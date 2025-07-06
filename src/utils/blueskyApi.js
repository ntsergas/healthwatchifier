import { logger } from './logger.js';

const blueskyLogger = logger.child('BLUESKY');

export class BlueskyAPI {
  constructor() {
    this.baseUrl = 'https://bsky.social/xrpc';
    this.accessToken = null;
    this.did = null;
  }

  /**
   * Authenticate with Bluesky using handle and app password
   */
  async authenticate(handle, appPassword) {
    try {
      blueskyLogger.info('Authenticating with Bluesky', { handle });

      const response = await fetch(`${this.baseUrl}/com.atproto.server.createSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: handle,
          password: appPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Authentication failed: ${error.message || response.statusText}`);
      }

      const session = await response.json();
      this.accessToken = session.accessJwt;
      this.did = session.did;

      blueskyLogger.info('Successfully authenticated with Bluesky', { 
        handle: session.handle,
        did: session.did 
      });

      return {
        success: true,
        handle: session.handle,
        did: session.did
      };
    } catch (error) {
      blueskyLogger.error('Bluesky authentication failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get image dimensions from buffer
   */
  getImageDimensions(imageBuffer) {
    try {
      // Simple PNG detection
      if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
        const width = (imageBuffer[16] << 24) | (imageBuffer[17] << 16) | (imageBuffer[18] << 8) | imageBuffer[19];
        const height = (imageBuffer[20] << 24) | (imageBuffer[21] << 16) | (imageBuffer[22] << 8) | imageBuffer[23];
        return { width, height };
      }
      
      // Simple JPEG detection (look for SOF marker)
      for (let i = 0; i < imageBuffer.length - 10; i++) {
        if (imageBuffer[i] === 0xFF && (imageBuffer[i + 1] === 0xC0 || imageBuffer[i + 1] === 0xC2)) {
          const height = (imageBuffer[i + 5] << 8) | imageBuffer[i + 6];
          const width = (imageBuffer[i + 7] << 8) | imageBuffer[i + 8];
          return { width, height };
        }
      }
      
      // Default fallback
      return { width: 800, height: 600 };
    } catch (error) {
      blueskyLogger.warn('Could not determine image dimensions', { error: error.message });
      return { width: 800, height: 600 };
    }
  }

  /**
   * Resolve a Bluesky handle to its DID (Decentralized Identifier)
   */
  async resolveHandle(handle) {
    try {
      // Remove @ prefix if present
      const cleanHandle = handle.replace(/^@/, '');
      
      const response = await fetch(`${this.baseUrl}/com.atproto.identity.resolveHandle?handle=${cleanHandle}`);
      
      if (!response.ok) {
        blueskyLogger.warn('Failed to resolve handle', { handle: cleanHandle, status: response.status });
        return null;
      }
      
      const result = await response.json();
      blueskyLogger.debug('Resolved handle to DID', { handle: cleanHandle, did: result.did });
      return result.did;
    } catch (error) {
      blueskyLogger.warn('Error resolving handle', { handle, error: error.message });
      return null;
    }
  }

  /**
   * Parse URLs and mentions in text and create facets for clickable links
   */
  async parseTextFacets(text) {
    const facets = [];
    
    // First, find full URLs (http/https)
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0];
      const startIndex = match.index;
      
      // Convert character positions to byte positions
      const beforeText = text.substring(0, startIndex);
      const beforeBytes = new TextEncoder().encode(beforeText);
      const urlBytes = new TextEncoder().encode(url);
      
      facets.push({
        index: {
          byteStart: beforeBytes.length,
          byteEnd: beforeBytes.length + urlBytes.length
        },
        features: [{
          $type: 'app.bsky.richtext.facet#link',
          uri: url
        }]
      });
    }
    
    // Then, find domain names without protocol (like "canadahealthwatch.ca")
    // Reset regex lastIndex for domain search
    const domainRegex = /(?<!https?:\/\/)(?<!www\.)([a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]\.)+[a-zA-Z]{2,}(?![a-zA-Z0-9\-])/g;
    
    while ((match = domainRegex.exec(text)) !== null) {
      const domain = match[0];
      const startIndex = match.index;
      
      // Skip if this domain is part of a full URL we already processed
      let isPartOfUrl = false;
      for (const existingFacet of facets) {
        const existingStart = existingFacet.index.byteStart;
        const existingEnd = existingFacet.index.byteEnd;
        const domainStart = new TextEncoder().encode(text.substring(0, startIndex)).length;
        const domainEnd = domainStart + new TextEncoder().encode(domain).length;
        
        if (domainStart >= existingStart && domainEnd <= existingEnd) {
          isPartOfUrl = true;
          break;
        }
      }
      
      if (!isPartOfUrl) {
        // Convert character positions to byte positions
        const beforeText = text.substring(0, startIndex);
        const beforeBytes = new TextEncoder().encode(beforeText);
        const domainBytes = new TextEncoder().encode(domain);
        
        facets.push({
          index: {
            byteStart: beforeBytes.length,
            byteEnd: beforeBytes.length + domainBytes.length
          },
          features: [{
            $type: 'app.bsky.richtext.facet#link',
            uri: `https://${domain}`
          }]
        });
      }
    }
    
    // Finally, find @mentions (like @hannay.bsky.social)
    const mentionRegex = /@([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?/g;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mention = match[0];
      const handle = mention.substring(1); // Remove @ prefix
      const startIndex = match.index;
      
      // Resolve handle to DID
      const did = await this.resolveHandle(handle);
      
      if (did) {
        // Convert character positions to byte positions
        const beforeText = text.substring(0, startIndex);
        const beforeBytes = new TextEncoder().encode(beforeText);
        const mentionBytes = new TextEncoder().encode(mention);
        
        facets.push({
          index: {
            byteStart: beforeBytes.length,
            byteEnd: beforeBytes.length + mentionBytes.length
          },
          features: [{
            $type: 'app.bsky.richtext.facet#mention',
            did: did
          }]
        });
        
        blueskyLogger.info('Added mention facet', { handle, did, mention });
      } else {
        blueskyLogger.warn('Could not resolve mention, skipping', { mention });
      }
    }
    
    // Sort facets by position to ensure proper order
    facets.sort((a, b) => a.index.byteStart - b.index.byteStart);
    
    return facets;
  }

  /**
   * Parse data URL if needed
   */
  parseDataUrl(dataUrl) {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
      throw new Error('Invalid data URL format');
    }
    const base64Data = parts[1];
    const mimeType = parts[0].match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    return {
      buffer: Buffer.from(base64Data, 'base64'),
      mimeType: mimeType
    };
  }

  /**
   * Check if image size exceeds Bluesky's limit and provide helpful error
   */
  checkImageSize(buffer) {
    const MAX_SIZE = 1000000; // 1MB
    if (buffer.length > MAX_SIZE) {
      const sizeMB = (buffer.length / 1000000).toFixed(2);
      throw new Error(`Image size ${sizeMB}MB exceeds Bluesky's 1MB limit. Please use a smaller image or compress it.`);
    }
    return buffer;
  }

  /**
   * Upload image to Bluesky blob storage
   */
  async uploadImage(imageBuffer, mimeType = 'image/jpeg') {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      blueskyLogger.info('Uploading image to Bluesky', { size: imageBuffer.length });

      const response = await fetch(`${this.baseUrl}/com.atproto.repo.uploadBlob`, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: imageBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's a size limit error
        if (errorText.includes('too large') || errorText.includes('size') || response.status === 413) {
          const sizeMB = (imageBuffer.length / 1000000).toFixed(2);
          throw new Error(`Image upload failed: Image size ${sizeMB}MB exceeds Bluesky's 1MB limit. Please use a smaller image.`);
        }
        
        throw new Error(`Image upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      blueskyLogger.info('Image uploaded successfully', { 
        ref: result.blob.ref,
        size: result.blob.size 
      });

      return result.blob;
    } catch (error) {
      blueskyLogger.error('Error uploading image', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a text-only post
   */
  async createTextPost(text) {
    try {
      if (!this.accessToken || !this.did) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      blueskyLogger.info('Creating text post', { textLength: text.length });

      // Parse URLs and mentions for clickable links
      const facets = await this.parseTextFacets(text);

      const post = {
        $type: 'app.bsky.feed.post',
        text: text,
        createdAt: new Date().toISOString()
      };

      // Add facets if any URLs or mentions were found
      if (facets.length > 0) {
        post.facets = facets;
        blueskyLogger.info('Added facets to post', { facetCount: facets.length });
      }

      const response = await fetch(`${this.baseUrl}/com.atproto.repo.createRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          repo: this.did,
          collection: 'app.bsky.feed.post',
          record: post
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Post creation failed: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      blueskyLogger.info('Text post created successfully', { uri: result.uri });

      return {
        success: true,
        uri: result.uri,
        cid: result.cid
      };
    } catch (error) {
      blueskyLogger.error('Error creating text post', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a post with text and image
   */
  async createImagePost(text, imageBuffer, altText = '', mimeType = 'image/jpeg') {
    try {
      if (!this.accessToken || !this.did) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      blueskyLogger.info('Creating image post', { 
        textLength: text.length,
        imageSize: imageBuffer.length 
      });

      // First upload the image
      const imageBlob = await this.uploadImage(imageBuffer, mimeType);

      // Get image dimensions for proper aspect ratio
      const dimensions = this.getImageDimensions(imageBuffer);
      blueskyLogger.info('Image dimensions detected', dimensions);

      // Parse URLs and mentions for clickable links
      const facets = await this.parseTextFacets(text);

      // Create post with image embed
      const post = {
        $type: 'app.bsky.feed.post',
        text: text,
        embed: {
          $type: 'app.bsky.embed.images',
          images: [{
            alt: altText,
            image: imageBlob,
            aspectRatio: {
              width: dimensions.width,
              height: dimensions.height
            }
          }]
        },
        createdAt: new Date().toISOString()
      };

      // Add facets if any URLs or mentions were found
      if (facets.length > 0) {
        post.facets = facets;
        blueskyLogger.info('Added facets to image post', { facetCount: facets.length });
      }

      const response = await fetch(`${this.baseUrl}/com.atproto.repo.createRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          repo: this.did,
          collection: 'app.bsky.feed.post',
          record: post
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Image post creation failed: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      blueskyLogger.info('Image post created successfully', { uri: result.uri });

      return {
        success: true,
        uri: result.uri,
        cid: result.cid
      };
    } catch (error) {
      blueskyLogger.error('Error creating image post', { error: error.message });
      throw error;
    }
  }

  /**
   * Main posting method - handles both text and image posts
   */
  async postToBluesky(handle, appPassword, text, imageUrl = null, altText = '') {
    try {
      // Authenticate first
      await this.authenticate(handle, appPassword);

      // If no image, create text-only post
      if (!imageUrl) {
        return await this.createTextPost(text);
      }

      blueskyLogger.info('Processing image for post', { 
        imageUrl: imageUrl.substring(0, 50) + '...',
        isDataUrl: imageUrl.startsWith('data:')
      });

      let imageBuffer, mimeType;

      if (imageUrl.startsWith('data:')) {
        // Handle data URL (from clipboard/manual upload)
        const parsed = this.parseDataUrl(imageUrl);
        imageBuffer = parsed.buffer;
        mimeType = parsed.mimeType;
        blueskyLogger.info('Parsed data URL', { mimeType, size: imageBuffer.length });
      } else {
        // Handle regular URL (from scraped content)
        blueskyLogger.info('Fetching image from URL', { imageUrl });
      
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

        imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
        mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      }

              // Check image size and throw helpful error if too large
        this.checkImageSize(imageBuffer);

        return await this.createImagePost(text, imageBuffer, altText, mimeType);

    } catch (error) {
      blueskyLogger.error('Error posting to Bluesky', { error: error.message });
      throw error;
    }
  }
} 