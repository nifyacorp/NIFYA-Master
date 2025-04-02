/**
 * Basic Notification Listing Test
 * 
 * This script tests retrieving notifications without any parameters.
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
 * List notifications with no parameters
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function listNotifications(token = null) {
  const testName = 'basic-list-notifications';
  logger.info('Starting basic notification listing test', null, testName);
  
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
    path: '/api/v1/notifications',  // Use the v1 path
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  logger.info(`Fetching notifications: ${options.hostname}${options.path}`, null, testName);
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile('basic_notifications', response, RESPONSES_DIR);
    
    if (response.statusCode === 200) {
      // Extract notifications from response
      const notifications = response.data.notifications || response.data.data?.notifications || [];
      
      logger.success(`Retrieved ${notifications.length} notifications`, null, testName);
      
      // Log test result
      logger.testResult(testName, true, {
        count: notifications.length,
        statusCode: response.statusCode
      });
      
      return { 
        success: true, 
        count: notifications.length,
        notifications,
        data: response.data
      };
    } else {
      // Non-success status code
      logger.error(`Notification listing failed with status code ${response.statusCode}`, response.data, testName);
      logger.testResult(testName, false, `Status code ${response.statusCode}: ${JSON.stringify(response.data)}`);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    // Request error
    logger.error('Notification listing request failed', error, testName);
    logger.testResult(testName, false, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  listNotifications()
    .then(result => {
      if (result.success) {
        logger.success('Notification listing test completed successfully');
        logger.info(`Retrieved ${result.count} notifications`);
      } else {
        logger.error('Notification listing test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in notification listing test', error);
      process.exit(1);
    });
}

module.exports = listNotifications;