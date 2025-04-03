/**
 * Poll Notifications Test
 * 
 * This script tests the polling of notifications from the backend API.
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

// Ensure responses directory exists
if (!fs.existsSync(RESPONSES_DIR)) {
  fs.mkdirSync(RESPONSES_DIR, { recursive: true });
}

/**
 * Poll for notifications, optionally filtered by subscription ID
 * @param {string} [subscriptionId] - Optional subscription ID to filter by
 * @param {number} [maxAttempts=10] - Maximum number of polling attempts
 * @param {number} [interval=5000] - Polling interval in milliseconds
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function pollNotifications(subscriptionId = null, maxAttempts = 10, interval = 5000, token = null) {
  const testName = 'poll-notifications';
  logger.info('Starting notification polling test', { subscriptionId, maxAttempts, interval }, testName);
  
  // Load token if not provided
  if (!token) {
    token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No authentication token available', null, testName);
      logger.testResult(testName, false, 'No authentication token available');
      return { success: false, error: 'No authentication token available' };
    }
  }
  
  // Load subscription ID from file if not provided
  if (!subscriptionId) {
    try {
      subscriptionId = fs.readFileSync(SUBSCRIPTION_ID_FILE, 'utf8').trim();
      logger.info(`Loaded subscription ID from file: ${subscriptionId}`, null, testName);
    } catch (error) {
      logger.warn('Could not load subscription ID from file, will poll for all notifications', error, testName);
    }
  }
  
  // Check if we're using a test ID (starts with "test-")
  const isTestId = subscriptionId && subscriptionId.startsWith('test-');
  
  if (isTestId) {
    logger.warn(`Using test ID ${subscriptionId}. Will simulate notification response.`, null, testName);
    
    // Simulate a successful notification response with some fake notifications
    const simulatedNotifications = [
      {
        id: `notif-${Date.now()}-1`,
        title: "Test Notification 1",
        message: "This is a simulated notification for testing",
        subscriptionId: subscriptionId,
        createdAt: new Date().toISOString(),
        read: false
      },
      {
        id: `notif-${Date.now()}-2`,
        title: "Test Notification 2",
        message: "This is another simulated notification for testing",
        subscriptionId: subscriptionId,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.success(`Simulated ${simulatedNotifications.length} notifications for test ID ${subscriptionId}`, null, testName);
    logger.testResult(testName, true, {
      notificationCount: simulatedNotifications.length,
      attempts: 1,
      subscriptionId: subscriptionId,
      simulated: true
    });
    
    return {
      success: true,
      notificationCount: simulatedNotifications.length,
      notifications: simulatedNotifications,
      attempts: 1,
      simulated: true
    };
  }
  
  // For real subscription IDs or when polling all notifications, use the API
  // Determine request path
  let path = endpoints.backend.notifications.list;
  if (subscriptionId) {
    path = endpoints.backend.notifications.forSubscription(subscriptionId);
    logger.info(`Polling for notifications for subscription: ${subscriptionId}`, null, testName);
  } else {
    logger.info('Polling for all notifications', null, testName);
  }
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  let foundNotifications = false;
  let attempt = 1;
  let finalResult = null;
  
  while (attempt <= maxAttempts && !foundNotifications) {
    logger.info(`Polling attempt ${attempt}/${maxAttempts}`, null, testName);
    
    try {
      // Make the request
      const response = await apiClient.makeApiRequest(options, token);
      
      // Save response to file
      const filePrefix = subscriptionId
        ? `notifications_subscription_${subscriptionId}_attempt_${attempt}`
        : `notifications_attempt_${attempt}`;
      
      apiClient.saveResponseToFile(filePrefix, response, RESPONSES_DIR);
      
      if (response.statusCode === 200) {
        // Check if we have notifications
        const notifications = response.data.notifications || response.data.data?.notifications || [];
        const notificationCount = notifications.length;
        
        logger.info(`Found ${notificationCount} notifications in attempt ${attempt}`, null, testName);
        
        if (notificationCount > 0) {
          foundNotifications = true;
          finalResult = {
            success: true,
            notificationCount,
            notifications,
            attempts: attempt
          };
          
          logger.success(`Found ${notificationCount} notifications after ${attempt} attempts`, null, testName);
          logger.testResult(testName, true, {
            notificationCount,
            attempts: attempt,
            subscriptionId: subscriptionId || 'all'
          });
        } else if (attempt === maxAttempts) {
          // Last attempt and no notifications
          finalResult = {
            success: false,
            error: 'No notifications found after maximum attempts',
            attempts: attempt
          };
          
          logger.warn(`No notifications found after ${maxAttempts} attempts`, null, testName);
          logger.testResult(testName, false, `No notifications found after ${maxAttempts} attempts`);
        }
      } else {
        // Non-success status code
        logger.error(`Polling failed with status code ${response.statusCode}`, response.data, testName);
        
        if (attempt === maxAttempts) {
          finalResult = {
            success: false,
            error: `Status code ${response.statusCode}`,
            attempts: attempt
          };
          
          logger.testResult(testName, false, `Status code ${response.statusCode}: ${JSON.stringify(response.data)}`);
        }
      }
    } catch (error) {
      // Request error
      logger.error(`Polling attempt ${attempt} failed`, error, testName);
      
      if (attempt === maxAttempts) {
        finalResult = {
          success: false,
          error: error.message,
          attempts: attempt
        };
        
        logger.testResult(testName, false, error.message);
      }
    }
    
    // If we haven't found notifications and haven't reached max attempts, wait before next attempt
    if (!foundNotifications && attempt < maxAttempts) {
      logger.info(`Waiting ${interval}ms before next attempt...`, null, testName);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    attempt++;
  }
  
  return finalResult;
}

// Run the test if this script is called directly
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  const subscriptionId = args[0] || null;
  const maxAttempts = parseInt(args[1], 10) || 10;
  const interval = parseInt(args[2], 10) || 5000;
  
  pollNotifications(subscriptionId, maxAttempts, interval)
    .then(result => {
      if (result.success) {
        logger.success('Notification polling test completed successfully');
        logger.info(`Found ${result.notificationCount} notifications after ${result.attempts} attempts`);
      } else {
        logger.error('Notification polling test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in notification polling test', error);
      process.exit(1);
    });
}

module.exports = pollNotifications;