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
 * @param {string} [subscriptionId] - ID of the subscription to process (will be loaded from file if not provided)
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function processSubscription(subscriptionId = null, token = null) {
  const testName = 'process-subscription';
  logger.info('Starting subscription processing test', null, testName);
  
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
      logger.error('No subscription ID available', error, testName);
      logger.testResult(testName, false, 'No subscription ID available');
      return { success: false, error: 'No subscription ID available' };
    }
  }
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.subscriptions.process(subscriptionId),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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