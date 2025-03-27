/**
 * NIFYA Subscription Processing Script (v1 API Version)
 * 
 * This script processes a specific subscription using the v1 API endpoints.
 */

const fs = require('fs');
const { makeApiRequest, loadAuthToken, saveResponseToFile, appendTestDetails } = require('./api-client');

// Configuration
const config = {
  backend: {
    baseUrl: 'backend-415554190254.us-central1.run.app'
  },
  subscriptionIdFile: './latest_subscription_id.txt',
  outputPrefix: 'process_subscription',
  testDetailsFile: './TEST_DETAILS.txt'
};

// Main function
async function processSubscription(subscriptionId = null) {
  try {
    console.log('[' + new Date().toISOString() + '] Running: Subscription Processing (v1 API)');
    console.log('------------------------------------------------------');

    // Load authentication token
    const token = loadAuthToken();
    if (!token) {
      console.error('No authentication token found. Please run auth-login.js first.');
      appendTestDetails('Subscription Processing v1', false, 'No authentication token available', config.testDetailsFile);
      return false;
    }

    // Get subscription ID from file if not provided
    if (!subscriptionId) {
      try {
        if (fs.existsSync(config.subscriptionIdFile)) {
          subscriptionId = fs.readFileSync(config.subscriptionIdFile, 'utf8').trim();
        }
      } catch (err) {
        console.error('Error reading subscription ID file:', err.message);
      }
    }

    // Check if we have a subscription ID
    if (!subscriptionId) {
      console.error('No subscription ID found or provided. Please create a subscription first.');
      appendTestDetails('Subscription Processing v1', false, 'No subscription ID available', config.testDetailsFile);
      return false;
    }

    console.log(`Processing subscription with ID: ${subscriptionId}`);
    
    // Format the UUID correctly - this helps prevent match errors on malformed UUIDs
    const formattedSubId = subscriptionId.trim().toLowerCase();
    
    // Set up request options with v1 API path
    const options = {
      hostname: config.backend.baseUrl,
      port: 443,
      path: `/api/v1/subscriptions/${formattedSubId}/process`, // v1 API endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add an empty payload to ensure the POST body isn't undefined
    const payload = {
      metadata: {
        client: 'api-test-script',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(`Request URL: https://${options.hostname}${options.path}`);
    console.log('Request payload:', JSON.stringify(payload));
    
    // Make the request
    console.log('Processing request sent, waiting for response...');
    const response = await makeApiRequest(options, token, payload);
    
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
    
    // Save response to files
    console.log('Response received');
    saveResponseToFile(config.outputPrefix, response);
    
    // Additional diagnostic info for error responses
    if (response.statusCode >= 400) {
      console.log('Error response details:');
      console.log(`Raw response: ${response.raw ? response.raw.substring(0, 500) : 'Empty response'}`);
    }
    
    // Handle the response
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('Subscription processing started successfully');
      console.log(`Response: ${JSON.stringify(response.data || {})}`);
      
      appendTestDetails('Subscription Processing v1', true, 
        `Successfully started processing for subscription ${subscriptionId}`, 
        config.testDetailsFile);
      
      return {
        success: true,
        subscriptionId,
        data: response.data
      };
    } else {
      console.log('Subscription processing failed');
      console.log(`Error: ${JSON.stringify(response.data || {})}`);
      
      appendTestDetails('Subscription Processing v1', false, 
        `Failed with status code ${response.statusCode}: ${JSON.stringify(response.data || {})}`, 
        config.testDetailsFile);
      
      return {
        success: false,
        subscriptionId,
        error: response.data || { message: 'Unknown error' }
      };
    }
  } catch (error) {
    console.error('Error processing subscription:', error.message);
    appendTestDetails('Subscription Processing v1', false, 
      `Error: ${error.message}`, 
      config.testDetailsFile);
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    console.log('✅ Subscription Processing test completed');
    console.log('------------------------------------------------------');
  }
}

// Run the script if not imported
if (require.main === module) {
  // Check if a subscription ID was provided as a command line argument
  const subscriptionId = process.argv[2] || 'bbcde7bb-bc04-4a0b-8c47-01682a31cc15';
  
  processSubscription(subscriptionId).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = processSubscription;