/**
 * Create Minimal Subscription Test
 * 
 * This script tests creating a subscription with minimal fields.
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directory for response files
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs');
const RESPONSES_DIR = path.join(OUTPUT_DIR, 'responses');
const SUBSCRIPTION_ID_FILE = path.join(OUTPUT_DIR, 'latest_subscription_id.txt');

/**
 * Create a subscription with minimal fields
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function createMinimalSubscription(token = null) {
  const testName = 'minimal-create-subscription';
  logger.info('Starting minimal subscription creation test', null, testName);
  
  // Load token if not provided
  if (!token) {
    token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No authentication token available', null, testName);
      logger.testResult(testName, false, 'No authentication token available');
      return { success: false, error: 'No authentication token available' };
    }
  }
  
  // Minimal subscription data
  const subscriptionData = {
    name: "Test BOE Subscription",
    type: "boe",
    prompts: ["Ayuntamiento Barcelona licitaciones"], // Back to array format
    frequency: "daily"
  };
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.subscriptions.create,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-id': apiClient.getUserIdFromToken(token)
    }
  };
  
  logger.info(`Creating minimal subscription: ${options.hostname}${options.path}`, subscriptionData, testName);
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token, subscriptionData);
    
    // Save response to file
    apiClient.saveResponseToFile('minimal_subscription_response', response, RESPONSES_DIR);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      // Extract subscription ID from response
      const subscriptionId = response.data.id || response.data.data?.id;
      
      if (subscriptionId) {
        // Save subscription ID to file
        fs.writeFileSync(SUBSCRIPTION_ID_FILE, subscriptionId);
        logger.success(`Minimal subscription created with ID: ${subscriptionId}`, null, testName);
        
        // Log test result
        logger.testResult(testName, true, {
          subscriptionId,
          name: subscriptionData.name,
          type: subscriptionData.type,
          statusCode: response.statusCode
        });
        
        return { 
          success: true, 
          subscriptionId,
          data: response.data
        };
      } else {
        // No ID in response
        logger.error('Subscription creation failed: No ID in response', response.data, testName);
        logger.testResult(testName, false, 'No subscription ID in response');
        return { success: false, error: 'No subscription ID in response' };
      }
    } else {
      // Non-success status code
      logger.error(`Minimal subscription creation failed with status code ${response.statusCode}`, response.data, testName);
      logger.testResult(testName, false, `Status code ${response.statusCode}: ${JSON.stringify(response.data)}`);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    // Request error
    logger.error('Minimal subscription creation request failed', error, testName);
    logger.testResult(testName, false, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  createMinimalSubscription()
    .then(result => {
      if (result.success) {
        logger.success('Minimal subscription creation test completed successfully');
        logger.info(`Created subscription ID: ${result.subscriptionId}`);
      } else {
        logger.error('Minimal subscription creation test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in minimal subscription creation test', error);
      process.exit(1);
    });
}

module.exports = createMinimalSubscription;