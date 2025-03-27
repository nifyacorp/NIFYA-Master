/**
 * NIFYA Notification Polling Script (v1 API Version)
 * 
 * This script polls for notifications related to a subscription using the v1 API endpoints.
 */

const fs = require('fs');
const { makeApiRequest, loadAuthToken, saveResponseToFile, appendTestDetails } = require('./api-client');

// Configuration
const config = {
  backend: {
    baseUrl: 'backend-415554190254.us-central1.run.app'
  },
  subscriptionIdFile: './latest_subscription_id.txt',
  outputPrefix: 'notifications_v1',
  pollInterval: 5000, // 5 seconds
  maxPolls: 10,
  testDetailsFile: './TEST_DETAILS.txt'
};

// Main function
async function pollNotifications(subscriptionId = null) {
  try {
    console.log('[' + new Date().toISOString() + '] Running: Notification Polling (v1 API)');
    console.log('------------------------------------------------------');

    // Load authentication token
    const token = loadAuthToken();
    if (!token) {
      console.error('No authentication token found. Please run auth-login.js first.');
      appendTestDetails('Notification Polling v1', false, 'No authentication token available', config.testDetailsFile);
      return false;
    }

    // Get subscription ID from file if not provided
    if (!subscriptionId) {
      try {
        if (fs.existsSync(config.subscriptionIdFile)) {
          subscriptionId = fs.readFileSync(config.subscriptionIdFile, 'utf8').trim();
          console.log(`Using subscription ID: ${subscriptionId}`);
        }
      } catch (err) {
        console.error('Error reading subscription ID file:', err.message);
      }
    }

    // Check if we have a subscription ID
    if (!subscriptionId) {
      console.log('No subscription ID found. Will poll for all notifications.');
    }

    console.log(`Will poll for notifications ${config.maxPolls} times with ${config.pollInterval/1000} second intervals`);
    
    // Polling loop
    let foundNotifications = false;
    let notificationData = null;
    
    for (let attempt = 1; attempt <= config.maxPolls; attempt++) {
      console.log(`Polling attempt ${attempt} of ${config.maxPolls}...`);
      
      // Set up request options with v1 API path
      const queryParams = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
      const options = {
        hostname: config.backend.baseUrl,
        port: 443,
        path: `/api/v1/notifications${queryParams}`, // v1 API endpoint
        method: 'GET'
      };
      
      console.log(`Request URL: https://${options.hostname}${options.path}`);
      
      // Make the request
      const response = await makeApiRequest(options, token);
      
      console.log(`Status Code: ${response.statusCode}`);
      
      // Save response to files
      const attemptPrefix = `${config.outputPrefix}_attempt_${attempt}`;
      saveResponseToFile(attemptPrefix, response);
      
      // Check for successful response with notifications
      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Extract notifications based on response structure
        const notifications = response.data.data?.notifications || 
                              response.data.notifications || 
                              response.data.data || 
                              [];
        
        console.log(`Found ${notifications.length} notifications.`);
        
        if (Array.isArray(notifications) && notifications.length > 0) {
          console.log('Notifications found! Displaying details:');
          notifications.forEach((notification, index) => {
            console.log(`${index + 1}. ${notification.title || 'Untitled'}`);
          });
          
          foundNotifications = true;
          notificationData = notifications;
          break;
        }
      } else {
        console.log(`Error: ${JSON.stringify(response.data || {})}`);
      }
      
      // Wait before next poll if we haven't found notifications yet
      if (attempt < config.maxPolls && !foundNotifications) {
        console.log(`No notifications found. Waiting ${config.pollInterval/1000} seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, config.pollInterval));
      }
    }
    
    // Final result
    if (foundNotifications) {
      console.log('Polling completed successfully with notifications found.');
      
      appendTestDetails('Notification Polling v1', true, 
        `Found ${notificationData.length} notifications for subscription ${subscriptionId || 'all'}`, 
        config.testDetailsFile);
      
      return {
        success: true,
        notifications: notificationData
      };
    } else {
      console.log('Max polling attempts reached without finding notifications.');
      
      appendTestDetails('Notification Polling v1', true, 
        `No notifications found after ${config.maxPolls} attempts for subscription ${subscriptionId || 'all'}`, 
        config.testDetailsFile);
      
      return {
        success: false,
        message: 'No notifications found'
      };
    }
  } catch (error) {
    console.error('Error polling notifications:', error.message);
    appendTestDetails('Notification Polling v1', false, 
      `Error: ${error.message}`, 
      config.testDetailsFile);
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    console.log('✅ Notification Polling test completed');
    console.log('------------------------------------------------------');
  }
}

// Run the script if not imported
if (require.main === module) {
  // Check if a subscription ID was provided as a command line argument
  const subscriptionId = process.argv[2] || 'bbcde7bb-bc04-4a0b-8c47-01682a31cc15';
  
  pollNotifications(subscriptionId).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = pollNotifications;