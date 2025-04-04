/**
 * Subscription Debug Filter Test
 * 
 * This script tests the new diagnostic endpoint for subscription filtering
 * which exposes how query parameters are being parsed and interpreted.
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directories
const OUTPUT_DIR = path.join(__dirname, '../../outputs');
const RESPONSES_DIR = path.join(OUTPUT_DIR, 'responses');

/**
 * Test the subscription debug-filter endpoint with various query parameters
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function testDebugFilter(token = null) {
  const testName = 'subscription-debug-filter';
  logger.info('Starting subscription debug-filter test', null, testName);
  
  // Load token if not provided
  if (!token) {
    token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No authentication token available', null, testName);
      logger.testResult(testName, false, 'No authentication token available');
      return { success: false, error: 'No authentication token available' };
    }
  }
  
  // Multiple test cases with different query parameters
  const testCases = [
    { name: 'basic', params: {} },
    { name: 'type-filter', params: { type: 'boe' } },
    { name: 'status-filter', params: { status: 'active' } },
    { name: 'date-filter', params: { createdAfter: '2025-01-01' } },
    { name: 'combined-filters', params: { type: 'boe', status: 'active', limit: 10 } }
  ];
  
  const results = [];
  
  // Run each test case
  for (const testCase of testCases) {
    const queryParams = new URLSearchParams(testCase.params).toString();
    const queryString = queryParams ? `?${queryParams}` : '';
    
    // Request options
    const options = {
      hostname: endpoints.backend.baseUrl,
      port: 443,
      path: `${endpoints.backend.subscriptions.debugFilter}${queryString}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': apiClient.getUserIdFromToken(token)
      }
    };
    
    logger.info(`Testing debug-filter with params: ${JSON.stringify(testCase.params)}`, null, testName);
    
    try {
      // Make the request
      const response = await apiClient.makeApiRequest(options, token);
      
      // Save response to file
      const fileName = `subscription_debug_filter_${testCase.name}`;
      apiClient.saveResponseToFile(fileName, response, RESPONSES_DIR);
      
      if (response.statusCode === 200) {
        logger.success(`Debug filter response for '${testCase.name}' obtained successfully`, null, testName);
        results.push({
          testCase: testCase.name,
          success: true,
          response: response.data
        });
      } else {
        logger.error(`Debug filter request for '${testCase.name}' failed with status code ${response.statusCode}`, response.data, testName);
        results.push({
          testCase: testCase.name,
          success: false,
          statusCode: response.statusCode,
          error: response.data
        });
      }
    } catch (error) {
      logger.error(`Error during debug filter test for '${testCase.name}'`, error, testName);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Determine overall success
  const allSuccessful = results.every(result => result.success);
  
  // Log final result
  if (allSuccessful) {
    logger.success(`All debug filter tests passed (${results.length}/${results.length})`, null, testName);
    logger.testResult(testName, true, { 
      totalTests: results.length, 
      passedTests: results.length
    });
    
    return { 
      success: true, 
      results: results
    };
  } else {
    const failedCount = results.filter(result => !result.success).length;
    logger.error(`Some debug filter tests failed (${results.length - failedCount}/${results.length} passed)`, null, testName);
    logger.testResult(testName, false, { 
      totalTests: results.length, 
      passedTests: results.length - failedCount,
      failedTests: failedCount
    });
    
    return { 
      success: false, 
      results: results,
      error: `${failedCount} tests failed`
    };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testDebugFilter()
    .then(result => {
      if (result.success) {
        logger.success('Subscription debug-filter test completed successfully');
        
        // Log a summary of the successful responses
        result.results.forEach(testResult => {
          if (testResult.success) {
            logger.info(`${testResult.testCase}: Successful test`);
            
            // Log parsed parameters if available in the response
            if (testResult.response && testResult.response.parsedParams) {
              logger.info(`  Parsed parameters: ${JSON.stringify(testResult.response.parsedParams)}`);
            }
          }
        });
      } else {
        logger.error('Subscription debug-filter test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in subscription debug-filter test', error);
      process.exit(1);
    });
}

module.exports = testDebugFilter;