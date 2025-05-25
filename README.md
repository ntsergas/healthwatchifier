# Healthwatch-ifier

A Cloudflare Workers application that helps format health news articles for social media sharing. Built with modern web technologies and deployed on Cloudflare's edge network.

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
  - Article image (as PNG)
- 💫 Smooth animations and loading states
- 📱 Responsive design for all devices

## Supported News Sources

- CBC News
- Global News
- CTV News
- National Post
- Montreal Gazette
- Ottawa Citizen
- Vancouver Sun
- Toronto Star
- Globe and Mail
- Other Postmedia sites

## Project Structure

```
src/
  ├── index.js              # Main Worker entry point
  ├── templates/
  │   └── html.js          # HTML template
  ├── styles/
  │   └── styles.js        # CSS styles
  ├── client/
  │   └── script.js        # Client-side JavaScript
  ├── api/
  │   └── healthwatchify.js # API route handler
  ├── utils/
  │   ├── scrapeInfo.js    # Article scraping logic
  │   ├── constants.js     # Shared constants
  │   └── response.js      # Response helpers
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

### API Endpoints

- `/api/healthwatchify`: Main article processing endpoint
- `/api/proxy-image`: CORS-enabled image proxy with caching

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   wrangler dev
   ```

3. Visit `http://localhost:8787` in your browser

## Deployment

Deploy to Cloudflare Workers:
```bash
wrangler deploy
```

## Technologies

- Cloudflare Workers
- Modern JavaScript (ES6+)
- GSAP for animations
- Wrangler CLI for development and deployment

## License

MIT License - feel free to use and modify as needed. 