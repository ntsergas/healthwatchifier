import { scrapeInfo } from "./src/utils/scrapeInfo.js";

async function testComprehensiveScraping() {
  console.log("Testing comprehensive scraping functionality...");
  console.log("Checking: Title, Outlet, Type, Author, Image");
  console.log("===============================================");
  
  const testUrls = [
    "https://nationalpost.com/health/america-canada-brain-drain",
    "https://edmontonjournal.com/news/politics/alberta-premier-danielle-smith-defends-breaking-up-health-minister-role-into-four-portfolios",
    "https://www.theatlantic.com/science/archive/2025/05/screwworms-outbreak-united-states/682925/",
    "https://www.axios.com/2025/05/27/covid-shots-not-recommended-kids-pregnant-women",
    "https://ottawacitizen.com/news/ottawa-hospital-virtural-critical-care-iqaluit",
    "https://globalnews.ca/news/11197626/quebec-family-physicians-bill-106/",
    "https://www.thestar.com/opinion/letters-to-the-editor/the-problem-with-our-health-care-system-is-the-patient-is-not-part-of-the/article_139bb135-9cce-4cd8-87cc-db9e9bc3a217.html",
    "https://www.healthing.ca/workforce/opinion-outdated-rules-keeping-qualified-mental-health-professionals-on-the-sidelines-in-quebec",
    "https://policyoptions.irpp.org/magazines/may-2025/womens-health-research/",
    "https://vancouversun.com/opinion/op-ed/opinion-lack-of-access-to-primary-care-is-bankrupting-our-health-care-system",
    "https://www.thecanadianpressnews.ca/health/utah-lawmakers-said-gender-affirming-care-is-harmful-to-kids-their-own-study-contradicts-that/article_f6b83fd6-976e-5327-b673-f303dc6178fc.html",
    "https://www.cbc.ca/news/canada/british-columbia/federal-minister-ostriches-1.7546052",
    "https://www.reuters.com/business/healthcare-pharmaceuticals/us-cancels-more-700-million-funding-moderna-bird-flu-vaccine-2025-05-28/",
    "https://www.ctvnews.ca/toronto/article/concerning-new-research-reveals-trend-that-may-be-contributing-to-family-doctor-shortage/",
    "https://www.cbc.ca/news/canada/new-brunswick/nb-doctor-comes-home-from-america-1.7501946",
    "https://www.cidrap.umn.edu/measles/precipice-disaster-measles-may-be-endemic-25-years-if-vaccine-uptake-stays-low-model",
    "https://www.thecanadianpressnews.ca/prairies_bc/alberta/canadian-doctors-group-challenging-constitutionality-of-alberta-transgender-law/article_93c58bef-0bb9-5983-8d3d-436121ba2b2d.html",
    "https://www.thecanadianpressnews.ca/health/will-you-be-able-to-get-a-covid-19-shot-heres-what-we-know-so/article_587d6aa3-9a48-5038-b3fc-7882dce176cb.html",
    "https://www.thecanadianpressnews.ca/health/covid-vaccine-strongly-recommended-during-pregnancy-canadian-doctors-say/article_d1e420df-28ad-5e84-b52f-3a16b21edd11.html",
    "https://www.thecanadianpressnews.ca/health/trump-administration-cancels-766-million-moderna-contract-to-fight-pandemic-flu/article_2dc16a2e-61ea-5580-86b6-8367d0803695.html",
    "https://www.thecanadianpressnews.ca/health/",
    "https://kffhealthnews.org/news/article/trump-team-cited-safety-limiting-covid-shots-patients-health-advocates-see-more-risk/",
    "https://www.theglobeandmail.com/opinion/article-the-maga-movements-child-health-manifesto-is-a-muddle/",
    "https://vancouversun.com/news/canada/canadian-measles-seattle/wcm/851748a9-d947-4a68-a0c1-e61bf14e54d3",
    "https://medicalxpress.com/news/2025-05-covid-virus-reprograms-infection-fighters.html#google_vignette",
    "https://www.independent.co.uk/bulletin/news/nb181-covid-variant-symptoms-b2759357.html",
    "https://ici.radio-canada.ca/nouvelle/2167680/pharmaciens-probleme-agences-privees",
    "https://thetyee.ca/News/2025/05/29/BC-Measles-Vaccination-Schools/",
    "https://healthydebate.ca/2025/05/topic/this-will-make-you-a-better-doctor/"
  ];
  
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`\n[${i + 1}/${testUrls.length}] Testing: ${url}`);
    
    try {
      const result = await scrapeInfo(url);
      
      const hasTitle = result.headline && result.headline !== "(untitled)" && result.headline.length > 5;
      const hasOutlet = result.publication && result.publication !== "Unknown";
      const hasType = result.articleType && (result.articleType === "news" || result.articleType === "opinion");
      const hasAuthor = result.authors && result.authors.length > 0 && result.authors[0] !== "TKTKTK";
      const hasImage = result.image && result.image.length > 10;
      
      console.log(`   TITLE:  ${hasTitle ? '✓' : '✗'} ${result.headline || 'MISSING'}`);
      console.log(`   OUTLET: ${hasOutlet ? '✓' : '✗'} ${result.publication || 'MISSING'}`);
      console.log(`   TYPE:   ${hasType ? '✓' : '✗'} ${result.articleType || 'MISSING'}`);
      console.log(`   AUTHOR: ${hasAuthor ? '✓' : '✗'} ${result.authors ? result.authors.join(', ') : 'MISSING'}`);
      console.log(`   IMAGE:  ${hasImage ? '✓' : '✗'} ${hasImage ? 'FOUND' : 'MISSING'}`);
      
      const score = [hasTitle, hasOutlet, hasType, hasAuthor, hasImage].filter(Boolean).length;
      console.log(`   SCORE:  ${score}/5`);
      
      results.push({
        url,
        success: true,
        score,
        title: hasTitle,
        outlet: hasOutlet,
        type: hasType,
        author: hasAuthor,
        image: hasImage
      });
      
      successCount++;
      
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
      results.push({ url, success: false, error: error.message });
      failCount++;
    }
    
    // Be polite with requests - small delay between each
    if (i < testUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  // Summary Report
  console.log("\n" + "=".repeat(60));
  console.log("COMPREHENSIVE SCRAPING TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total URLs tested: ${testUrls.length}`);
  console.log(`Successful scrapes: ${successCount}`);
  console.log(`Failed scrapes: ${failCount}`);
  console.log(`Success rate: ${((successCount / testUrls.length) * 100).toFixed(1)}%`);
  
  if (successCount > 0) {
    const successfulResults = results.filter(r => r.success);
    const titleSuccess = successfulResults.filter(r => r.title).length;
    const outletSuccess = successfulResults.filter(r => r.outlet).length;
    const typeSuccess = successfulResults.filter(r => r.type).length;
    const authorSuccess = successfulResults.filter(r => r.author).length;
    const imageSuccess = successfulResults.filter(r => r.image).length;
    
    console.log("\nField Success Rates:");
    console.log(`   Title:  ${titleSuccess}/${successCount} (${((titleSuccess / successCount) * 100).toFixed(1)}%)`);
    console.log(`   Outlet: ${outletSuccess}/${successCount} (${((outletSuccess / successCount) * 100).toFixed(1)}%)`);
    console.log(`   Type:   ${typeSuccess}/${successCount} (${((typeSuccess / successCount) * 100).toFixed(1)}%)`);
    console.log(`   Author: ${authorSuccess}/${successCount} (${((authorSuccess / successCount) * 100).toFixed(1)}%)`);
    console.log(`   Image:  ${imageSuccess}/${successCount} (${((imageSuccess / successCount) * 100).toFixed(1)}%)`);
    
    const avgScore = successfulResults.reduce((sum, r) => sum + r.score, 0) / successfulResults.length;
    console.log(`\nAverage score: ${avgScore.toFixed(1)}/5`);
  }
  
  if (failCount > 0) {
    console.log("\nFailed URLs:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.url}: ${r.error}`);
    });
  }
  
  return results;
}

