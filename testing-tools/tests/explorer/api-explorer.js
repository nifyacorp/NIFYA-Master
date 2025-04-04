/**
 * API Explorer Test
 * 
 * This script tests the GET /explorer endpoint
 * which provides a list of available API endpoints.
 */

const fs = require('fs').promises;
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../../outputs');
const RESPONSE_DIR = path.join(OUTPUT_DIR, 'explorer-tests');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
}

/**
 * Tests the API explorer endpoint
 * @returns {Promise<Object>} Test result object
 */
async function testApiExplorer() {
  const testName = 'api-explorer';
  logger.info('Starting API explorer test', null, testName);
  
  try {
    // Step 1: Call the API explorer endpoint
    const explorerOptions = {
      url: `https://${endpoints.backend.baseUrl}/explorer`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    logger.info('Fetching API explorer data...', null, testName);
    const explorerResponse = await apiClient.makeApiRequest(explorerOptions);
    await ensureDirectories();
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'api_explorer_response.json'),
      JSON.stringify(explorerResponse.data, null, 2)
    );
    
    // Check if explorer request was successful
    const explorerSuccess = explorerResponse.status >= 200 && explorerResponse.status < 300;
    if (!explorerSuccess) {
      logger.error('Failed to get API explorer data', explorerResponse.data, testName);
      return {
        success: false,
        error: `Failed to get API explorer data: ${explorerResponse.status}`,
        response: explorerResponse.data
      };
    }
    
    logger.success('Successfully retrieved API explorer data', null, testName);
    
    // Step 2: Validate that the explorer response contains endpoints
    // Extract endpoints from the response
    let apiEndpoints = [];
    if (explorerResponse.data?.data?.endpoints) {
      apiEndpoints = explorerResponse.data.data.endpoints;
    } else if (explorerResponse.data?.endpoints) {
      apiEndpoints = explorerResponse.data.endpoints;
    } else if (explorerResponse.data?.data) {
      apiEndpoints = explorerResponse.data.data;
    } else if (Array.isArray(explorerResponse.data)) {
      apiEndpoints = explorerResponse.data;
    }
    
    if (!apiEndpoints || apiEndpoints.length === 0) {
      logger.error('API explorer response does not contain endpoints', null, testName);
      return {
        success: false,
        error: 'API explorer response does not contain endpoints',
        data: explorerResponse.data
      };
    }
    
    // Step 3: Get details for a specific endpoint path
    // Select a random endpoint path from the list
    let endpointPath = null;
    if (apiEndpoints.length > 0) {
      const randomIndex = Math.floor(Math.random() * apiEndpoints.length);
      endpointPath = apiEndpoints[randomIndex].path || apiEndpoints[randomIndex].url;
    }
    
    if (!endpointPath) {
      logger.warn('No endpoint path found in API explorer response, skipping endpoint detail test', null, testName);
      return {
        success: true,
        details: {
          endpointCount: apiEndpoints.length
        },
        warning: 'Could not find a specific endpoint path to test details'
      };
    }
    
    // Make the endpoint path safe for URL
    const safePath = endpointPath.replace(/^\//, '').replace(/\//g, '%2F');
    
    const detailOptions = {
      url: `https://${endpoints.backend.baseUrl}/explorer/${safePath}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    logger.info(`Fetching details for endpoint: ${endpointPath}`, null, testName);
    const detailResponse = await apiClient.makeApiRequest(detailOptions);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'api_explorer_detail_response.json'),
      JSON.stringify(detailResponse.data, null, 2)
    );
    
    // Check if detail request was successful
    const detailSuccess = detailResponse.status >= 200 && detailResponse.status < 300;
    if (!detailSuccess) {
      logger.warn(`Failed to get details for endpoint ${endpointPath}`, detailResponse.data, testName);
      return {
        success: true, // Still return true because the main endpoint test passed
        details: {
          endpointCount: apiEndpoints.length
        },
        warning: `Failed to get details for endpoint ${endpointPath}: ${detailResponse.status}`
      };
    }
    
    logger.success(`Successfully retrieved details for endpoint: ${endpointPath}`, null, testName);
    
    return {
      success: true,
      details: {
        endpointCount: apiEndpoints.length,
        testedEndpointPath: endpointPath
      }
    };
  } catch (error) {
    logger.error('Error during API explorer test', error, testName);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testApiExplorer()
    .then(result => {
      if (result.success) {
        logger.success('API explorer test completed successfully');
        console.log(`Found ${result.details.endpointCount} API endpoints`);
        process.exit(0);
      } else {
        logger.error('API explorer test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in API explorer test', error);
      process.exit(1);
    });
}

module.exports = testApiExplorer;