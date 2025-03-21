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
    
    // Go to subscriptions page
    console.log('Navigating to subscriptions page...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded subscriptions page');
    
    await takeScreenshot(page, 'subscriptions-page');
    
    // Click "Create Subscription" button
    console.log('Clicking Create Subscription button...');
    
    // Find the button by text content - support both English and Spanish
    const createButtonSelector = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button'));
      const createBtn = buttons.find(btn => {
        const text = btn.innerText.toLowerCase();
        return text.includes('create subscription') || text.includes('nueva suscripción');
      });
      
      if (createBtn) {
        // Add a test ID to the button to make it easier to select
        createBtn.setAttribute('data-testid', 'create-subscription-btn');
        return '[data-testid="create-subscription-btn"]';
      }
      
      return null;
    });
    
    if (!createButtonSelector) {
      throw new Error('Could not find Create Subscription button');
    }
    
    // Click the button and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click(createButtonSelector)
    ]);
    console.log('Navigated to create subscription page');
    
    await takeScreenshot(page, 'create-subscription-page');
    
    // Find and click the BOE General template
    console.log('Selecting BOE General template...');
    
    // Wait for templates to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find BOE General template
    const boeTemplateSelector = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card, [class*="card"], div[role="button"]'));
      const boeCard = cards.find(card => 
        card.innerText.toLowerCase().includes('boe general') || 
        card.innerText.toLowerCase().includes('boletín oficial')
      );
      
      if (boeCard) {
        // Add a test ID to the card to make it easier to select
        boeCard.setAttribute('data-testid', 'boe-general-template');
        return '[data-testid="boe-general-template"]';
      }
      
      return null;
    });
    
    if (!boeTemplateSelector) {
      throw new Error('Could not find BOE General template');
    }
    
    // Click the template and wait for navigation/DOM update
    await page.click(boeTemplateSelector);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for the form to appear
    
    console.log('Selected BOE General template');
    await takeScreenshot(page, 'template-selected');
    
    // Add debug information about the form structure
    const formDebugInfo = await page.evaluate(() => {
      // Collect all input elements
      const allInputs = Array.from(document.querySelectorAll('input, textarea'));
      const inputInfo = allInputs.map(input => ({
        tagName: input.tagName,
        type: input.type,
        id: input.id,
        name: input.name,
        placeholder: input.placeholder,
        value: input.value,
        classes: Array.from(input.classList),
        visible: input.offsetParent !== null
      }));
      
      // Collect form structure
      const forms = Array.from(document.querySelectorAll('form'));
      const formInfo = forms.map(form => ({
        id: form.id,
        action: form.action,
        method: form.method,
        childElements: Array.from(form.querySelectorAll('*')).length
      }));
      
      return {
        inputCount: allInputs.length,
        formCount: forms.length,
        inputs: inputInfo,
        forms: formInfo,
        bodyContent: document.body.innerText.substring(0, 500) // First 500 chars of body text
      };
    });
    
    console.log('Debug - Form structure:', JSON.stringify(formDebugInfo, null, 2));
    
    // Wait longer for the form to fully render and stabilize
    console.log('Waiting 5 seconds for the form to fully load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take a screenshot of the form
    await takeScreenshot(page, 'form-with-fields');
    
    // Add visual markers to all input-like elements for debugging
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
      inputs.forEach((el, index) => {
        // Highlight the element with a red border
        el.style.border = '3px solid red';
        // Add a number label next to the element
        const label = document.createElement('div');
        label.textContent = `Input #${index + 1}`;
        label.style.position = 'absolute';
        label.style.background = 'red';
        label.style.color = 'white';
        label.style.padding = '2px 5px';
        label.style.borderRadius = '3px';
        label.style.fontSize = '12px';
        label.style.zIndex = '10000';
        
        const rect = el.getBoundingClientRect();
        label.style.top = `${rect.top + window.scrollY - 15}px`;
        label.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(label);
      });
      
      return inputs.length;
    });
    
    // Take a screenshot with the highlights
    await takeScreenshot(page, 'form-with-highlights');
    
    // Wait to allow manual inspection if needed
    console.log('Pause for manual inspection - waiting 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Fill in the prompt - attempt with specific selectors
    console.log('Attempting to fill prompt form...');
    
    // Try to use a known selector from the frontend code
    const promptFilled = await page.evaluate(() => {
      // Try to find the input by role in the form
      const input = document.querySelector('textarea, input[type="text"]');
      if (input) {
        input.value = 'quiero ser funcionario';
        // Trigger input event to notify React of the change
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        return true;
      }
      return false;
    });
    
    if (promptFilled) {
      console.log('Entered prompt text using direct DOM manipulation');
      await takeScreenshot(page, 'prompt-filled');
    } else {
      console.log('Failed to fill prompt using direct DOM manipulation');
      // Take a screenshot but continue
      await takeScreenshot(page, 'prompt-fill-failed');
    }
    
    // Wait a moment for any validation or state updates
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click the "Crear Suscripción" button using visual text matching
    console.log('Attempting to submit subscription form...');
    
    // More aggressive approach to find and click the submit button
    const buttonClicked = await page.evaluate(() => {
      // Find all buttons
      const allButtons = Array.from(document.querySelectorAll('button'));
      
      // Try to find the submit button with common submit button properties
      let submitButton = allButtons.find(btn => 
        btn.type === 'submit' || 
        btn.form || 
        btn.innerText.toLowerCase().includes('crear') ||
        btn.innerText.toLowerCase().includes('create') ||
        btn.innerText.toLowerCase().includes('submit')
      );
      
      if (submitButton) {
        // Click the button
        submitButton.click();
        return true;
      }
      
      return false;
    });
    
    if (buttonClicked) {
      console.log('Clicked submit button via direct DOM manipulation');
      await takeScreenshot(page, 'after-submit-click');
      
      // Wait for navigation or response
      try {
        await page.waitForNavigation({ timeout: 10000 }).catch(() => {
          console.log('No navigation occurred after submit - form might have validation errors');
        });
      } catch (e) {
        console.log('Navigation wait error:', e.message);
      }
      
      // Final screenshot
      await takeScreenshot(page, 'final-state');
    } else {
      console.log('Could not find the submit button');
      await takeScreenshot(page, 'no-submit-button');
    }
    
    console.log('Test completed. Waiting for 5 seconds before closing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Add completion message to log
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