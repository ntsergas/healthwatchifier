export default {
  async fetch(request, env) {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Try the userinfo endpoint which might work with different scopes
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      
      return new Response(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        headers: Object.fromEntries(response.headers.entries())
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching LinkedIn userinfo:', error);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
} 