export default {
  async fetch(request, env) {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Get profile info to get the correct sub ID
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const profileData = await profileResponse.json();

      // If we can't access profile, return that error
      if (!profileResponse.ok) {
        return new Response(JSON.stringify({
          error: 'Profile access failed',
          status: profileResponse.status,
          response: profileData
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' },
          status: profileResponse.status
        });
      }

      // Use the sub ID from the profile response
      const personId = profileData.sub;

      // Try posting using the UGC endpoint
      const testPost = {
        author: `urn:li:person:${personId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: "Test post from Healthwatchifier - please ignore"
            },
            shareMediaCategory: "NONE"
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      };

      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202505',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(testPost)
      });

      const postData = await postResponse.text();
      
      return new Response(JSON.stringify({
        profileStatus: profileResponse.status,
        profileData: profileData,
        postStatus: postResponse.status,
        postData: postData,
        headers: Object.fromEntries(postResponse.headers.entries())
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error testing LinkedIn API:', error);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
} 