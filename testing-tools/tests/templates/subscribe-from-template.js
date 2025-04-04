/**
 * Subscribe From Template Test
 * 
 * This script tests the POST /templates/:id/subscribe endpoint
 * which creates a subscription from a template.
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
 * Tests the subscribe from template endpoint
 * @returns {Promise<Object>} Test result object
 */
async function testSubscribeFromTemplate() {
  const testName = 'subscribe-from-template';
  logger.info('Starting subscribe from template test', null, testName);
  
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
      path.join(RESPONSE_DIR, 'templates_list_for_subscribe.json'),
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
    
    // Step 3: Subscribe from template
    const subscribeData = {
      name: `Subscription from Template ${new Date().toISOString()}`,
      prompts: { value: "Test subscription from template" },
      frequency: "daily",
      configuration: {}
    };
    
    const subscribeOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.templates.subscribe(templateId)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      data: subscribeData
    };
    
    logger.info('Creating subscription from template...', null, testName);
    const subscribeResponse = await apiClient.makeApiRequest(subscribeOptions, token, subscribeData);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'subscribe_from_template_response.json'),
      JSON.stringify(subscribeResponse.data, null, 2)
    );
    
    // Check if subscription was created successfully
    const subscribeSuccess = subscribeResponse.status >= 200 && subscribeResponse.status < 300;
    if (!subscribeSuccess) {
      logger.error('Failed to create subscription from template', subscribeResponse.data, testName);
      return {
        success: false,
        error: `Failed to create subscription from template: ${subscribeResponse.status}`,
        response: subscribeResponse.data
      };
    }
    
    logger.success('Successfully created subscription from template', null, testName);
    
    // Extract subscription ID
    let subscriptionId = null;
    if (subscribeResponse.data?.data?.subscription?.id) {
      subscriptionId = subscribeResponse.data.data.subscription.id;
    } else if (subscribeResponse.data?.data?.id) {
      subscriptionId = subscribeResponse.data.data.id;
    } else if (subscribeResponse.data?.subscription?.id) {
      subscriptionId = subscribeResponse.data.subscription.id;
    } else if (subscribeResponse.data?.id) {
      subscriptionId = subscribeResponse.data.id;
    }
    
    if (!subscriptionId) {
      logger.warn('Subscription created but ID not found in response', null, testName);
      return {
        success: true,
        warning: 'Subscription ID not found in response',
        details: {
          templateId,
          subscriptionName: subscribeData.name
        }
      };
    } else {
      logger.info(`Created subscription with ID: ${subscriptionId}`, null, testName);
    }
    
    // Step 4: Verify subscription was created in the user's subscription list
    const verifyOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.subscriptions.list}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    };
    
    logger.info('Verifying subscription was created...', null, testName);
    const verifyResponse = await apiClient.makeApiRequest(verifyOptions);
    await fs.writeFile(
      path.join(RESPONSE_DIR, 'verify_subscription_from_template.json'),
      JSON.stringify(verifyResponse.data, null, 2)
    );
    
    // Extract subscriptions from the response
    let subscriptions = [];
    if (verifyResponse.data?.data?.subscriptions) {
      subscriptions = verifyResponse.data.data.subscriptions;
    } else if (verifyResponse.data?.data) {
      subscriptions = verifyResponse.data.data;
    } else if (verifyResponse.data?.subscriptions) {
      subscriptions = verifyResponse.data.subscriptions;
    } else if (Array.isArray(verifyResponse.data)) {
      subscriptions = verifyResponse.data;
    }
    
    // Check if our subscription is in the list
    const subscriptionFound = subscriptionId ? 
      subscriptions.some(s => (s.id === subscriptionId || s._id === subscriptionId)) :
      subscriptions.some(s => s.name === subscribeData.name);
    
    // Step 5: Cleanup - Delete the subscription if found
    let cleanupSuccess = true;
    if (subscriptionId) {
      const deleteOptions = {
        url: `https://${endpoints.backend.baseUrl}${endpoints.backend.subscriptions.delete(subscriptionId)}`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      };
      
      logger.info('Cleaning up by deleting created subscription...', null, testName);
      const deleteResponse = await apiClient.makeApiRequest(deleteOptions);
      cleanupSuccess = deleteResponse.status >= 200 && deleteResponse.status < 300;
      
      if (!cleanupSuccess) {
        logger.warn('Failed to delete test subscription during cleanup', null, testName);
      } else {
        logger.info('Successfully deleted test subscription', null, testName);
      }
    }
    
    if (subscriptionFound) {
      logger.success('Subscribe from template test passed', null, testName);
      return {
        success: true,
        details: {
          templateId,
          subscriptionId,
          subscriptionName: subscribeData.name,
          cleanupSuccess
        }
      };
    } else {
      logger.error('Subscribe from template verification failed - subscription not found in list', null, testName);
      return {
        success: false,
        error: 'Created subscription not found in subscription list',
        details: {
          templateId,
          subscriptionId,
          subscriptionName: subscribeData.name
        }
      };
    }
  } catch (error) {
    logger.error('Error during subscribe from template test', error, testName);
    return { success: false, error: error.message };
  }
}

// Run the test if this script is called directly
if (require.main === module) {
  testSubscribeFromTemplate()
    .then(result => {
      if (result.success) {
        logger.success('Subscribe from template test completed successfully');
        process.exit(0);
      } else {
        logger.error('Subscribe from template test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in subscribe from template test', error);
      process.exit(1);
    });
}

module.exports = testSubscribeFromTemplate;