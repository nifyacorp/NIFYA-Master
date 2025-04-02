/**
 * List Subscription Templates Test
 * 
 * This script tests retrieving available subscription templates.
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directory for response files
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs');
const RESPONSES_DIR = path.join(OUTPUT_DIR, 'responses');

/**
 * List available subscription templates
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function listTemplates(token = null) {
  const testName = 'list-templates';
  logger.info('Starting subscription templates test', null, testName);
  
  // Load token if not provided
  if (!token) {
    token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No authentication token available', null, testName);
      logger.testResult(testName, false, 'No authentication token available');
      return { success: false, error: 'No authentication token available' };
    }
  }
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.templates.list,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  logger.info(`Fetching subscription templates: ${options.hostname}${options.path}`, null, testName);
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile('templates_response', response, RESPONSES_DIR);
    
    if (response.statusCode === 200) {
      // Extract templates from response
      const templates = response.data.templates || response.data.data?.templates || [];
      
      logger.success(`Retrieved ${templates.length} templates`, null, testName);
      
      // Log test result
      logger.testResult(testName, true, {
        count: templates.length,
        statusCode: response.statusCode
      });
      
      return { 
        success: true, 
        count: templates.length,
        templates,
        data: response.data
      };
    } else {
      // Non-success status code
      logger.error(`Template listing failed with status code ${response.statusCode}`, response.data, testName);
      logger.testResult(testName, false, `Status code ${response.statusCode}: ${JSON.stringify(response.data)}`);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    // Request error
    logger.error('Template listing request failed', error, testName);
    logger.testResult(testName, false, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  listTemplates()
    .then(result => {
      if (result.success) {
        logger.success('Template listing test completed successfully');
        logger.info(`Retrieved ${result.count} templates`);
      } else {
        logger.error('Template listing test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in template listing test', error);
      process.exit(1);
    });
}

module.exports = listTemplates;