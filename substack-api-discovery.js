const https = require('https');
const fs = require('fs');

// Common API endpoint patterns to test
const commonEndpoints = [
  // Authentication
  'auth/login',
  'auth/logout',
  'auth/me',
  'auth/session',
  'auth/verify',
  'auth/refresh',
  
  // User/Profile
  'user',
  'users',
  'profile',
  'profiles',
  'me',
  'account',
  
  // Posts/Content
  'posts',
  'notes',
  'drafts',
  'publish',
  'articles',
  'stories',
  'content',
  
  // Social features
  'comments',
  'likes',
  'shares',
  'follows',
  'followers',
  'following',
  'subscriptions',
  'subscribers',
  
  // Media
  'upload',
  'uploads',
  'media',
  'images',
  'files',
  
  // Analytics
  'stats',
  'analytics',
  'metrics',
  'views',
  
  // Settings
  'settings',
  'preferences',
  'notifications',
  
  // Publications
  'publications',
  'pubs',
  'newsletters',
  
  // Search
  'search',
  'discover',
  'explore',
  
  // Admin
  'admin',
  'moderate',
  'report',
  
  // Specific to Notes (based on your use case)
  'notes/create',
  'notes/publish',
  'notes/draft',
  'notes/list',
  'notes/delete',
  'notes/edit',
  
  // Common REST patterns
  'health',
  'status',
  'version',
  'info'
];

// Function to test an endpoint
function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `https://substack.com/api/v1/${endpoint}`;
    
    const options = {
      hostname: 'substack.com',
      port: 443,
      path: `/api/v1/${endpoint}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = {
          endpoint: endpoint,
          url: url,
          status: res.statusCode,
          headers: res.headers,
          contentType: res.headers['content-type'],
          contentLength: res.headers['content-length'],
          body: data.length > 1000 ? data.substring(0, 1000) + '...' : data,
          exists: res.statusCode !== 404
        };
        
        resolve(result);
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint: endpoint,
        url: url,
        status: 'ERROR',
        error: err.message,
        exists: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint: endpoint,
        url: url,
        status: 'TIMEOUT',
        exists: false
      });
    });

    req.setTimeout(5000);
    req.end();
  });
}

// Function to test endpoints with rate limiting
async function discoverEndpoints() {
  console.log('🔍 Starting Substack API Discovery...');
  console.log(`Testing ${commonEndpoints.length} common endpoints\n`);
  
  const results = [];
  const existingEndpoints = [];
  
  for (let i = 0; i < commonEndpoints.length; i++) {
    const endpoint = commonEndpoints[i];
    
    process.stdout.write(`\r[${i + 1}/${commonEndpoints.length}] Testing: ${endpoint.padEnd(20)}`);
    
    try {
      const result = await testEndpoint(endpoint);
      results.push(result);
      
      if (result.exists && result.status !== 'ERROR' && result.status !== 'TIMEOUT') {
        existingEndpoints.push(result);
        console.log(`\n✅ Found: ${result.endpoint} (${result.status})`);
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`\n❌ Error testing ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\n\n🎯 DISCOVERY COMPLETE!\n');
  
  // Summary
  console.log(`📊 SUMMARY:`);
  console.log(`- Total endpoints tested: ${results.length}`);
  console.log(`- Existing endpoints found: ${existingEndpoints.length}`);
  console.log(`- Success rate: ${((existingEndpoints.length / results.length) * 100).toFixed(1)}%\n`);
  
  // Show existing endpoints
  if (existingEndpoints.length > 0) {
    console.log(`🔗 EXISTING ENDPOINTS:`);
    existingEndpoints.forEach(ep => {
      console.log(`${ep.status.toString().padStart(3)} | ${ep.endpoint.padEnd(25)} | ${ep.contentType || 'unknown'}`);
    });
    console.log('');
  }
  
  // Show interesting responses (non-404, non-error)
  const interestingResponses = results.filter(r => 
    r.exists && 
    r.status !== 404 && 
    r.status !== 'ERROR' && 
    r.status !== 'TIMEOUT' &&
    r.body && 
    r.body.length > 10
  );
  
  if (interestingResponses.length > 0) {
    console.log(`💡 INTERESTING RESPONSES:`);
    interestingResponses.forEach(r => {
      console.log(`\n--- ${r.endpoint} (${r.status}) ---`);
      console.log(`Content-Type: ${r.contentType}`);
      if (r.body.startsWith('{') || r.body.startsWith('[')) {
        try {
          const parsed = JSON.parse(r.body);
          console.log('Response:', JSON.stringify(parsed, null, 2).substring(0, 500));
        } catch (e) {
          console.log('Response:', r.body.substring(0, 200));
        }
      } else {
        console.log('Response:', r.body.substring(0, 200));
      }
    });
  }
  
  // Save full results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `substack-api-discovery-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTested: results.length,
    existingEndpoints: existingEndpoints.length,
    results: results
  }, null, 2));
  
  console.log(`\n💾 Full results saved to: ${filename}`);
  console.log(`\n🚀 Next steps for Notes API:`);
  console.log(`1. Check browser DevTools Network tab when posting a Note`);
  console.log(`2. Look for POST requests to /api/v1/notes/* endpoints`);
  console.log(`3. Examine request headers, especially authentication`);
  console.log(`4. Try the discovered endpoints with proper auth headers`);
}

// Run the discovery
discoverEndpoints().catch(console.error); 