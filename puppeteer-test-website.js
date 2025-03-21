const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting test of NIFYA website...');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,  // Set to true for headless mode
    defaultViewport: null,
    args: ['--start-maximized'] 
  });
  console.log('Browser launched');
  
  // Open a new page
  const page = await browser.newPage();
  console.log('Page created');
  
  try {
    // Navigate to website
    console.log('Navigating to website...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded website');
    
    // Take a screenshot of the landing page
    await page.screenshot({ path: 'landing-page.png' });
    console.log('Saved landing page screenshot');
    
    // Get and log console messages
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Get and log network errors
    page.on('requestfailed', request => {
      console.log(`NETWORK ERROR: ${request.url()} failed: ${request.failure().errorText}`);
    });
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/auth', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded login page');
    
    // Take a screenshot of the login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('Saved login page screenshot');
    
    // Fill out login form
    console.log('Filling login form...');
    await page.type('input[type="email"]', 'ratonxi@gmail.com');
    await page.type('input[type="password"]', 'nifyaCorp12!');
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'login-form-filled.png' });
    console.log('Saved filled login form screenshot');
    
    // Click login button
    console.log('Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('Logged in successfully');
    
    // Take a screenshot of the dashboard
    await page.screenshot({ path: 'dashboard.png' });
    console.log('Saved dashboard screenshot');
    
    // Wait for 10 seconds to see the result
    console.log('Waiting 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Close browser
    await browser.close();
    console.log('Test completed');
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take screenshot of error state
    await page.screenshot({ path: 'error-state.png' });
    console.log('Saved error state screenshot');
    
    // Close browser
    await browser.close();
  }
})(); 