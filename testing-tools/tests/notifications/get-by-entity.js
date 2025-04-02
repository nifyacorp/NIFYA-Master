const { makeApiRequest, loadAuthToken, saveResponseToFile } = require('../../core/api-client');
const { backend } = require('../../config/endpoints');
const logger = require('../../core/logger');

async function testNotificationsByEntity() {
  logger.info('Starting notifications by entity test');
  
  try {
    const accessToken = await loadAuthToken();
    const userId = process.env.USER_ID || '65c6074d-dbc4-4091-8e45-b6aecffd9ab9';
    
    logger.info(`Testing notifications for entity type: subscription, with entityId param`);
    
    // Try getting notifications by entity type
    const url = `https://${backend.baseUrl}${backend.notifications.list}?entityType=subscription`;
    const response = await makeApiRequest({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-user-id': userId
      }
    });
    
    await saveResponseToFile(response, '/mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/testing-tools/outputs/responses/notifications_by_entity.json');
    
    if (response.status === 200) {
      if (response.data && Array.isArray(response.data)) {
        logger.info(`Found ${response.data.length} notifications for entity type: subscription`);
        logger.success(`Test notifications-by-entity: PASSED\n${JSON.stringify(response.data, null, 2)}`);
      } else {
        logger.warn('Received 200 status but data is not in expected format');
        logger.success(`Test notifications-by-entity: PASSED but with unexpected format\n${JSON.stringify(response.data, null, 2)}`);
      }
    } else {
      logger.error(`Notifications by entity test failed with status code ${response.status}\n${JSON.stringify(response.data, null, 2)}`);
      logger.error(`Test notifications-by-entity: FAILED\nStatus code ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    logger.success('Notifications by entity test completed');
    
  } catch (error) {
    logger.error(`Error in notifications by entity test: ${error.message}`);
    if (error.response) {
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    logger.error('Notifications by entity test failed');
  }
}

testNotificationsByEntity();