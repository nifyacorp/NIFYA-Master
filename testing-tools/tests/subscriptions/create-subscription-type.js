/**
 * Create Subscription Type Test
 * 
 * This script tests the POST /subscriptions/types endpoint
 * which creates a new subscription type.
 */

const fs = require('fs').promises;
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const testAuth = require('../auth/login');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../../outputs');
const RESPONSE_DIR = path.join(OUTPUT_DIR, 'subscription-tests');

// Test subscription type data
const TEST_SUBSCRIPTION_TYPE = {
  name: `Test Type ${new Date().toISOString()}`,
  code: `test-${Date.now()}`,
  description: "Subscription type created by automated test",
  icon: "test-icon",
  color: "#FF5733",
  configuration: {
    required: ["searchTerm"],
    properties: {
      searchTerm: {
        type: "string",
        title: "Search Term"
      }
    }
  }
};

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
}

/**
 * Tests the create subscription type endpoint
 * @returns {Promise<Object>} Test result object
 */
async function testCreateSubscriptionType() {
  const testName = 'create-subscription-type';
  logger.info('Starting create subscription type test', null, testName);
  
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
    
    // Step 2: Create a new subscription type
    const createOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.subscriptions.createType}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      data: TEST_SUBSCRIPTION_TYPE
    };
    
    logger.info('Creating new subscription type...', null, testName);
    const createResponse = await apiClient.makeApiRequest(createOptions, token, TEST_SUBSCRIPTION_TYPE);
    await ensureDirectories();
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'create_subscription_type_response.json'),
      JSON.stringify(createResponse.data, null, 2)
    );
    
    // Check if create was successful
    const createSuccess = createResponse.status >= 200 && createResponse.status < 300;
    if (!createSuccess) {
      logger.error('Failed to create subscription type', createResponse.data, testName);
      return {
        success: false,
        error: `Failed to create subscription type: ${createResponse.status}`,
        response: createResponse.data
      };
    }
    
    logger.success('Successfully created subscription type', null, testName);
    
    // Extract subscription type ID or code
    let typeId = null;
    let typeCode = TEST_SUBSCRIPTION_TYPE.code;
    
    if (createResponse.data?.data?.type?.id) {
      typeId = createResponse.data.data.type.id;
    } else if (createResponse.data?.data?.id) {
      typeId = createResponse.data.data.id;
    } else if (createResponse.data?.type?.id) {
      typeId = createResponse.data.type.id;
    } else if (createResponse.data?.id) {
      typeId = createResponse.data.id;
    }
    
    if (!typeId) {
      logger.warn('Subscription type created but ID not found in response', null, testName);
    } else {
      logger.info(`Created subscription type with ID: ${typeId}`, null, testName);
    }
    
    // Step 3: Verify subscription type was created by retrieving the types list
    const verifyOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.subscriptions.types}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Verifying subscription type was created...', null, testName);
    const verifyResponse = await apiClient.makeApiRequest(verifyOptions);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'verify_subscription_type_creation.json'),
      JSON.stringify(verifyResponse.data, null, 2)
    );
    
    // Extract types from the response
    let types = [];
    if (verifyResponse.data?.data?.types) {
      types = verifyResponse.data.data.types;
    } else if (verifyResponse.data?.data) {
      types = verifyResponse.data.data;
    } else if (verifyResponse.data?.types) {
      types = verifyResponse.data.types;
    } else if (Array.isArray(verifyResponse.data)) {
      types = verifyResponse.data;
    }
    
    // Check if our type is in the list, either by ID or code
    const typeFound = typeId ? 
      types.some(t => (t.id === typeId || t._id === typeId)) :
      types.some(t => t.code === typeCode);
    
    if (typeFound) {
      logger.success('Subscription type creation verified successfully', null, testName);
      return {
        success: true,
        details: {
          typeId,
          typeCode,
          typeName: TEST_SUBSCRIPTION_TYPE.name
        }
      };
    } else {
      logger.error('Subscription type creation verification failed - type not found in list', null, testName);
      return {
        success: false,
        error: 'Created subscription type not found in types list',
        details: {
          typeId,
          typeCode,
          typeName: TEST_SUBSCRIPTION_TYPE.name
        }
      };
    }
  } catch (error) {
    logger.error('Error during create subscription type test', error, testName);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testCreateSubscriptionType()
    .then(result => {
      if (result.success) {
        logger.success('Create subscription type test completed successfully');
        process.exit(0);
      } else {
        logger.error('Create subscription type test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in create subscription type test', error);
      process.exit(1);
    });
}

module.exports = testCreateSubscriptionType;