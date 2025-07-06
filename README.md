# Healthwatch-ifier

A Cloudflare Workers web app that parses and re-formats news articles for frictionless social media sharing, with integrated RSS feed generation.

## Features

- 🔍 Scrapes article information from major Canadian news sources
- 📝 Extracts headlines and cleans up URLs
- 🖼️ Retrieves high-quality article preview images with:
  - Resolution optimization for each news source
  - Secure CORS-enabled image proxy
  - Reliable PNG conversion for clipboard compatibility
- 📋 One-click sequential copying of:
  - Formatted article text
  - Article title
  - Original URL
  - Article image (as PNG or data link)
- 📰 Automated RSS feed generation
- 🔄 Multi-platform sharing support:
  - Bluesky
  - Mastodon
  - Craft CMS

## Unsupported News Sources (known, due to *aggressive* bot-detection)

- New York Times
- Reuters

## Project Structure

The project consists of two Cloudflare Workers:

### Main Worker (healthwatchifier)

```
src/
  ├── index.js              # Main Worker entry point
  ├── templates/
  │   ├── html.js          # HTML template
  │   ├── privacy.js       # Privacy policy
  │   └── data-deletion.js # Data deletion policy
  ├── styles/
  │   └── styles.js        # CSS styles
  ├── client/
  │   └── script.js        # Client-side JavaScript
  ├── api/
  │   ├── healthwatchify.js # Main article processing
  │   ├── bluesky-post.js   # Bluesky integration
  │   ├── mastodon-post.js  # Mastodon integration
  │   └── craft-post.js     # Craft CMS integration
  └── utils/
      ├── scrapeInfo.js     # Article scraping logic
      ├── constants.js      # Shared constants
      ├── response.js       # Response helpers
      ├── blueskyApi.js     # Bluesky API client
      ├── mastodonApi.js    # Mastodon API client
      ├── craftApi.js       # Craft CMS API client
      ├── htmlEntities.js   # HTML entity handling
      ├── imageCaptions.js  # Image caption extraction
      └── browserHeaders.js # Browser header management
```

### RSS Worker (linkedin-feed-worker)

```
linkedin-feed-worker/
  ├── index.js           # RSS Worker entry point
  ├── api/
  │   └── linkedin-rss.js # RSS feed management
  └── utils/
      ├── rssGenerator.js # RSS feed generation
      └── logger.js      # Logging utility
```

## Technical Details

### Image Processing

The application handles image processing in several stages:

1. **Scraping**: Extracts the highest quality image URL available from the article
2. **Optimization**: Adjusts image parameters (resolution, quality) based on the news source
3. **Proxy**: Routes image requests through a CORS-enabled Cloudflare Worker endpoint
4. **Client-side**: 
   - Loads images through the proxy for cross-origin compatibility
   - Uses canvas for reliable PNG conversion
   - Implements sequential copying with visual feedback

### RSS Feed

The RSS feed is managed by a dedicated worker for improved reliability and separation of concerns:
- Maintains a rolling list of the latest articles
- Includes article titles, links, and preview images

### API Endpoints

Main Worker:
- `/api/healthwatchify`: Main article processing endpoint
- `/api/proxy-image`: CORS-enabled image proxy with caching
- `/api/bluesky`: Bluesky post creation
- `/api/mastodon`: Mastodon post creation
- `/api/craft`: Craft CMS integration

RSS Worker:
- `/`: Serves the RSS feed
- `/feed`: Alternative RSS feed endpoint

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development servers:
   ```bash
   # Main worker
   npx wrangler dev
   
   # RSS worker
   cd linkedin-feed-worker
   npx wrangler dev
   ```

3. Visit `http://localhost:8787` in your browser

## Code Quality

The project uses several tools to maintain code quality:
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- lint-staged for pre-commit checks

## Deployment

Deploy both workers to Cloudflare:
```bash
# Main worker
wrangler deploy

# RSS worker
cd linkedin-feed-worker
wrangler deploy
```

## Technologies

- Cloudflare Workers
- Modern JavaScript (ES6+)
- GSAP for animations
- Wrangler CLI for development and deployment
- Cloudflare KV for RSS feed storage