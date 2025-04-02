/**
 * List Subscriptions Test
 * 
 * This script tests listing all subscriptions for the authenticated user.
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directory for response files
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs');
const RESPONSES_DIR = path.join(OUTPUT_DIR, 'responses');

/**
 * List all subscriptions for the authenticated user
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function listSubscriptions(token = null) {
  const testName = 'list-subscriptions';
  logger.info('Starting list subscriptions test', null, testName);
  
  // Load token if not provided
  if (!token) {
    token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No authentication token available', null, testName);
      logger.testResult(testName, false, 'No authentication token available');
      return { success: false, error: 'No authentication token available' };
    }
  }
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.subscriptions.list,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  logger.info(`Fetching subscriptions: ${options.hostname}${options.path}`, null, testName);
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile('subscriptions_response', response, RESPONSES_DIR);
    
    // Check for successful response (either by statusCode or status field in data)
    if (response.statusCode === 200 || response.data?.status === 'success') {
      // Extract subscriptions from response - check both possible formats
      const subscriptions = response.data.subscriptions || response.data.data?.subscriptions || [];
      
      logger.success(`Retrieved ${subscriptions.length} subscriptions`, null, testName);
      
      // Log test result
      logger.testResult(testName, true, {
        count: subscriptions.length,
        statusCode: response.statusCode || response.status
      });
      
      return { 
        success: true, 
        count: subscriptions.length,
        subscriptions,
        data: response.data
      };
    } else {
      // Non-success status code
      logger.error(`Subscription listing failed with status code ${response.statusCode || 'undefined'}`, response.data, testName);
      logger.testResult(testName, false, `Status code ${response.statusCode || 'undefined'}: ${JSON.stringify(response.data)}`);
      return { success: false, error: `Status code ${response.statusCode || 'undefined'}` };
    }
  } catch (error) {
    // Request error
    logger.error('Subscription listing request failed', error, testName);
    logger.testResult(testName, false, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  listSubscriptions()
    .then(result => {
      if (result.success) {
        logger.success('Subscription listing test completed successfully');
        logger.info(`Retrieved ${result.count} subscriptions`);
      } else {
        logger.error('Subscription listing test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in subscription listing test', error);
      process.exit(1);
    });
}

module.exports = listSubscriptions;