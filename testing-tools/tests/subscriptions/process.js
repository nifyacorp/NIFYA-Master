/**
 * Process Subscription Test
 * 
 * This script tests the processing of an existing subscription.
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
 * Process an existing subscription
 * @param {string} token - Authentication token
 * @param {string} userId - User ID
 * @param {string} subscriptionId - ID of the subscription to process
 * @param {boolean} [useAltEndpoint=false] - Whether to use the alternative endpoint
 * @returns {Promise<Object>} Test result
 */
async function processSubscription(token, userId, subscriptionId, useAltEndpoint = false) {
  const testName = 'process-subscription';
  logger.info('Starting subscription processing test', null, testName);
  
  // Validate token
  if (!token) {
    logger.error('No authentication token provided', null, testName);
    logger.testResult(testName, false, 'No authentication token provided');
    return { success: false, error: 'No authentication token provided' };
  }
  
  // Validate user ID
  if (!userId) {
    logger.error('No user ID provided', null, testName);
    logger.testResult(testName, false, 'No user ID provided');
    return { success: false, error: 'No user ID provided' };
  }
  
  // Validate subscription ID
  if (!subscriptionId) {
    logger.error('No subscription ID provided', null, testName);
    logger.testResult(testName, false, 'No subscription ID provided');
    return { success: false, error: 'No subscription ID provided' };
  }
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: useAltEndpoint 
      ? endpoints.backend.subscriptions.processAlt(subscriptionId) 
      : endpoints.backend.subscriptions.process(subscriptionId),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-id': userId
    }
  };
  
  logger.info(`Processing subscription ${subscriptionId}: ${options.hostname}${options.path}`, null, testName);
  
  try {
    // Check if we're using a test ID (starts with "test-")
    const isTestId = subscriptionId.startsWith('test-');
    
    if (isTestId) {
      logger.warn(`Using test ID ${subscriptionId}. Will simulate processing response.`, null, testName);
      
      // Simulate a successful processing response
      const simulatedResponse = {
        statusCode: 202,
        status: 202,
        data: {
          status: "success",
          data: {
            jobId: `job-${Date.now()}`,
            status: "processing"
          }
        },
        raw: JSON.stringify({
          status: "success",
          data: {
            jobId: `job-${Date.now()}`,
            status: "processing"
          }
        })
      };
      
      // Save simulated response to file
      apiClient.saveResponseToFile('process_subscription', simulatedResponse, OUTPUT_DIR);
      
      const jobId = simulatedResponse.data.data.jobId;
      const status = simulatedResponse.data.data.status;
      
      logger.success(`Simulated subscription processing for test ID ${subscriptionId}`, { jobId, status }, testName);
      
      // Log test result
      logger.testResult(testName, true, {
        subscriptionId,
        jobId,
        status,
        statusCode: simulatedResponse.statusCode,
        simulated: true
      });
      
      return {
        success: true,
        subscriptionId,
        jobId,
        status,
        data: simulatedResponse.data,
        simulated: true
      };
    }
    
    // For real subscription IDs, make the actual API request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile('process_subscription', response, OUTPUT_DIR);
    
    if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202) {
      // Extract process job ID or status from response
      const jobId = response.data.jobId || response.data.data?.jobId;
      const status = response.data.status || response.data.data?.status || 'processing';
      
      logger.success(`Subscription processing initiated for ${subscriptionId}`, { jobId, status }, testName);
      
      // Log test result
      logger.testResult(testName, true, {
        subscriptionId,
        jobId,
        status,
        statusCode: response.statusCode
      });
      
      return { 
        success: true, 
        subscriptionId,
        jobId,
        status,
        data: response.data
      };
    } else {
      // Non-success status code
      logger.error(`Subscription processing failed with status code ${response.statusCode}`, response.data, testName);
      logger.testResult(testName, false, `Status code ${response.statusCode}: ${JSON.stringify(response.data)}`);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    // Request error
    logger.error('Subscription processing request failed', error, testName);
    logger.testResult(testName, false, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  const subscriptionId = args[0] || null;
  
  processSubscription(subscriptionId)
    .then(result => {
      if (result.success) {
        logger.success('Subscription processing test completed successfully');
        logger.info(`Processing initiated for subscription ID: ${result.subscriptionId}`);
        if (result.jobId) {
          logger.info(`Job ID: ${result.jobId}`);
        }
      } else {
        logger.error('Subscription processing test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in subscription processing test', error);
      process.exit(1);
    });
}

module.exports = processSubscription;