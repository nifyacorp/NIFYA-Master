const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure screenshots directory exists
const screenshotsDir = 'form-screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Function to take a screenshot and log it
async function takeScreenshot(page, name) {
  const filename = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Saved screenshot: ${filename}`);
  return filename;
}

// Main function
(async () => {
  console.log('Starting subscription form analysis...');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to see what's happening
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox'] 
  });
  console.log('Browser launched');
  
  // Open a new page
  const page = await browser.newPage();
  console.log('Page created');
  
  // Log console messages from the browser
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
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
    
    // Click login button
    console.log('Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('Logged in successfully');
    
    // Navigate directly to the subscription creation page
    console.log('Navigating to subscriptions/new page...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/new', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded subscriptions/new page');
    
    await takeScreenshot(page, '2-subscription-catalog');
    
    // Log the structure of the page
    console.log('Analyzing subscription catalog page...');
    
    // Extract all buttons and cards to identify the BOE General option
    const catalogElements = await page.evaluate(() => {
      // Find all possible clickable elements
      const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"], .card'));
      
      return buttons.map(el => ({
        tagName: el.tagName,
        text: el.innerText.trim(),
        classes: Array.from(el.classList),
        id: el.id,
        role: el.getAttribute('role'),
        href: el.getAttribute('href'),
        isVisible: el.offsetParent !== null
      }));
    });
    
    console.log('Subscription catalog elements:', JSON.stringify(catalogElements, null, 2));
    
    // Find and highlight the BOE General card
    await page.evaluate(() => {
      // Find all cards
      const cards = Array.from(document.querySelectorAll('.card, div[role="button"]'));
      // Find the BOE General card
      const boeCard = cards.find(card => 
        card.innerText.toLowerCase().includes('boe general') || 
        card.innerText.toLowerCase().includes('boletín oficial')
      );
      
      if (boeCard) {
        // Highlight the card
        boeCard.style.border = '5px solid red';
        boeCard.style.boxShadow = '0 0 10px red';
        
        // Find any select or use button within the card
        const buttons = boeCard.querySelectorAll('button, a');
        buttons.forEach(button => {
          button.style.border = '3px solid blue';
          button.style.boxShadow = '0 0 10px blue';
        });
      }
    });
    
    await takeScreenshot(page, '3-boe-card-highlighted');
    
    // Click on the BOE General card or select button
    console.log('Attempting to click on BOE General option...');
    
    // Try different strategies to find and click the right element
    const clickResult = await page.evaluate(() => {
      // Strategy 1: Look for a "Select" button inside a BOE card
      const cards = Array.from(document.querySelectorAll('.card, div[role="button"]'));
      const boeCard = cards.find(card => 
        card.innerText.toLowerCase().includes('boe general') || 
        card.innerText.toLowerCase().includes('boletín oficial')
      );
      
      if (boeCard) {
        // Try to find a select button in the card
        const selectBtn = Array.from(boeCard.querySelectorAll('button, a')).find(btn => 
          btn.innerText.toLowerCase().includes('select') || 
          btn.innerText.toLowerCase().includes('seleccionar') ||
          btn.innerText.toLowerCase().includes('usar')
        );
        
        if (selectBtn) {
          selectBtn.click();
          return { success: true, strategy: 'select-button-in-card', element: 'button' };
        }
        
        // If no select button, click the card itself
        boeCard.click();
        return { success: true, strategy: 'click-card', element: boeCard.tagName };
      }
      
      // Strategy 2: Look for a link containing "boe-general"
      const boeLink = Array.from(document.querySelectorAll('a')).find(a => 
        a.href.toLowerCase().includes('boe-general') ||
        a.href.toLowerCase().includes('boe')
      );
      
      if (boeLink) {
        boeLink.click();
        return { success: true, strategy: 'boe-link', element: 'a' };
      }
      
      return { success: false };
    });
    
    console.log('Click result:', clickResult);
    
    // Wait for navigation
    await page.waitForNavigation({ timeout: 30000 }).catch(() => {
      console.log('No navigation detected after clicking. Taking screenshot anyway.');
    });
    
    // Give it some time to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await takeScreenshot(page, '4-after-boe-selection');
    
    // Check if we're on the BOE form page
    console.log('Checking if we reached the BOE form page...');
    
    // Try to navigate directly to the BOE General form
    console.log('Directly navigating to BOE General form...');
    await page.goto('https://clever-kelpie-60c3a6.netlify.app/subscriptions/new/boe-general', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Loaded BOE form page');
    
    await takeScreenshot(page, '5-boe-form-page');
    
    // Analyze the form structure
    console.log('Analyzing BOE form structure...');
    const formStructure = await page.evaluate(() => {
      // Find all form elements
      const form = document.querySelector('form');
      
      // Find all inputs, textareas, and other form controls
      const inputs = Array.from(document.querySelectorAll('input, textarea, select, [contenteditable="true"]'));
      
      const inputDetails = inputs.map(input => ({
        tagName: input.tagName,
        type: input.type,
        id: input.id,
        name: input.name,
        placeholder: input.placeholder,
        value: input.value,
        classes: Array.from(input.classList),
        isVisible: input.offsetParent !== null,
        rect: input.getBoundingClientRect().toJSON()
      }));
      
      // Find all buttons
      const buttons = Array.from(document.querySelectorAll('button'));
      const buttonDetails = buttons.map(btn => ({
        type: btn.type,
        text: btn.innerText,
        id: btn.id,
        classes: Array.from(btn.classList),
        isVisible: btn.offsetParent !== null
      }));
      
      return {
        hasForm: !!form,
        formAction: form ? form.action : null,
        formMethod: form ? form.method : null,
        inputCount: inputs.length,
        inputs: inputDetails,
        buttonCount: buttons.length,
        buttons: buttonDetails,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('Form structure:', JSON.stringify(formStructure, null, 2));
    
    // Add visual indicators to form elements
    await page.evaluate(() => {
      // Highlight all inputs
      const inputs = document.querySelectorAll('input, textarea, select, [contenteditable="true"]');
      inputs.forEach((el, index) => {
        el.style.border = '3px solid red';
        
        // Add a label
        const label = document.createElement('div');
        label.textContent = `Input #${index + 1}: ${el.tagName} ${el.type || ''}`;
        label.style.position = 'absolute';
        label.style.background = 'red';
        label.style.color = 'white';
        label.style.padding = '2px 5px';
        label.style.borderRadius = '3px';
        label.style.fontSize = '12px';
        label.style.zIndex = '10000';
        
        const rect = el.getBoundingClientRect();
        label.style.top = `${rect.top + window.scrollY - 20}px`;
        label.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(label);
      });
      
      // Highlight all buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach((el, index) => {
        el.style.border = '3px solid blue';
        
        // Add a label
        const label = document.createElement('div');
        label.textContent = `Button #${index + 1}: ${el.innerText || el.type}`;
        label.style.position = 'absolute';
        label.style.background = 'blue';
        label.style.color = 'white';
        label.style.padding = '2px 5px';
        label.style.borderRadius = '3px';
        label.style.fontSize = '12px';
        label.style.zIndex = '10000';
        
        const rect = el.getBoundingClientRect();
        label.style.top = `${rect.top + window.scrollY - 20}px`;
        label.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(label);
      });
    });
    
    await takeScreenshot(page, '6-form-elements-highlighted');
    
    // Try to fill the prompt
    console.log('Attempting to fill the prompt field...');
    
    const promptResult = await page.evaluate(() => {
      // Try to find the prompt input or textarea
      const promptInput = Array.from(document.querySelectorAll('input, textarea'))
        .find(el => (
          (el.placeholder && el.placeholder.toLowerCase().includes('describ')) ||
          (el.id && el.id.toLowerCase().includes('prompt')) ||
          (el.classList.contains('prompt-input')) ||
          (el.parentElement && el.parentElement.innerText.toLowerCase().includes('prompt'))
        ));
      
      if (promptInput) {
        // Set the value
        promptInput.value = 'quiero ser funcionario';
        
        // Trigger input event
        const event = new Event('input', { bubbles: true });
        promptInput.dispatchEvent(event);
        
        // Also try change event
        const changeEvent = new Event('change', { bubbles: true });
        promptInput.dispatchEvent(changeEvent);
        
        return { success: true, element: promptInput.tagName, type: promptInput.type };
      }
      
      return { success: false };
    });
    
    console.log('Prompt fill result:', promptResult);
    
    await takeScreenshot(page, '7-prompt-filled');
    
    // Wait for 15 seconds to allow manual inspection
    console.log('Waiting 15 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log('Analysis complete');
  } catch (error) {
    console.error('Error:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
})(); 