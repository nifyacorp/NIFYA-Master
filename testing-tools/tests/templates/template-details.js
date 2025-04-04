/**
 * Template Details Test
 * 
 * This script tests the GET /templates/:id endpoint
 * which retrieves details for a specific template.
 */

const fs = require('fs').promises;
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const testAuth = require('../auth/login');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../../outputs');
const RESPONSE_DIR = path.join(OUTPUT_DIR, 'template-tests');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
}

/**
 * Tests the template details endpoint
 * @returns {Promise<Object>} Test result object
 */
async function testTemplateDetails() {
  const testName = 'template-details';
  logger.info('Starting template details test', null, testName);
  
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
    
    // Step 2: Get template list to find a template ID
    const templatesOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.templates.list}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Getting template list...', null, testName);
    const templatesResponse = await apiClient.makeApiRequest(templatesOptions);
    await ensureDirectories();
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'templates_list.json'),
      JSON.stringify(templatesResponse.data, null, 2)
    );
    
    // Extract template ID from the response
    let templates = [];
    if (templatesResponse.data?.data?.templates) {
      templates = templatesResponse.data.data.templates;
    } else if (templatesResponse.data?.data) {
      templates = templatesResponse.data.data;
    } else if (templatesResponse.data?.templates) {
      templates = templatesResponse.data.templates;
    } else if (Array.isArray(templatesResponse.data)) {
      templates = templatesResponse.data;
    }
    
    if (templates.length === 0) {
      logger.error('No templates found', null, testName);
      return { success: false, error: 'No templates found' };
    }
    
    // Get first template ID
    const templateId = templates[0].id || templates[0]._id;
    logger.info(`Testing with template ID: ${templateId}`, null, testName);
    
    // Step 3: Get template details
    const detailsOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.templates.detail(templateId)}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Getting template details...', null, testName);
    const detailsResponse = await apiClient.makeApiRequest(detailsOptions);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'template_details.json'),
      JSON.stringify(detailsResponse.data, null, 2)
    );
    
    // Check if details request was successful
    const success = detailsResponse.status >= 200 && detailsResponse.status < 300;
    if (!success) {
      logger.error('Failed to get template details', detailsResponse.data, testName);
      return {
        success: false,
        error: `Failed to get template details: ${detailsResponse.status}`,
        response: detailsResponse.data
      };
    }
    
    // Extract template details
    let templateDetails = null;
    if (detailsResponse.data?.data?.template) {
      templateDetails = detailsResponse.data.data.template;
    } else if (detailsResponse.data?.data) {
      templateDetails = detailsResponse.data.data;
    } else if (detailsResponse.data?.template) {
      templateDetails = detailsResponse.data.template;
    } else {
      templateDetails = detailsResponse.data;
    }
    
    // Verify the response contains the template we requested
    const idMatches = templateDetails.id === templateId || templateDetails._id === templateId;
    
    if (idMatches) {
      logger.success('Template details test passed', null, testName);
      return {
        success: true,
        details: {
          templateId,
          templateName: templateDetails.name,
          templateType: templateDetails.type
        }
      };
    } else {
      logger.error('Template details test failed - ID mismatch', null, testName);
      return {
        success: false,
        error: 'Template ID mismatch',
        details: {
          requestedId: templateId,
          receivedId: templateDetails.id || templateDetails._id
        }
      };
    }
  } catch (error) {
    logger.error('Error during template details test', error, testName);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testTemplateDetails()
    .then(result => {
      if (result.success) {
        logger.success('Template details test completed successfully');
        process.exit(0);
      } else {
        logger.error('Template details test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in template details test', error);
      process.exit(1);
    });
}

module.exports = testTemplateDetails;