import { handleHealthwatchify } from './api/healthwatchify.js';
import threadsPost from './api/threads-post.js';
import blueskyPost from './api/bluesky-post.js';
import linkedinPost from './api/linkedin-post.js';
import linkedinProfile from './api/linkedin-profile.js';
import linkedinTest from './api/linkedin-test.js';
import linkedinWhoami from './api/linkedin-whoami.js';
import mastodonPost from './api/mastodon-post.js';
import { htmlTemplate } from './templates/html.js';
import { privacyTemplate } from './templates/privacy.js';
import { dataDeletionTemplate } from './templates/data-deletion.js';
import { styles } from './styles/styles.js';
import { clientScript } from './client/script.js';
import { htmlResponse } from './utils/response.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname === '/api/healthwatchify') {
      return handleHealthwatchify(request);
    }

    // Handle Threads posting
    if (url.pathname === '/api/threads-post') {
      return threadsPost.fetch(request, env, ctx);
    }

    // Handle Bluesky posting
    if (url.pathname === '/api/bluesky-post') {
      return blueskyPost.fetch(request, env, ctx);
    }

    // Handle LinkedIn posting
    if (url.pathname === '/api/linkedin-post') {
      return linkedinPost.fetch(request, env, ctx);
    }

    // Handle LinkedIn profile (temporary utility)
    if (url.pathname === '/api/linkedin-profile') {
      return linkedinProfile.fetch(request, env, ctx);
    }

    // Handle LinkedIn test (temporary utility)
    if (url.pathname === '/api/linkedin-test') {
      return linkedinTest.fetch(request, env, ctx);
    }

    // Handle LinkedIn whoami (temporary utility)
    if (url.pathname === '/api/linkedin-whoami') {
      return linkedinWhoami.fetch(request, env, ctx);
    }

    // Handle Mastodon posting
    if (url.pathname === '/api/mastodon-post') {
      return mastodonPost.fetch(request, env, ctx);
    }

    // Handle privacy policy
    if (url.pathname === '/privacy') {
      return new Response(privacyTemplate(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle data deletion instructions
    if (url.pathname === '/data-deletion') {
      return new Response(dataDeletionTemplate(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle image proxy requests
    if (url.pathname === '/api/proxy-image') {
      const imageUrl = url.searchParams.get('url');
      if (!imageUrl) {
        return new Response('No image URL provided', { status: 400 });
      }

      try {
        const response = await fetch(imageUrl);
        const contentType = response.headers.get('content-type');
        
        return new Response(response.body, {
          headers: {
            'Content-Type': contentType || 'image/jpeg',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      } catch (error) {
        return new Response('Failed to fetch image', { status: 500 });
      }
    }
    
    // Serve main page
    return htmlResponse(htmlTemplate({
      styles,
      script: clientScript
    }));
  }
};