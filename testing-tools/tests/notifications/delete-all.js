/**
 * Notification Delete All Test
 * 
 * This script tests the DELETE /notifications/delete-all endpoint
 * which deletes all notifications for the current user.
 */

const fs = require('fs').promises;
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const testAuth = require('../auth/login');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../../outputs');
const RESPONSE_DIR = path.join(OUTPUT_DIR, 'notification-tests');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
}

/**
 * Tests the delete all notifications endpoint
 * @returns {Promise<Object>} Test result object
 */
async function testDeleteAllNotifications() {
  const testName = 'delete-all-notifications';
  logger.info('Starting delete all notifications test', null, testName);
  
  try {
    // Step 1: Authenticate
    logger.info('Authenticating user...', null, testName);
    const authResult = await testAuth();
    
    if (!authResult.success) {
      logger.error('Authentication failed', authResult.error, testName);
      return { success: false, error: 'Authentication failed: ' + authResult.error };
    }
    
    const token = authResult.token;
    const userId = authResult.userId;
    
    // Step 2: Get initial notification count
    const initialCountOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.list}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Getting initial notification count...', null, testName);
    const initialCountResponse = await apiClient.makeApiRequest(initialCountOptions);
    await ensureDirectories();
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'initial_notifications.json'),
      JSON.stringify(initialCountResponse.data, null, 2)
    );
    
    // Extract notification count from the response
    let initialCount = 0;
    if (initialCountResponse.data?.data?.notifications) {
      initialCount = initialCountResponse.data.data.notifications.length;
    } else if (initialCountResponse.data?.data) {
      initialCount = initialCountResponse.data.data.length;
    } else if (initialCountResponse.data?.notifications) {
      initialCount = initialCountResponse.data.notifications.length;
    } else if (Array.isArray(initialCountResponse.data)) {
      initialCount = initialCountResponse.data.length;
    }
    
    logger.info(`Initial notification count: ${initialCount}`, null, testName);
    
    // Step 3: Delete all notifications
    const deleteAllOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.deleteAll}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Deleting all notifications...', null, testName);
    const deleteResponse = await apiClient.makeApiRequest(deleteAllOptions);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'delete_all_response.json'),
      JSON.stringify(deleteResponse.data, null, 2)
    );
    
    // Check if delete was successful
    const deleteSuccess = deleteResponse.status >= 200 && deleteResponse.status < 300;
    if (!deleteSuccess) {
      logger.error('Failed to delete all notifications', deleteResponse.data, testName);
      return {
        success: false,
        error: `Failed to delete all notifications: ${deleteResponse.status}`,
        response: deleteResponse.data
      };
    }
    
    logger.success('Successfully deleted all notifications', null, testName);
    
    // Step 4: Verify notifications were deleted
    const verifyOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.list}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Verifying notifications were deleted...', null, testName);
    const verifyResponse = await apiClient.makeApiRequest(verifyOptions);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'verify_notifications_after_delete.json'),
      JSON.stringify(verifyResponse.data, null, 2)
    );
    
    // Extract notification count from the response
    let finalCount = 0;
    if (verifyResponse.data?.data?.notifications) {
      finalCount = verifyResponse.data.data.notifications.length;
    } else if (verifyResponse.data?.data) {
      finalCount = verifyResponse.data.data.length;
    } else if (verifyResponse.data?.notifications) {
      finalCount = verifyResponse.data.notifications.length;
    } else if (Array.isArray(verifyResponse.data)) {
      finalCount = verifyResponse.data.length;
    }
    
    logger.info(`Final notification count: ${finalCount}`, null, testName);
    
    // If we had notifications before and now we have none, or we had none to begin with, the test passed
    const testPassed = initialCount > 0 ? finalCount === 0 : true;
    
    if (testPassed) {
      logger.success('Delete all notifications test passed', null, testName);
      return {
        success: true,
        details: {
          initialCount,
          finalCount,
          deleteResponse: deleteResponse.data
        }
      };
    } else {
      logger.error('Delete all notifications test failed - notifications still exist', null, testName);
      return {
        success: false,
        error: 'Notifications still exist after deletion',
        details: {
          initialCount,
          finalCount
        }
      };
    }
  } catch (error) {
    logger.error('Error during delete all notifications test', error, testName);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testDeleteAllNotifications()
    .then(result => {
      if (result.success) {
        logger.success('Delete all notifications test completed successfully');
        process.exit(0);
      } else {
        logger.error('Delete all notifications test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in delete all notifications test', error);
      process.exit(1);
    });
}

module.exports = testDeleteAllNotifications;