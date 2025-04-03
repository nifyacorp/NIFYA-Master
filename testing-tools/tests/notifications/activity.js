const { makeApiRequest, loadAuthToken, saveResponseToFile } = require('../../core/api-client');
const logger = require('../../core/logger');
const path = require('path');

async function testNotificationActivity() {
  logger.info('Starting notification activity test');
  
  try {
    const token = loadAuthToken();
    if (!token) {
      logger.error('No authentication token found. Please run auth/test-login.js first.');
      process.exit(1);
    }
    
    logger.info('Fetching notification activity: backend-415554190254.us-central1.run.app/api/v1/notifications/activity');
    
    const response = await makeApiRequest({
      url: 'https://backend-415554190254.us-central1.run.app/api/v1/notifications/activity',
      method: 'GET'
    }, token);
    
    // Save response to file
    saveResponseToFile(
      'notifications_activity', 
      response, 
      path.join(__dirname, '../../outputs/responses')
    );
    
    if (response.status === 200) {
      logger.success(`Retrieved notification activity successfully`);
      logger.success('Test notification-activity: PASSED');
    } else {
      logger.error(`Failed to retrieve notification activity. Status: ${response.status}`);
      logger.error('Test notification-activity: FAILED');
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Error testing notification activity: ${error.message}`);
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    logger.error('Test notification-activity: FAILED');
    process.exit(1);
  }
  
  logger.success('Notification activity test completed');
}

testNotificationActivity();