async function testSharonKirkeyAuthor() {
  console.log("Testing Sharon Kirkey author detection...");
  console.log("===========================================");
  
  const testUrl = "https://nationalpost.com/health/america-canada-brain-drain";
  
  try {
    console.log(`Testing: ${testUrl}`);
    const result = await scrapeInfo(testUrl);
    
    console.log("\nResults:");
    console.log(`   TITLE:  ${result.headline || 'MISSING'}`);
    console.log(`   OUTLET: ${result.publication || 'MISSING'}`);
    console.log(`   TYPE:   ${result.articleType || 'MISSING'}`);
    console.log(`   AUTHOR: ${result.authors ? result.authors.join(', ') : 'MISSING'}`);
    console.log(`   IMAGE:  ${result.image ? 'FOUND' : 'MISSING'}`);
    
    const hasAuthor = result.authors && result.authors.length > 0 && result.authors[0] !== "TKTKTK";
    
    if (hasAuthor && result.authors[0].includes('Sharon Kirkey')) {
      console.log("\n✅ SUCCESS: Sharon Kirkey detected correctly!");
    } else {
      console.log("\n❌ ISSUE: Sharon Kirkey not detected properly");
      console.log(`   Expected: Sharon Kirkey`);
      console.log(`   Got: ${result.authors ? result.authors.join(', ') : 'NOTHING'}`);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

async function testAssociatedPressAttribution() {
  console.log("Testing Associated Press attribution fix...");
  console.log("=============================================");
  
  const testUrl = "https://www.thecanadianpressnews.ca/health/will-you-be-able-to-get-a-covid-19-shot-heres-what-we-know-so/article_587d6aa3-9a48-5038-b3fc-7882dce176cb.html";
  
  try {
    console.log(`Testing: ${testUrl}`);
    const result = await scrapeInfo(testUrl);
    
    console.log("\nResults:");
    console.log(`   TITLE:  ${result.headline || 'MISSING'}`);
    console.log(`   OUTLET: ${result.publication || 'MISSING'}`);
    console.log(`   TYPE:   ${result.articleType || 'MISSING'}`);
    console.log(`   AUTHOR: ${result.authors ? result.authors.join(', ') : 'MISSING'}`);
    console.log(`   IMAGE:  ${result.image ? 'FOUND' : 'MISSING'}`);
    
    // Check if the outlet was correctly switched to Associated Press
    if (result.publication === "Associated Press") {
      console.log("\n✅ SUCCESS: Outlet correctly attributed to Associated Press!");
      console.log("   This article had 'The Associated Press' in the byline and was properly detected.");
    } else if (result.publication === "The Canadian Press") {
      console.log("\n❌ ISSUE: Still showing as 'The Canadian Press' instead of 'Associated Press'");
      console.log("   Expected: Associated Press");
      console.log("   Got: The Canadian Press");
      console.log("   Authors:", result.authors);
    } else {
      console.log(`\n⚠️  UNEXPECTED: Got publication '${result.publication}'`);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

// 🎯 TEST NEW BROWSER HEADERS UTILITY
function testBrowserHeaders() {
  console.log('\n🎯 Testing Browser Headers Utility...');
  
  try {
    const { generateBrowserHeaders, getSiteOptimizedHeaders, validateHeaders } = require('./src/utils/browserHeaders.js');
    
    // Test basic Opera header generation
    const operaHeaders = generateBrowserHeaders({ 
      url: 'https://www.nytimes.com/article',
      profile: 'opera_110_windows' 
    });
    
    console.log('✅ Generated Opera headers:');
    console.log('User-Agent:', operaHeaders['User-Agent']);
    console.log('Sec-CH-UA:', operaHeaders['Sec-CH-UA']);
    console.log('Referer:', operaHeaders['Referer']);
    
    // Test site-optimized headers for Postmedia
    const postmediaHeaders = getSiteOptimizedHeaders('https://nationalpost.com/news/article');
    console.log('\n✅ Postmedia-optimized headers:');
    console.log('Sec-Fetch-Site:', postmediaHeaders['Sec-Fetch-Site']);
    console.log('Referer:', postmediaHeaders['Referer']);
    
    // Validate headers
    const validation = validateHeaders(operaHeaders);
    console.log('\n✅ Header validation:');
    console.log('Valid:', validation.valid);
    console.log('Score:', validation.score);
    if (validation.warnings.length > 0) {
      console.log('Warnings:', validation.warnings);
    }
    
    // Test that we have all required headers
    const requiredHeaders = ['User-Agent', 'Accept', 'Accept-Language', 'Accept-Encoding', 'Sec-Fetch-Site'];
    const missing = requiredHeaders.filter(h => !operaHeaders[h]);
    
    if (missing.length === 0) {
      console.log('✅ All required headers present');
    } else {
      console.log('❌ Missing headers:', missing);
    }
    
    // Test that Opera UA includes OPR/
    if (operaHeaders['User-Agent'].includes('OPR/110')) {
      console.log('✅ Opera User-Agent correctly formatted');
    } else {
      console.log('❌ Opera User-Agent missing OPR/ identifier');
    }
    
    // Test that Client Hints match Opera
    if (operaHeaders['Sec-CH-UA']?.includes('Opera')) {
      console.log('✅ Client Hints correctly identify Opera');
    } else {
      console.log('❌ Client Hints missing Opera brand');
    }
    
    console.log('✅ Browser Headers utility test completed');
    
  } catch (error) {
    console.error('❌ Browser Headers test failed:', error.message);
  }
}

testComprehensiveScraping();
testSharonKirkeyAuthor();
testAssociatedPressAttribution();
testBrowserHeaders(); 