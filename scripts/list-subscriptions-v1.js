/**
 * NIFYA Subscription Listing Script (v1 API Version)
 * 
 * This script lists all user subscriptions using the v1 API endpoints.
 */

const { makeApiRequest, loadAuthToken, saveResponseToFile, appendTestDetails } = require('./api-client');

// Configuration
const config = {
  backend: {
    baseUrl: 'backend-415554190254.us-central1.run.app'
  },
  outputPrefix: 'subscriptions',
  testDetailsFile: './TEST_DETAILS.txt'
};

// Main function
async function listSubscriptions() {
  try {
    console.log('[' + new Date().toISOString() + '] Running: Subscription Listing (v1 API)');
    console.log('------------------------------------------------------');

    // Load authentication token
    const token = loadAuthToken();
    if (!token) {
      console.error('No authentication token found. Please run auth-login.js first.');
      appendTestDetails('Subscription Listing v1', false, 'No authentication token available', config.testDetailsFile);
      return false;
    }

    console.log('Fetching user subscriptions...');
    
    // Set up request options with v1 API path
    const options = {
      hostname: config.backend.baseUrl,
      port: 443,
      path: '/api/v1/subscriptions', // v1 API endpoint
      method: 'GET'
    };
    
    console.log(`Request URL: https://${options.hostname}${options.path}`);
    
    // Make the request
    console.log('Subscriptions request sent, waiting for response...');
    const response = await makeApiRequest(options, token);
    
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
    
    // Save response to files
    console.log('Response received');
    saveResponseToFile(config.outputPrefix, response);
    
    // Handle the response
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Extract subscription data based on response structure
      const subscriptions = response.data.data?.subscriptions || 
                            response.data.subscriptions || 
                            response.data.data || 
                            [];
      
      if (Array.isArray(subscriptions) && subscriptions.length > 0) {
        console.log(`Found ${subscriptions.length} subscriptions.`);
        subscriptions.forEach((sub, index) => {
          console.log(`${index + 1}. ${sub.name} (${sub.id}) - Type: ${sub.type}`);
        });
        
        appendTestDetails('Subscription Listing v1', true, 
          `Successfully retrieved ${subscriptions.length} subscriptions.`, 
          config.testDetailsFile);
        
        return true;
      } else {
        console.log('No subscriptions found for this user.');
        appendTestDetails('Subscription Listing v1', true, 
          'No subscriptions found for this user.', 
          config.testDetailsFile);
        
        return true;
      }
    } else {
      console.log('Subscription listing failed.');
      console.log(`Error: ${JSON.stringify(response.data || {})}`);
      
      appendTestDetails('Subscription Listing v1', false, 
        `Failed with status code ${response.statusCode}: ${JSON.stringify(response.data || {})}`, 
        config.testDetailsFile);
      
      return false;
    }
  } catch (error) {
    console.error('Error fetching subscriptions:', error.message);
    appendTestDetails('Subscription Listing v1', false, 
      `Error: ${error.message}`, 
      config.testDetailsFile);
    
    return false;
  } finally {
    console.log('✅ Subscription Listing test completed');
    console.log('------------------------------------------------------');
  }
}

// Run the script if not imported
if (require.main === module) {
  listSubscriptions().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = listSubscriptions;