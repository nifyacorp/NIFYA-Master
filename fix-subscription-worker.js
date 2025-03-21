/**
 * NIFYA Subscription Worker Fix
 * 
 * This script identifies and fixes issues in the subscription worker
 * related to handling different formats of prompt data from the frontend.
 */

const fs = require('fs');
const path = require('path');

// Path to the subscription worker file that needs fixing
const subscriptionIndexPath = path.join(__dirname, 'subscription-worker', 'src', 'services', 'subscription', 'index.js');
const boeProcessorPath = path.join(__dirname, 'subscription-worker', 'src', 'services', 'processors', 'boe.js');

// Read the current file content
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
};

// Write the updated content
const writeFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    return false;
  }
};

// Fix the subscription processor's handling of prompts
const fixSubscriptionProcessor = () => {
  console.log(`Fixing subscription processor in ${subscriptionIndexPath}...`);
  
  const content = readFile(subscriptionIndexPath);
  if (!content) return false;
  
  // 1. Add a helper function to normalize prompts to ensure consistent format
  const withNormalizeFunction = content.replace(
    /class SubscriptionProcessor \{/,
    `class SubscriptionProcessor {
  /**
   * Normalize prompts to ensure they are in the correct format
   * @param {any} prompts - Prompts that could be string, array, or JSON string
   * @returns {string[]} - Normalized array of prompt strings
   */
  normalizePrompts(prompts) {
    if (!prompts) return [];
    
    if (Array.isArray(prompts)) {
      return prompts.filter(p => typeof p === 'string' && p.trim());
    }
    
    if (typeof prompts === 'string') {
      // Try to parse as JSON if it looks like an array
      if (prompts.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(prompts);
          if (Array.isArray(parsed)) {
            return parsed.filter(p => typeof p === 'string' && p.trim());
          }
        } catch (e) {
          // Not valid JSON, treat as single prompt
        }
      }
      
      // Single prompt string
      return [prompts.trim()];
    }
    
    return [];
  }
  `
  );
  
  // 2. Update how prompts are processed in the processSubscription method
  const withImprovedPromptsHandling = withNormalizeFunction.replace(
    // Find where we set prompts in the subscription data
    /if \(Array\.isArray\(subscription\.prompts\)\) \{\s+subscriptionData\.prompts = subscription\.prompts;[^}]+\}/s,
    `// Normalize prompts regardless of the format they come in
    subscriptionData.prompts = this.normalizePrompts(subscription.prompts);
    
    logger.debug('Normalized prompts for processing', {
      subscription_id: subscriptionId,
      original_prompts_type: typeof subscription.prompts,
      original_is_array: Array.isArray(subscription.prompts),
      normalized_prompts: subscriptionData.prompts,
      normalized_count: subscriptionData.prompts.length
    });`
  );
  
  // Also update the metadata section to use the normalize function
  const withMetadataFix = withImprovedPromptsHandling.replace(
    /if \(subscription\.metadata && subscription\.metadata\.prompts\) \{\s+subscriptionData\.prompts = subscription\.metadata\.prompts;[^}]+\}/s,
    `// Only use metadata.prompts if we don't already have prompts and they exist in metadata
    if (!subscriptionData.prompts.length && subscription.metadata && subscription.metadata.prompts) {
      subscriptionData.prompts = this.normalizePrompts(subscription.metadata.prompts);
      
      logger.debug('Using prompts from metadata', {
        subscription_id: subscriptionId,
        metadata_prompts_type: typeof subscription.metadata.prompts,
        metadata_is_array: Array.isArray(subscription.metadata.prompts),
        normalized_prompts: subscriptionData.prompts,
        normalized_count: subscriptionData.prompts.length
      });
    }`
  );
  
  return writeFile(subscriptionIndexPath, withMetadataFix);
};

// Fix the BOE processor to better handle prompts
const fixBoeProcessor = () => {
  console.log(`Fixing BOE processor in ${boeProcessorPath}...`);
  
  const content = readFile(boeProcessorPath);
  if (!content) return false;
  
  // Improve how BOE processor handles prompts
  const updated = content.replace(
    /const prompts = validSubscription\.prompts \|\| \[\];/,
    `// Normalize prompts to ensure consistent format
    let prompts = [];
    
    if (validSubscription.prompts) {
      // Handle different formats of prompts
      if (Array.isArray(validSubscription.prompts)) {
        prompts = validSubscription.prompts.filter(p => typeof p === 'string' && p.trim());
      } else if (typeof validSubscription.prompts === 'string') {
        // Try to parse as JSON if it looks like an array
        if (validSubscription.prompts.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(validSubscription.prompts);
            if (Array.isArray(parsed)) {
              prompts = parsed.filter(p => typeof p === 'string' && p.trim());
            } else {
              prompts = [validSubscription.prompts];
            }
          } catch (e) {
            // Not valid JSON, treat as single prompt
            prompts = [validSubscription.prompts];
          }
        } else {
          // Single prompt string
          prompts = [validSubscription.prompts.trim()];
        }
      }
    }
    
    this.logger.debug('Normalized prompts for BOE processing', {
      subscription_id: validSubscription.subscription_id,
      original_prompts: validSubscription.prompts,
      normalized_prompts: prompts,
      normalized_count: prompts.length
    });`
  );
  
  return writeFile(boeProcessorPath, updated);
};

// Run the fixes
console.log('Starting subscription worker fixes...');

let success = true;
if (!fixSubscriptionProcessor()) success = false;
if (!fixBoeProcessor()) success = false;

if (success) {
  console.log('\n✅ All worker fixes applied successfully!');
  console.log('The subscription worker should now handle prompts correctly.');
} else {
  console.log('\n⚠️ Some fixes could not be applied. Please check the errors above.');
}

// Instructions for manual verification
console.log(`
To deploy the fixes:
1. Build and deploy the subscription-worker service
2. Test by creating a subscription with the BOE General template
3. Monitor the logs to ensure prompts are being correctly processed
`); 