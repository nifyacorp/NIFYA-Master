const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Starting subscription debugging test...');
  
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
  
  // Enable detailed network monitoring
  await page.setRequestInterception(true);
  
  // Store API requests and responses
  const apiRequests = {};
  const apiResponses = {};
  
  // Track request headers
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/v1/')) {
      apiRequests[url] = {
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      };
      console.log(`[API Request] ${request.method()} ${url}`);
    }
    request.continue();
  });
  
  // Track response data
  page.on('response', async response => {
    const url = response.url();
    
    // Only capture API responses
    if (url.includes('/api/v1/')) {
      try {
        const data = await response.json();
        apiResponses[url] = {
          status: response.status(),
          headers: response.headers(),
          data: data
        };
        console.log(`[API Response] ${url} (${response.status()})`);
      } catch (e) {
        console.log(`[API Response] Failed to parse ${url}: ${e.message}`);
      }
    }
  });
  
  // Set up console log capturing
  const browserLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    
    // Log the message to our terminal
    console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`);
    
    // Save it to our log array
    browserLogs.push(logEntry);
  });

  try {
    // Step 1: Login
    console.log('Logging in...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/auth', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await page.type('input[type="email"]', 'ratonxi@gmail.com');
    await page.type('input[type="password"]', 'nifyaCorp12!');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('Logged in successfully');
    
    // Step 2: Check dashboard first to see subscription stats
    console.log('Navigating to dashboard to check subscription stats...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Dashboard loaded');
    
    // Wait to ensure all data is loaded
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'dashboard-debug.png' });
    
    // Extract subscription count from dashboard
    const dashboardStats = await page.evaluate(() => {
      // Target the subscription count element (the number inside the subscription card)
      const statsElements = Array.from(document.querySelectorAll('.text-3xl.font-bold'));
      
      // Return all stats found
      return statsElements.map(el => ({
        text: el.textContent,
        html: el.parentElement ? el.parentElement.innerHTML : 'No parent'
      }));
    });
    
    console.log('Dashboard subscription stats:', JSON.stringify(dashboardStats, null, 2));
    
    // Step 3: Get dashboard API responses for subscriptions
    const dashboardSubscriptionResponses = Object.entries(apiResponses)
      .filter(([url]) => url.includes('/subscriptions') && !url.includes('/stats'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    
    console.log('Dashboard subscription API responses:', 
      Object.keys(dashboardSubscriptionResponses).length > 0 
        ? 'Found responses' 
        : 'No subscription API responses captured'
    );
    
    // Save dashboard API responses
    fs.writeFileSync('dashboard-subscription-responses.json', 
      JSON.stringify(dashboardSubscriptionResponses, null, 2)
    );
    
    // Step 4: Now navigate to subscriptions page and check for data
    console.log('Navigating to subscriptions page...');
    
    // Clear previous API responses before navigating
    Object.keys(apiResponses).forEach(key => delete apiResponses[key]);
    
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Subscriptions page loaded');
    
    // Wait to ensure all data is loaded
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot of subscriptions page
    await page.screenshot({ path: 'subscriptions-page-debug.png' });
    
    // Check for subscription cards
    const subscriptionCards = await page.$$('.card');
    console.log(`Found ${subscriptionCards.length} subscription cards on the subscriptions page`);
    
    // Check for empty state message
    const emptyStateElement = await page.evaluate(() => {
      const emptyEl = document.querySelector('h3.text-xl.font-semibold');
      return emptyEl ? { text: emptyEl.textContent, visible: true } : null;
    });
    
    if (emptyStateElement) {
      console.log('Empty state found:', emptyStateElement);
    }
    
    // Extract API response data for subscriptions page
    const subscriptionsPageResponses = Object.entries(apiResponses)
      .filter(([url]) => url.includes('/subscriptions'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    
    console.log('Subscriptions page API responses:', 
      Object.keys(subscriptionsPageResponses).length > 0 
        ? 'Found responses' 
        : 'No subscription API responses captured'
    );
    
    // Save subscriptions page API responses
    fs.writeFileSync('subscriptions-page-responses.json', 
      JSON.stringify(subscriptionsPageResponses, null, 2)
    );
    
    // Step 5: Try reloading the subscriptions page to see if it fixes the issue
    console.log('Reloading subscriptions page to check for data refresh issues...');
    
    // Clear previous API responses before reloading
    Object.keys(apiResponses).forEach(key => delete apiResponses[key]);
    
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('Subscriptions page reloaded');
    
    // Wait to ensure all data is loaded
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot after reload
    await page.screenshot({ path: 'subscriptions-page-after-reload-debug.png' });
    
    // Check for subscription cards after reload
    const subscriptionCardsAfterReload = await page.$$('.card');
    console.log(`Found ${subscriptionCardsAfterReload.length} subscription cards after reload`);
    
    // Extract the data from the Subscriptions component logs
    const subscriptionComponentLogs = browserLogs.filter(log => 
      log.text.includes('Subscriptions component mounted/updated') || 
      log.text.includes('Subscriptions data:') ||
      log.text.includes('Subscriptions loading:') ||
      log.text.includes('Subscriptions error:')
    );
    
    // Save subscriptions component logs
    fs.writeFileSync('subscription-component-logs.json', 
      JSON.stringify(subscriptionComponentLogs, null, 2)
    );
    
    console.log('Extracted subscription component logs:', 
      subscriptionComponentLogs.length > 0 ? 'Found logs' : 'No component logs found'
    );
    
    // Step 6: Try direct API call approach
    console.log('Testing direct API call in browser console...');
    
    // Execute client-side API call to check response directly
    const directApiCallResult = await page.evaluate(async () => {
      try {
        // Attempt to fetch subscriptions directly
        const response = await fetch('/api/v1/subscriptions', {
          headers: {
            'Authorization': localStorage.getItem('auth_token'),
            'X-User-ID': localStorage.getItem('user_id')
          }
        });
        
        const data = await response.json();
        return {
          status: response.status,
          data: data,
          success: true
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('Direct API call result:', JSON.stringify(directApiCallResult, null, 2));
    
    // Write direct API call result to file
    fs.writeFileSync('direct-api-call-result.json', 
      JSON.stringify(directApiCallResult, null, 2)
    );
    
    // Write all browser logs to a file
    fs.writeFileSync('browser-console-logs.json', JSON.stringify(browserLogs, null, 2));
    console.log('Browser console logs saved to browser-console-logs.json');
    
    // Write all API responses to a file
    fs.writeFileSync('all-api-responses.json', JSON.stringify(apiResponses, null, 2));
    console.log('All API responses saved to all-api-responses.json');
    
    // Wait a bit before closing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Final summary
    console.log('Debugging test completed');
    console.log(`Dashboard showed subscription cards: ${dashboardStats.length > 0 ? 'YES' : 'NO'}`);
    console.log(`Subscriptions page showed cards: ${subscriptionCards.length > 0 ? 'YES' : 'NO'}`);
    console.log(`Subscriptions page showed cards after reload: ${subscriptionCardsAfterReload.length > 0 ? 'YES' : 'NO'}`);
    console.log(`Direct API call successful: ${directApiCallResult.success ? 'YES' : 'NO'}`);
    console.log(`Direct API call returned subscriptions: ${directApiCallResult.success && directApiCallResult.data?.data?.subscriptions?.length > 0 ? 'YES' : 'NO'}`);
    
    // Close browser
    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take screenshot of error state
    await page.screenshot({ path: 'error-state-debug.png' });
    console.log('Saved error state screenshot');
    
    // Write all browser logs to a file
    fs.writeFileSync('browser-console-logs.json', JSON.stringify(browserLogs, null, 2));
    console.log('Browser console logs saved to browser-console-logs.json');
    
    // Write all API responses to a file
    fs.writeFileSync('all-api-responses.json', JSON.stringify(apiResponses, null, 2));
    console.log('All API responses saved to all-api-responses.json');
    
    // Close browser
    await browser.close();
  }
})(); 