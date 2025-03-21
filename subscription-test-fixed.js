const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure directory exists
const screenshotsDir = 'screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Create or open error log file
const errorLogFile = 'subscription-errors.md';
fs.writeFileSync(errorLogFile, '# NIFYA Subscription Creation Error Log\n\n', { flag: 'w' });

// Function to log to file
function logToFile(message) {
  fs.appendFileSync(errorLogFile, message + '\n');
}

// Function to log console messages to file
function logConsoleMessage(msg) {
  const type = msg.type();
  const text = msg.text();
  console.log(`BROWSER ${type}: ${text}`);
  
  if (type === 'error' || text.toLowerCase().includes('error') || text.toLowerCase().includes('failed') || text.toLowerCase().includes('validation')) {
    logToFile(`## Console ${type.toUpperCase()} Message\n\`\`\`\n${text}\n\`\`\`\n`);
  }
}

// Function to capture network issues
function logNetworkIssue(request, errorText) {
  const message = `Failed request to: ${request.url()}\nError: ${errorText}`;
  console.error(message);
  logToFile(`## Network Request Failed\n\`\`\`\n${message}\n\`\`\`\n`);
}

// Function to take a screenshot and log it
async function takeScreenshot(page, name) {
  const filename = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Saved screenshot: ${filename}`);
  return filename;
}

// Main test function
(async () => {
  console.log('Starting subscription creation test...');
  logToFile(`## Test Started\nTimestamp: ${new Date().toISOString()}\n`);
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox'] 
  });
  console.log('Browser launched');
  
  // Open a new page
  const page = await browser.newPage();
  console.log('Page created');
  
  // Set up console logging
  page.on('console', logConsoleMessage);
  
  // Set up request failure logging
  page.on('requestfailed', request => {
    logNetworkIssue(request, request.failure().errorText);
  });
  
  // Set up response logging for errors
  page.on('response', async response => {
    const status = response.status();
    if (status >= 400) {
      const url = response.url();
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = '[Could not read response body]';
      }
      
      const message = `Response ${status} from: ${url}\nBody: ${responseText}`;
      console.error(message);
      logToFile(`## HTTP Error Response\n\`\`\`\n${message}\n\`\`\`\n`);
    }
  });
  
  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/auth', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded login page');
    
    await takeScreenshot(page, 'login-page');
    
    // Fill out login form
    console.log('Filling login form...');
    await page.type('input[type="email"]', 'ratonxi@gmail.com');
    await page.type('input[type="password"]', 'nifyaCorp12!');
    
    await takeScreenshot(page, 'login-form-filled');
    
    // Click login button
    console.log('Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('Logged in successfully');
    
    await takeScreenshot(page, 'after-login');
    
    // Navigate directly to the BOE subscription form
    console.log('Navigating directly to BOE subscription form...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/new/boe-general', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded BOE subscription form');
    
    await takeScreenshot(page, 'boe-form-direct-access');

    // Based on our form analysis, we know the exact structure of the form
    console.log('Filling prompt textarea...');
    
    // Wait for the form to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find and fill the textarea
    const promptFilled = await page.evaluate(() => {
      const textarea = document.querySelector('textarea[placeholder*="Describe"]');
      if (textarea) {
        textarea.value = 'quiero ser funcionario';
        
        // Trigger input event to notify React of the change
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
        
        // Also trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        textarea.dispatchEvent(changeEvent);
        
        return true;
      }
      return false;
    });
    
    if (!promptFilled) {
      throw new Error('Could not find or fill the prompt textarea');
    }
    
    console.log('Prompt filled successfully');
    await takeScreenshot(page, 'prompt-filled');
    
    // Get the submit button - we know it has id "create-subscription-button"
    console.log('Finding and clicking submit button...');
    
    const submitButton = await page.$('button#create-subscription-button');
    
    if (!submitButton) {
      throw new Error('Could not find the submit button with ID "create-subscription-button"');
    }
    
    // Set up request/response interception for subscription creation
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      // Log POST requests which might be subscription creation
      if (request.method() === 'POST' && request.url().includes('/api/')) {
        try {
          const postData = request.postData();
          if (postData) {
            console.log('Subscription request data:', postData);
            logToFile(`## Subscription Creation Request\n\`\`\`\n${request.url()}\n${postData}\n\`\`\`\n`);
          }
        } catch (e) {
          console.error('Error logging request data:', e);
        }
      }
      request.continue();
    });
    
    // Click the submit button
    await Promise.all([
      page.waitForResponse(
        response => response.url().includes('/api/v1/subscriptions') && response.request().method() === 'POST',
        { timeout: 30000 }
      ).catch(() => console.log('No matching response detected')),
      submitButton.click()
    ]);
    
    console.log('Submit button clicked');
    await takeScreenshot(page, 'after-submission');
    
    // Wait for navigation or response
    try {
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {
        console.log('No navigation occurred after submit');
      });
    } catch (e) {
      console.log('Navigation wait error:', e.message);
    }
    
    // Wait a moment to see any potential response or validation errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Final screenshot
    await takeScreenshot(page, 'final-state');
    
    console.log('Test completed successfully');
    logToFile(`\n## Test Complete\nTimestamp: ${new Date().toISOString()}\n`);
    
  } catch (error) {
    console.error('Error during test:', error);
    logToFile(`\n## Test Failed\nError: ${error.message}\nStack: ${error.stack}\n`);
    
    // Take screenshot of error state
    await takeScreenshot(page, 'error-state');
  } finally {
    // Close browser
    await browser.close();
    console.log(`Test finished. Error log saved to ${errorLogFile}`);
    console.log('Check screenshots in the screenshots directory');
  }
})(); 