export default {
  async fetch(request, env) {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Try multiple endpoints to get profile info
      let response = await fetch('https://api.linkedin.com/v2/people/(vanityName:nick-tsergas)', {
        headers: {
          'Authorization': `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LinkedIn API error:', response.status, errorText);
        return new Response(`LinkedIn API error: ${response.status} ${errorText}`, { 
          status: response.status 
        });
      }

      const profile = await response.json();
      
      return new Response(JSON.stringify({
        personId: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        fullProfile: profile
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
} 