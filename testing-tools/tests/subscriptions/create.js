/**
 * Create Subscription Test
 * 
 * This script tests the creation of a new subscription through the backend API.
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directory for response files
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs');
const SUBSCRIPTION_ID_FILE = path.join(OUTPUT_DIR, 'latest_subscription_id.txt');

/**
 * Create a new subscription
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function createSubscription(token = null) {
  const testName = 'create-subscription';
  logger.info('Starting subscription creation test', null, testName);
  
  // Load token if not provided
  if (!token) {
    token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No authentication token available', null, testName);
      logger.testResult(testName, false, 'No authentication token available');
      return { success: false, error: 'No authentication token available' };
    }
  }
  
  // Subscription data
  const subscriptionData = endpoints.testData.boeSubscription;
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.subscriptions.create,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  logger.info(`Creating subscription: ${options.hostname}${options.path}`, subscriptionData, testName);
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token, subscriptionData);
    
    // Save response to file
    apiClient.saveResponseToFile('create_subscription_response', response, OUTPUT_DIR);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      // Extract subscription ID from response - handle multiple possible response structures
      const subscriptionId = response.data.id || 
                            response.data.data?.id || 
                            response.data.data?.subscription?.id ||
                            response.data.subscription?.id;
      
      if (subscriptionId) {
        // Save subscription ID to file
        fs.writeFileSync(SUBSCRIPTION_ID_FILE, subscriptionId);
        logger.success(`Subscription created with ID: ${subscriptionId}`, null, testName);
        
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
        // Log the actual structure of the response for debugging
        logger.warn('Subscription response structure:', { 
          responseStructure: JSON.stringify(response.data, null, 2)
        }, testName);
        
        // Error case: If the response indicates success but has an empty subscription object
        // This is an API issue that should be reported as an error
        if (response.data.status === 'success' && response.data.data?.subscription && 
            Object.keys(response.data.data.subscription).length === 0) {
          
          const errorMessage = 'API returned empty subscription object with success status';
          logger.error(errorMessage, response.data, testName);
          
          // Log test result as failure
          logger.testResult(testName, false, {
            name: subscriptionData.name,
            type: subscriptionData.type,
            statusCode: response.statusCode,
            error: errorMessage,
            responseData: JSON.stringify(response.data)
          });
          
          return { 
            success: false,
            error: errorMessage,
            data: response.data,
            apiIssue: true
          };
        }
        
        // No ID in response or unrecognized structure
        logger.error('Subscription creation failed: No ID found in response', response.data, testName);
        logger.testResult(testName, false, 'No subscription ID in response');
        return { success: false, error: 'No subscription ID in response' };
      }
    } else {
      // Non-success status code
      logger.error(`Subscription creation failed with status code ${response.statusCode}`, response.data, testName);
      logger.testResult(testName, false, `Status code ${response.statusCode}: ${JSON.stringify(response.data)}`);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    // Request error
    logger.error('Subscription creation request failed', error, testName);
    logger.testResult(testName, false, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  createSubscription()
    .then(result => {
      if (result.success) {
        logger.success('Subscription creation test completed successfully');
        logger.info(`Created subscription ID: ${result.subscriptionId}`);
      } else {
        logger.error('Subscription creation test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in subscription creation test', error);
      process.exit(1);
    });
}

module.exports = createSubscription;