/**
 * Temporary Subscription Format Test
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('./core/api-client');
const logger = require('./core/logger');
const endpoints = require('./config/endpoints');

// Load token
const token = apiClient.loadAuthToken();
const userId = apiClient.getUserIdFromToken(token);

// Test different formats
async function testSubscriptionFormat() {
  // Format 1: array of strings
  const format1 = {
    name: "Test BOE Subscription Format 1",
    type: "boe",
    templateId: "boe-default",
    prompts: ["Test Barcelona licitaciones"],
    frequency: "daily",
    configuration: {},
    logo: null
  };

  // Format 2: single string
  const format2 = {
    name: "Test BOE Subscription Format 2",
    type: "boe",
    templateId: "boe-default",
    prompts: "Test Barcelona licitaciones",
    frequency: "daily",
    configuration: {},
    logo: null
  };

  // Format 3: object with value property
  const format3 = {
    name: "Test BOE Subscription Format 3",
    type: "boe",
    templateId: "boe-default",
    prompts: { value: "Test Barcelona licitaciones" },
    frequency: "daily",
    configuration: {},
    logo: null
  };

  // Format 4: array of objects with value property
  const format4 = {
    name: "Test BOE Subscription Format 4",
    type: "boe",
    templateId: "boe-default",
    prompts: [{ value: "Test Barcelona licitaciones" }],
    frequency: "daily",
    configuration: {},
    logo: null
  };

  // Common request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.subscriptions.create,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-id': userId
    }
  };

  // Test each format
  logger.info('Testing Format 1: Array of strings');
  try {
    const response1 = await apiClient.makeApiRequest(options, token, format1);
    logger.info(`Format 1 response code: ${response1.statusCode}`);
    logger.info(`Format 1 response data:`, response1.data);
  } catch (error) {
    logger.error('Format 1 error:', error);
  }

  logger.info('Testing Format 2: Single string');
  try {
    const response2 = await apiClient.makeApiRequest(options, token, format2);
    logger.info(`Format 2 response code: ${response2.statusCode}`);
    logger.info(`Format 2 response data:`, response2.data);
  } catch (error) {
    logger.error('Format 2 error:', error);
  }

  logger.info('Testing Format 3: Object with value property');
  try {
    const response3 = await apiClient.makeApiRequest(options, token, format3);
    logger.info(`Format 3 response code: ${response3.statusCode}`);
    logger.info(`Format 3 response data:`, response3.data);
  } catch (error) {
    logger.error('Format 3 error:', error);
  }

  logger.info('Testing Format 4: Array of objects with value property');
  try {
    const response4 = await apiClient.makeApiRequest(options, token, format4);
    logger.info(`Format 4 response code: ${response4.statusCode}`);
    logger.info(`Format 4 response data:`, response4.data);
  } catch (error) {
    logger.error('Format 4 error:', error);
  }
}

// Run the test
testSubscriptionFormat()
  .then(() => {
    logger.success('Format test completed');
  })
  .catch(error => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });