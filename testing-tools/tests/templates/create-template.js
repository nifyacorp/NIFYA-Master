/**
 * Create Template Test
 * 
 * This script tests the POST /templates endpoint
 * which creates a new subscription template.
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

// Test template data
const TEST_TEMPLATE = {
  name: `Test Template ${new Date().toISOString()}`,
  description: "Template created by automated test",
  type: "boe",
  defaultPrompts: ["test", "automation"],
  configuration: {
    sections: ["all"],
    refreshInterval: 24
  }
};

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
}

/**
 * Tests the create template endpoint
 * @returns {Promise<Object>} Test result object
 */
async function testCreateTemplate() {
  const testName = 'create-template';
  logger.info('Starting create template test', null, testName);
  
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
    
    // Step 2: Create a new template
    const createOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.templates.create}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      data: TEST_TEMPLATE
    };
    
    logger.info('Creating new template...', null, testName);
    const createResponse = await apiClient.makeApiRequest(createOptions, token, TEST_TEMPLATE);
    await ensureDirectories();
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'create_template_response.json'),
      JSON.stringify(createResponse.data, null, 2)
    );
    
    // Check if create was successful
    const createSuccess = createResponse.status >= 200 && createResponse.status < 300;
    if (!createSuccess) {
      logger.error('Failed to create template', createResponse.data, testName);
      return {
        success: false,
        error: `Failed to create template: ${createResponse.status}`,
        response: createResponse.data
      };
    }
    
    logger.success('Successfully created template', null, testName);
    
    // Extract template ID
    let templateId = null;
    if (createResponse.data?.data?.template?.id) {
      templateId = createResponse.data.data.template.id;
    } else if (createResponse.data?.data?.id) {
      templateId = createResponse.data.data.id;
    } else if (createResponse.data?.template?.id) {
      templateId = createResponse.data.template.id;
    } else if (createResponse.data?.id) {
      templateId = createResponse.data.id;
    }
    
    if (!templateId) {
      logger.warn('Template created but ID not found in response', null, testName);
    } else {
      logger.info(`Created template with ID: ${templateId}`, null, testName);
    }
    
    // Step 3: Verify template was created by retrieving the template list
    const verifyOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.templates.list}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Verifying template was created...', null, testName);
    const verifyResponse = await apiClient.makeApiRequest(verifyOptions);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'verify_template_creation.json'),
      JSON.stringify(verifyResponse.data, null, 2)
    );
    
    // Extract templates from the response
    let templates = [];
    if (verifyResponse.data?.data?.templates) {
      templates = verifyResponse.data.data.templates;
    } else if (verifyResponse.data?.data) {
      templates = verifyResponse.data.data;
    } else if (verifyResponse.data?.templates) {
      templates = verifyResponse.data.templates;
    } else if (Array.isArray(verifyResponse.data)) {
      templates = verifyResponse.data;
    }
    
    // Check if our template is in the list
    const templateFound = templateId ? 
      templates.some(t => (t.id === templateId || t._id === templateId)) :
      templates.some(t => t.name === TEST_TEMPLATE.name);
    
    if (templateFound) {
      logger.success('Template creation verified successfully', null, testName);
      return {
        success: true,
        details: {
          templateId,
          templateName: TEST_TEMPLATE.name
        }
      };
    } else {
      logger.error('Template creation verification failed - template not found in list', null, testName);
      return {
        success: false,
        error: 'Created template not found in template list',
        details: {
          templateId,
          templateName: TEST_TEMPLATE.name
        }
      };
    }
  } catch (error) {
    logger.error('Error during create template test', error, testName);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testCreateTemplate()
    .then(result => {
      if (result.success) {
        logger.success('Create template test completed successfully');
        process.exit(0);
      } else {
        logger.error('Create template test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in create template test', error);
      process.exit(1);
    });
}

module.exports = testCreateTemplate;