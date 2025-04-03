/**
 * Test Script: Check Notification Worker Debug Endpoint
 * 
 * This script tests the debug endpoint we added to the notification worker
 * to view recent notifications with optional filtering.
 */

const axios = require('axios');
const logger = require('../../core/logger');

// Define notification worker URL - try both local and production
const NOTIFICATION_WORKER_URLS = [
  'http://localhost:8085',
  'https://notification-worker-415554190254.uc.run.app'
];

async function testDebugEndpoint() {
  logger.info('Testing notification worker debug endpoint...');
  
  let response = null;
  let successful = false;
  let error = null;
  
  // Try both URLs until one works
  for (const baseUrl of NOTIFICATION_WORKER_URLS) {
    try {
      logger.info(`Trying to connect to ${baseUrl}/debug/notifications`);
      response = await axios.get(`${baseUrl}/debug/notifications?limit=10`);
      successful = true;
      logger.info(`Successfully connected to ${baseUrl}`);
      break;
    } catch (err) {
      error = err;
      logger.warn(`Failed to connect to ${baseUrl}: ${err.message}`);
    }
  }
  
  if (!successful) {
    logger.error('Could not connect to notification worker on any URL');
    console.error('Connection error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
  
  logger.info(`Got response with status: ${response.status}`);
  logger.info(`Found ${response.data.notifications?.length || 0} notifications`);
  
  return {
    success: true,
    status: response.status,
    notifications: response.data.notifications || [],
    pagination: response.data.pagination || {},
    service_state: response.data.service_state || {},
    timestamp: response.data.timestamp
  };
}

// Run the test if executed directly
if (require.main === module) {
  testDebugEndpoint()
    .then(result => {
      console.log('Test result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test failed with error:', err);
      process.exit(1);
    });
} else {
  // Export for use in other tests
  module.exports = testDebugEndpoint;
}