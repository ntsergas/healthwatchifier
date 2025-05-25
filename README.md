# Healthwatch-ifier

A Cloudflare Workers application that helps format health news articles for social media sharing. Built with modern web technologies and deployed on Cloudflare's edge network.

## Features

- 🔍 Scrapes article information from major Canadian news sources
- 📝 Extracts headlines and cleans up URLs
- 🖼️ Retrieves article preview images
- 📋 One-click copying of formatted content
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