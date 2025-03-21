const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Starting subscription test with console logging...');
  
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
  
  // Store API responses for debugging
  const apiResponses = {};
  
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
  
  // Network request monitoring for API responses
  page.on('response', async response => {
    const url = response.url();
    
    // Only capture API responses
    if (url.includes('/api/v1/')) {
      try {
        const data = await response.json();
        apiResponses[url] = {
          status: response.status(),
          data: data
        };
        console.log(`[API Response] ${url} (${response.status()})`);
      } catch (e) {
        console.log(`[API Response] Failed to parse ${url}: ${e.message}`);
      }
    }
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
    
    // Step 2: Navigate to subscription templates page
    console.log('Navigating to subscription templates page...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/new', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded templates page');
    
    // Take screenshot of the templates page
    await page.screenshot({ path: 'templates-page-debug.png' });
    
    // Wait longer to ensure everything is fully loaded
    console.log('Waiting for templates to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Find and click on the BOE template's Select button
    console.log('Attempting to click BOE template select button...');
    
    // First try directly navigating to the known BOE template URL
    try {
      console.log('Trying direct navigation to BOE template form...');
      await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/create/boe-general', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log('Direct navigation successful');
    } catch (directNavError) {
      console.log('Direct navigation failed, trying to find and click template card...');
      
      // Wait a bit more for all templates to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // First try to find elements by data-testid
      const boeCardByTestId = await page.$('[data-testid="boe-template-card"]');
      if (boeCardByTestId) {
        console.log('Found BOE template card by test ID');
        
        // Take screenshot of the found card
        await page.evaluate(el => el.style.border = '3px solid green', boeCardByTestId);
        await page.screenshot({ path: 'boe-card-found-debug.png' });
        
        await boeCardByTestId.click();
        console.log('Clicked BOE template card');
      } else {
        // Try finding it by content
        console.log('Looking for cards with BOE text...');
        
        // Multiple strategies to find BOE card
        const cardSelectors = [
          '.rounded-lg', 
          '.card',
          '[role="button"]',
          '.px-4',
          'div.border',
          'div.shadow'
        ];
        
        // Try each selector
        let foundCard = null;
        
        for (const selector of cardSelectors) {
          const cards = await page.$$(selector);
          console.log(`Found ${cards.length} potential cards with selector: ${selector}`);
          
          for (const card of cards) {
            const cardText = await page.evaluate(el => el.textContent, card);
            if (cardText && (cardText.includes('BOE') || cardText.includes('Boletín') || cardText.includes('Estado'))) {
              console.log('Found BOE text in card:', cardText.substring(0, 30) + '...');
              foundCard = card;
              break;
            }
          }
          
          if (foundCard) break;
        }
        
        if (foundCard) {
          // Highlight the card before clicking
          await page.evaluate(el => {
            el.style.border = '3px solid red';
            el.scrollIntoView();
          }, foundCard);
          
          // Take screenshot with highlighted card
          await page.screenshot({ path: 'boe-card-highlight-debug.png' });
          
          // Try to find button inside card
          const buttonInCard = await foundCard.$('button');
          if (buttonInCard) {
            console.log('Found button in BOE card, clicking it');
            await buttonInCard.click();
          } else {
            console.log('No button found in BOE card, clicking the card itself');
            await foundCard.click();
          }
          
          console.log('Clicked BOE card element');
          
          // Wait for navigation
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
            console.log('Navigation timeout after card click, trying direct navigation');
            return page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/create/boe-general', {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
          });
        } else {
          // Last resort: direct navigation
          console.log('No BOE card found, navigating directly to subscription form');
          await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/create/boe-general', {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
        }
      }
    }
    
    // Wait for the form page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Check if we're on the subscription form page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take screenshot of current page
    await page.screenshot({ path: 'subscription-form-debug.png' });
    
    // Check if we're on a form page (either /create/ or /new/template-id format)
    if (currentUrl.includes('/create/') || currentUrl.includes('/new/')) {
      console.log('Successfully navigated to subscription form');
      
      // Fill in the form
      console.log('Filling subscription form...');
      try {
        // Wait for the form to appear
        await page.waitForSelector('[data-testid="subscription-form"]', { timeout: 5000 });
        console.log('Found subscription form');
        
        // Wait for input field instead of textarea
        await page.waitForSelector('[data-testid="prompt-input-0"]', { timeout: 5000 });
        
        // Fill in the prompt in the input field
        await page.type('[data-testid="prompt-input-0"]', 'Subvenciones para empresas tecnológicas en Madrid');
        console.log('Entered prompt text');
        
        // Take screenshot of filled form
        await page.screenshot({ path: 'subscription-form-filled-debug.png' });
        
        // Select frequency option
        try {
          await page.click('[data-testid="frequency-daily"]');
          console.log('Selected daily frequency option');
          
          // Take screenshot after selecting frequency
          await page.screenshot({ path: 'frequency-selected-debug.png' });
        } catch (frequencyError) {
          console.log('Error selecting frequency:', frequencyError.message);
        }
        
        // Submit the form
        const submitButton = await page.$('[data-testid="subscription-submit-button"]');
        if (submitButton) {
          console.log('Submitting form...');
          
          // Take screenshot before submitting
          await page.screenshot({ path: 'before-submission-debug.png' });
          
          // Scroll to the submit button to ensure it's visible
          await page.evaluate(button => {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, submitButton);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Clear API responses before submitting to capture only relevant ones
          Object.keys(apiResponses).forEach(key => delete apiResponses[key]);
          
          // Click the submit button and wait for navigation
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
              console.log('Navigation timeout after submission, continuing anyway');
            }),
            submitButton.click()
          ]);
          
          console.log('Submitted form');
          
          // Take screenshot after submission
          await page.screenshot({ path: 'after-submission-debug.png' });
          
          // Wait longer to make sure we capture any console errors
          console.log('Waiting to capture console errors...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Check if we were redirected to subscriptions page (success)
          const finalUrl = page.url();
          console.log('Final URL after submission:', finalUrl);
          
          if (finalUrl.includes('/subscriptions') && !finalUrl.includes('/new/') && !finalUrl.includes('/create/')) {
            console.log('SUCCESS: Subscription created successfully');
            
            // Wait for subscriptions to load and take screenshot
            await new Promise(resolve => setTimeout(resolve, 3000));
            await page.screenshot({ path: 'subscriptions-list-debug.png' });
            
            // DEBUG: Check network requests for subscription listing API call
            console.log('API Responses captured:', Object.keys(apiResponses));
            
            // Check if subscriptions API was called
            const subscriptionsApiKey = Object.keys(apiResponses).find(url => 
              url.includes('/api/v1/subscriptions') && !url.includes('/process') && !url.includes('/stats')
            );
            
            if (subscriptionsApiKey) {
              console.log('Subscriptions API response:', JSON.stringify(apiResponses[subscriptionsApiKey], null, 2));
            } else {
              console.log('No subscriptions API response captured');
            }
            
            // Check for subscription data in the DOM
            const subscriptionCards = await page.$$('.card');
            console.log(`Found ${subscriptionCards.length} subscription cards on the page`);
            
            // Check for empty state message
            const emptyStateElement = await page.$('text/No subscriptions yet');
            if (emptyStateElement) {
              console.log('ERROR: Empty state message found despite subscription creation success');
              await page.screenshot({ path: 'empty-state-error-debug.png' });
            }
            
            // Try reloading the page to see if subscriptions appear
            console.log('Reloading subscriptions page to see if data appears...');
            await page.reload({ waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            await page.screenshot({ path: 'subscriptions-list-after-reload-debug.png' });
            
            // Check for subscription data after reload
            const subscriptionCardsAfterReload = await page.$$('.card');
            console.log(`Found ${subscriptionCardsAfterReload.length} subscription cards after reload`);
            
            // Now navigate to dashboard to see if subscriptions appear there
            console.log('Navigating to dashboard to check if subscriptions appear there...');
            await page.goto('https://clever-kelpie-60c3a6.netlify.app/dashboard', {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            await page.screenshot({ path: 'dashboard-debug.png' });
            
            // Extract subscription stats from dashboard
            const dashboardStats = await page.evaluate(() => {
              const statsElement = document.querySelector('.text-3xl.font-bold');
              return statsElement ? statsElement.textContent : 'Not found';
            });
            console.log('Dashboard subscription stats:', dashboardStats);
          } else {
            console.log('WARNING: Not redirected to subscriptions page, checking for errors');
            
            // Look for error messages
            const errorMessage = await page.evaluate(() => {
              const errorElement = document.querySelector('.text-destructive, .error-message, .alert-error');
              return errorElement ? errorElement.textContent.trim() : null;
            });
            
            if (errorMessage) {
              console.log('Error message found:', errorMessage);
            }
            
            // Take a screenshot of the error state
            await page.screenshot({ path: 'error-state-debug.png' });
          }
        } else {
          console.log('Submit button not found');
        }
      } catch (formError) {
        console.error('Error filling form:', formError);
        await page.screenshot({ path: 'form-error-debug.png' });
      }
    } else {
      console.log('Failed to navigate to subscription form');
      
      // Take screenshot of the error state
      await page.screenshot({ path: 'navigation-error-debug.png' });
    }
    
    // Write all browser logs to a file
    fs.writeFileSync('browser-console-logs.json', JSON.stringify(browserLogs, null, 2));
    console.log('Browser console logs saved to browser-console-logs.json');
    
    // Write API responses to a file
    fs.writeFileSync('api-responses.json', JSON.stringify(apiResponses, null, 2));
    console.log('API responses saved to api-responses.json');
    
    // Wait for 10 seconds before closing
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Close browser
    await browser.close();
    console.log('Test completed');
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take screenshot of error state
    await page.screenshot({ path: 'error-state-debug.png' });
    console.log('Saved error state screenshot');
    
    // Write all browser logs to a file
    fs.writeFileSync('browser-console-logs.json', JSON.stringify(browserLogs, null, 2));
    console.log('Browser console logs saved to browser-console-logs.json');
    
    // Write API responses to a file
    fs.writeFileSync('api-responses.json', JSON.stringify(apiResponses, null, 2));
    console.log('API responses saved to api-responses.json');
    
    // Close browser
    await browser.close();
  }
})(); 