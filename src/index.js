import { handleHealthwatchify } from './api/healthwatchify.js';
import { htmlTemplate } from './templates/html.js';
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
    
    // Serve main page
    return htmlResponse(htmlTemplate({
      styles,
      script: clientScript
    }));
  }
};