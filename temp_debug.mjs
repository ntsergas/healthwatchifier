import { scrapeInfo } from './src/utils/scrapeInfo.js';

// Test the specific Guardian article that has author URL issue
async function testGuardian() {
  const url = 'https://www.theguardian.com/us-news/2025/may/28/rfk-jr-medical-journals';
  
  console.log('🎯 Testing Guardian author extraction fix...');
  console.log('URL:', url);
  
  try {
    const result = await scrapeInfo(url);
    
    console.log('\n=== RESULT ===');
    console.log('Title:', result.headline);
    console.log('Publication:', result.publication);
    console.log('Author:', result.authors[0]);
    console.log('Article Type:', result.articleType);
    
    // Analyze the author result
    console.log('\n=== AUTHOR ANALYSIS ===');
    if (result.authors[0] === 'Joseph Gedeon') {
      console.log('✅ SUCCESS! Got the actual author name');
    } else if (result.authors[0].includes('theguardian.com/profile/')) {
      console.log('❌ STILL GETTING URL instead of name');
      console.log('   Expected: "Joseph Gedeon"');
      console.log('   Got:', result.authors[0]);
    } else {
      console.log('🤔 Unexpected author result:', result.authors[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testGuardian(); 