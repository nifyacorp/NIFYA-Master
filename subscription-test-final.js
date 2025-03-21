const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure directory exists
const screenshotsDir = 'screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Create or open error log file
const errorLogFile = 'subscription-test-results.md';
fs.writeFileSync(errorLogFile, '# NIFYA Subscription Creation Test Results\n\n', { flag: 'w' });

// Function to log to file
function logToFile(message) {
  fs.appendFileSync(errorLogFile, message + '\n');
}

// Function to log console messages
function logConsoleMessage(msg) {
  const type = msg.type();
  const text = msg.text();
  
  if (text.includes('subscription') || text.includes('prompt') || text.includes('Subscription') || 
      text.includes('Prompt') || text.includes('validation') || text.includes('error') || 
      text.includes('Error') || text.includes('API') || text.includes('object')) {
    console.log(`BROWSER ${type.toUpperCase()}: ${text}`);
    logToFile(`## Console ${type.toUpperCase()} Message\n\`\`\`\n${text}\n\`\`\`\n`);
  }
}

// Function to take a screenshot and log it
async function takeScreenshot(page, name) {
  const filename = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Saved screenshot: ${filename}`);
  logToFile(`\n![${name}](${filename})\n`);
  return filename;
}

// Main test function
(async () => {
  console.log('Starting NIFYA subscription creation test...');
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
  
  // Enable request/response monitoring
  await page.setRequestInterception(true);
  
  // Set up console logging
  page.on('console', logConsoleMessage);
  
  // Log all network requests
  page.on('request', request => {
    // Focus on API requests
    if (request.url().includes('/api/')) {
      const method = request.method();
      const url = request.url();
      let postData = null;
      
      try {
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          postData = request.postData();
        }
      } catch (e) {
        postData = '[Could not read post data]';
      }
      
      if (url.includes('subscription') || url.includes('template')) {
        console.log(`REQUEST ${method}: ${url}`);
        logToFile(`## Network Request\n\`\`\`\nMethod: ${method}\nURL: ${url}\nData: ${postData || 'None'}\n\`\`\`\n`);
      }
    }
    
    request.continue();
  });
  
  // Log all responses
  page.on('response', async response => {
    // Focus on API responses
    if (response.url().includes('/api/')) {
      const status = response.status();
      const url = response.url();
      let responseBody = null;
      
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseBody = await response.json().catch(() => null);
          responseBody = JSON.stringify(responseBody, null, 2);
        } else {
          responseBody = await response.text().catch(() => '[Could not read response body]');
        }
      } catch (e) {
        responseBody = `[Error reading response: ${e.message}]`;
      }
      
      if (url.includes('subscription') || url.includes('template') || status >= 400) {
        console.log(`RESPONSE ${status}: ${url}`);
        logToFile(`## Network Response\n\`\`\`\nStatus: ${status}\nURL: ${url}\nBody: ${responseBody || 'None'}\n\`\`\`\n`);
      }
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
    
    await takeScreenshot(page, '1-login-page');
    
    // Fill out login form
    console.log('Filling login form...');
    await page.type('input[type="email"]', 'ratonxi@gmail.com');
    await page.type('input[type="password"]', 'nifyaCorp12!');
    
    await takeScreenshot(page, '2-login-form-filled');
    
    // Click login button
    console.log('Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('Logged in successfully');
    
    await takeScreenshot(page, '3-after-login');
    
    // Navigate directly to the BOE subscription form
    console.log('Navigating directly to BOE subscription form...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/new/boe-general', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded BOE subscription form');
    
    await takeScreenshot(page, '4-boe-form');
    
    // Log the form structure
    const formData = await page.evaluate(() => {
      const form = document.querySelector('form');
      
      // Get the textarea value placeholder
      const textarea = document.querySelector('textarea');
      const textareaInfo = textarea ? {
        placeholder: textarea.placeholder,
        value: textarea.value,
        id: textarea.id,
        name: textarea.name,
        classes: Array.from(textarea.classList)
      } : null;
      
      // Get information about the submit button
      const submitButton = document.querySelector('button[type="submit"]');
      const submitButtonInfo = submitButton ? {
        text: submitButton.innerText,
        id: submitButton.id,
        classes: Array.from(submitButton.classList),
        disabled: submitButton.disabled
      } : null;
      
      return {
        hasForm: !!form,
        textareaInfo,
        submitButtonInfo,
        formHTML: form ? form.outerHTML : null
      };
    });
    
    console.log('Form data:', formData);
    logToFile(`## Form Structure\n\`\`\`json\n${JSON.stringify(formData, null, 2)}\n\`\`\`\n`);
    
    // Fill in the prompt
    console.log('Filling in the prompt...');
    const promptFilled = await page.evaluate(() => {
      // Find the textarea by placeholder
      const textarea = document.querySelector('textarea[placeholder*="Describe"]');
      
      if (textarea) {
        // Fill the textarea
        textarea.value = 'quiero ser funcionario';
        
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
        
        // Also trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        textarea.dispatchEvent(changeEvent);
        
        return true;
      }
      
      return false;
    });
    
    if (!promptFilled) {
      throw new Error('Failed to fill in the prompt field');
    }
    
    console.log('Prompt filled successfully');
    await takeScreenshot(page, '5-prompt-filled');
    
    // Submit the form
    console.log('Submitting the form...');
    
    // Check if any network requests are in progress
    await page.waitForNetworkIdle({ idleTime: 500 }).catch(() => {
      console.log('Network activity did not become idle within the timeout');
    });
    
    // Click the submit button
    const submitResult = await page.evaluate(() => {
      // Find the submit button by ID or text
      const submitButton = document.querySelector('button#create-subscription-button') || 
                          document.querySelector('button[type="submit"]') ||
                          Array.from(document.querySelectorAll('button')).find(b => 
                            b.innerText.toLowerCase().includes('crear') || 
                            b.innerText.toLowerCase().includes('create') ||
                            b.innerText.toLowerCase().includes('submit')
                          );
      
      if (submitButton) {
        // Check if the button is disabled
        const isDisabled = submitButton.disabled;
        
        // Ensure the button is not disabled
        if (isDisabled) {
          submitButton.disabled = false;
        }
        
        // Click the button
        submitButton.click();
        
        return { 
          clicked: true, 
          buttonText: submitButton.innerText,
          wasDisabled: isDisabled,
          type: submitButton.type
        };
      }
      
      return { clicked: false };
    });
    
    console.log('Submit result:', submitResult);
    logToFile(`## Submit Button Click\n\`\`\`json\n${JSON.stringify(submitResult, null, 2)}\n\`\`\`\n`);
    
    if (!submitResult.clicked) {
      throw new Error('Could not find or click the submit button');
    }
    
    // Wait for potential API requests
    console.log('Waiting for network activity...');
    try {
      await page.waitForResponse(
        response => response.url().includes('/api/v1/subscriptions') && 
                  (response.request().method() === 'POST' || response.request().method() === 'PUT'),
        { timeout: 10000 }
      );
      console.log('Detected subscription API response');
    } catch (e) {
      console.log('No subscription API response detected:', e.message);
    }
    
    await takeScreenshot(page, '6-after-submit');
    
    // Check if there was any navigation
    try {
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {
        console.log('No navigation occurred after form submission');
      });
    } catch (e) {
      console.log('Navigation timeout:', e.message);
    }
    
    // Wait a moment to see any UI updates or error messages
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for any validation errors or success messages
    const formStatus = await page.evaluate(() => {
      // Look for error messages
      const errorElements = Array.from(document.querySelectorAll('.text-destructive, .text-red-500, [aria-invalid="true"], .error, .invalid'));
      const errors = errorElements.map(el => ({
        text: el.innerText,
        classList: Array.from(el.classList)
      }));
      
      // Look for success messages
      const successElements = Array.from(document.querySelectorAll('.text-success, .text-green-500, .success'));
      const success = successElements.map(el => ({
        text: el.innerText,
        classList: Array.from(el.classList)
      }));
      
      // Check if we're on a different page
      const currentUrl = window.location.href;
      
      return {
        currentUrl,
        hasErrors: errors.length > 0,
        errors,
        hasSuccess: success.length > 0,
        success,
        pageTitle: document.title,
        bodyText: document.body.innerText.substring(0, 500) // Get first 500 chars of body
      };
    });
    
    console.log('Form status after submission:', formStatus);
    logToFile(`## Form Status After Submission\n\`\`\`json\n${JSON.stringify(formStatus, null, 2)}\n\`\`\`\n`);
    
    await takeScreenshot(page, '7-final-state');
    
    console.log('Test completed successfully');
    logToFile(`\n## Test Completed\nTimestamp: ${new Date().toISOString()}\n`);
    
  } catch (error) {
    console.error('Error during test:', error);
    logToFile(`\n## Test Failed\nError: ${error.message}\nStack: ${error.stack}\n`);
    
    // Take screenshot of error state
    await takeScreenshot(page, 'error-state');
  } finally {
    // Wait a moment for any pending logs 
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Close browser
    await browser.close();
    console.log(`Test finished. Results saved to ${errorLogFile}`);
    console.log('Check screenshots in the screenshots directory');
  }
})(); 