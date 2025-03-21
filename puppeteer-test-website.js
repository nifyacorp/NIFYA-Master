const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting subscription test...');
  
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
    await page.screenshot({ path: 'templates-page.png' });
    
    // Wait longer to ensure everything is fully loaded
    console.log('Waiting for templates to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Find and click on the BOE template's Select button
    console.log('Attempting to click BOE template select button...');
    
    // Using the information from our page analysis, we know the structure:
    // 1. Find the template card containing "BOE"
    // 2. Find its "Select" button
    const selectButtons = await page.$$('button');
    let boeTemplateSelectButton = null;
    
    // Find the first BOE template card's select button
    for (const button of selectButtons) {
      const buttonText = await page.evaluate(el => el.textContent.trim(), button);
      if (buttonText === 'Select') {
        // Check if this button is within a card containing BOE
        const isInBoeCard = await page.evaluate(el => {
          const card = el.closest('.rounded-lg');
          return card && (card.textContent.includes('BOE') || card.textContent.includes('Boletín'));
        }, button);
        
        if (isInBoeCard) {
          boeTemplateSelectButton = button;
          console.log('Found BOE template Select button');
          break;
        }
      }
    }
    
    if (boeTemplateSelectButton) {
      // Highlight the button before clicking it
      await page.evaluate(button => {
        button.style.border = '3px solid red';
        button.scrollIntoView();
      }, boeTemplateSelectButton);
      
      // Take screenshot with highlighted button
      await page.screenshot({ path: 'boe-button-highlight.png' });
      
      // Click the button and wait for navigation
      console.log('Clicking BOE template Select button...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
          console.log('Navigation timeout after button click, continuing anyway');
        }),
        boeTemplateSelectButton.click()
      ]);
      
      console.log('Clicked BOE template Select button');
    } else {
      // Fallback: try to find a card with BOE in it and click it directly
      console.log('Select button not found, trying to click BOE template card directly...');
      
      const cards = await page.$$('.rounded-lg');
      let boeCard = null;
      
      for (const card of cards) {
        const cardText = await page.evaluate(el => el.textContent.trim(), card);
        if (cardText.includes('BOE') || cardText.includes('Boletín')) {
          boeCard = card;
          console.log('Found BOE template card');
          break;
        }
      }
      
      if (boeCard) {
        // Highlight the card before clicking
        await page.evaluate(card => {
          card.style.border = '3px solid green';
          card.scrollIntoView();
        }, boeCard);
        
        // Take screenshot with highlighted card
        await page.screenshot({ path: 'boe-card-highlight.png' });
        
        // Click the card
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
            console.log('Navigation timeout after card click, continuing anyway');
          }),
          boeCard.click()
        ]);
        
        console.log('Clicked BOE template card');
      } else {
        throw new Error('BOE template card not found');
      }
    }
    
    // Wait for the form page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Check if we're on the subscription form page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take screenshot of current page
    await page.screenshot({ path: 'subscription-form.png' });
    
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
        await page.screenshot({ path: 'subscription-form-filled.png' });
        
        // Select frequency option
        try {
          await page.click('[data-testid="frequency-daily"]');
          console.log('Selected daily frequency option');
          
          // Take screenshot after selecting frequency
          await page.screenshot({ path: 'frequency-selected.png' });
        } catch (frequencyError) {
          console.log('Error selecting frequency:', frequencyError.message);
        }
        
        // Submit the form
        const submitButton = await page.$('[data-testid="subscription-submit-button"]');
        if (submitButton) {
          console.log('Submitting form...');
          
          // Take screenshot before submitting
          await page.screenshot({ path: 'before-submission.png' });
          
          // Scroll to the submit button to ensure it's visible
          await page.evaluate(button => {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, submitButton);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
              console.log('Navigation timeout after submission, continuing anyway');
            }),
            submitButton.click()
          ]);
          
          console.log('Submitted form');
          
          // Take screenshot after submission
          await page.screenshot({ path: 'after-submission.png' });
          
          // Check if we were redirected to subscriptions page (success)
          const finalUrl = page.url();
          console.log('Final URL after submission:', finalUrl);
          
          if (finalUrl.includes('/subscriptions') && !finalUrl.includes('/new/')) {
            console.log('SUCCESS: Subscription created successfully');
            
            // Wait for subscriptions to load and take screenshot
            await new Promise(resolve => setTimeout(resolve, 3000));
            await page.screenshot({ path: 'subscriptions-list.png' });
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
          }
        } else {
          console.log('Submit button not found');
          
          // Check if there's a next or continue button
          const nextButton = await page.$('button:not([type="submit"]):not([aria-label])');
          if (nextButton) {
            const buttonText = await page.evaluate(el => el.textContent.trim(), nextButton);
            console.log(`Found alternative button: "${buttonText}", attempting to click it...`);
            
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
                console.log('Navigation timeout after next button click, continuing anyway');
              }),
              nextButton.click()
            ]);
            
            console.log('Clicked alternative button');
            
            // Take screenshot after clicking next
            await page.screenshot({ path: 'after-next-button.png' });
            
            // Wait a moment and try to find the submit button again
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const finalSubmitButton = await page.$('button[type="submit"]');
            if (finalSubmitButton) {
              console.log('Found submit button on next page, clicking...');
              
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
                  console.log('Navigation timeout after final submission, continuing anyway');
                }),
                finalSubmitButton.click()
              ]);
              
              console.log('Submitted final form');
              
              // Take final screenshot
              await page.screenshot({ path: 'final-submission.png' });
            }
          }
        }
      } catch (formError) {
        console.error('Error filling form:', formError);
        await page.screenshot({ path: 'form-error.png' });
      }
    } else {
      console.log('Failed to navigate to subscription form');
      
      // Take screenshot of the error state
      await page.screenshot({ path: 'navigation-error.png' });
    }
    
    // Wait for 5 seconds before closing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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