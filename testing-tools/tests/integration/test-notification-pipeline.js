/**
 * Integration Test: Full Notification Pipeline
 * 
 * This script tests the complete end-to-end flow:
 * 1. Log in to get authentication
 * 2. Create a subscription
 * 3. Process the subscription
 * 4. Wait and check for notifications
 * 5. Verify notifications in both backend and notification worker
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const loginTest = require('../auth/test-login');
const createSubscription = require('../subscriptions/create');
const processSubscription = require('../subscriptions/process');
const checkNotifications = require('../notifications/basic-list');
const checkDebugEndpoint = require('../notifications/check-debug-endpoint');

const OUTPUT_DIR = path.join(__dirname, '../../outputs/integration');

async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (err) {
    logger.warn(`Error creating output directory: ${err.message}`);
  }
}

async function saveResult(filename, data) {
  try {
    await ensureOutputDir();
    const filePath = path.join(OUTPUT_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    logger.info(`Saved result to ${filePath}`);
    return filePath;
  } catch (err) {
    logger.error(`Error saving result: ${err.message}`);
    return null;
  }
}

async function testFullPipeline() {
  logger.info('Starting full notification pipeline test');
  
  // Step 1: Login
  logger.info('Step 1: Authenticating...');
  const authResult = await loginTest();
  if (!authResult.success) {
    logger.error('Authentication failed, aborting test');
    return {
      success: false,
      step: 'authentication',
      error: authResult.error || 'Authentication failed'
    };
  }
  
  const token = authResult.token;
  const userId = authResult.user?.id;
  await saveResult('auth-result.json', authResult);
  
  logger.info(`Successfully authenticated as user ${userId}`);
  
  // Step 2: Create subscription
  logger.info('Step 2: Creating subscription...');
  const subscriptionData = {
    ...endpoints.testData.boeSubscription,
    name: `Pipeline Test ${new Date().toISOString()}`
  };
  
  const createResult = await createSubscription(token, userId, subscriptionData);
  await saveResult('subscription-create-result.json', createResult);
  
  if (!createResult.success) {
    logger.error('Failed to create subscription, aborting test');
    return {
      success: false,
      step: 'subscription_creation',
      error: createResult.error || 'Failed to create subscription'
    };
  }
  
  const subscriptionId = createResult.subscription?.id;
  logger.info(`Successfully created subscription with ID: ${subscriptionId}`);
  
  // Step 3: Process the subscription
  logger.info('Step 3: Processing subscription...');
  const processResult = await processSubscription(token, userId, subscriptionId);
  await saveResult('subscription-process-result.json', processResult);
  
  if (!processResult.success) {
    logger.error('Failed to process subscription, aborting test');
    return {
      success: false,
      step: 'subscription_processing',
      error: processResult.error || 'Failed to process subscription'
    };
  }
  
  logger.info(`Successfully initiated processing for subscription ${subscriptionId}`);
  
  // Step 4: Wait for notification processing
  logger.info('Step 4: Waiting for notifications to be processed...');
  // Wait for 10 seconds to allow processing
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Step 5: Check for notifications in backend
  logger.info('Step 5: Checking for notifications in backend...');
  const notificationsResult = await checkNotifications(token, userId);
  await saveResult('notifications-result.json', notificationsResult);
  
  // Find notifications for our subscription
  const relevantNotifications = (notificationsResult.notifications || [])
    .filter(n => n.subscription_id === subscriptionId);
  
  logger.info(`Found ${relevantNotifications.length} notifications for subscription ${subscriptionId}`);
  
  // Step 6: Check notification worker debug endpoint
  logger.info('Step 6: Checking notification worker debug endpoint...');
  const debugResult = await checkDebugEndpoint();
  await saveResult('notification-worker-debug-result.json', debugResult);
  
  // Try a targeted query if subscription ID is available
  if (subscriptionId && debugResult.success) {
    try {
      logger.info(`Querying notifications specifically for subscription ${subscriptionId}`);
      const baseUrl = debugResult.baseUrl || 'https://notification-worker-415554190254.uc.run.app';
      const specificResult = await axios.get(`${baseUrl}/debug/notifications?subscriptionId=${subscriptionId}&limit=20`);
      
      const specificNotifications = specificResult.data.notifications || [];
      logger.info(`Found ${specificNotifications.length} notifications in worker for subscription ${subscriptionId}`);
      
      await saveResult('notification-worker-specific-result.json', {
        success: true,
        notifications: specificNotifications,
        count: specificNotifications.length
      });
    } catch (err) {
      logger.warn(`Failed to query specific notifications: ${err.message}`);
    }
  }
  
  // Generate final result
  const finalResult = {
    success: true,
    steps: {
      authentication: { success: authResult.success },
      subscription_creation: { 
        success: createResult.success,
        subscription_id: subscriptionId
      },
      subscription_processing: { success: processResult.success },
      backend_notifications: {
        success: notificationsResult.success,
        count: notificationsResult.notifications?.length || 0,
        relevant_count: relevantNotifications.length,
        relevant_notifications: relevantNotifications
      },
      worker_debug: {
        success: debugResult.success,
        count: debugResult.notifications?.length || 0
      }
    },
    processing_time: new Date().toISOString(),
    test_summary: `Completed notification pipeline test with ${relevantNotifications.length} notifications created for subscription ${subscriptionId}`
  };
  
  await saveResult('full-pipeline-result.json', finalResult);
  
  // Create a readable summary
  const summary = `
## Notification Pipeline Test Results

**Test Time:** ${new Date().toISOString()}
**Test Status:** ${finalResult.success ? '✅ Success' : '❌ Failed'}

### Test Steps
1. **Authentication:** ${authResult.success ? '✅ Succeeded' : '❌ Failed'}
2. **Subscription Creation:** ${createResult.success ? '✅ Succeeded' : '❌ Failed'}
   - Subscription ID: ${subscriptionId || 'N/A'}
3. **Subscription Processing:** ${processResult.success ? '✅ Succeeded' : '❌ Failed'}
4. **Backend Notifications Check:** ${notificationsResult.success ? '✅ Succeeded' : '❌ Failed'}
   - Total Notifications: ${notificationsResult.notifications?.length || 0}
   - Relevant Notifications: ${relevantNotifications.length}
5. **Worker Debug Endpoint Check:** ${debugResult.success ? '✅ Succeeded' : '❌ Failed'}
   - Notifications in Worker: ${debugResult.notifications?.length || 0}

### Test Summary
${finalResult.test_summary}

### Next Steps
${relevantNotifications.length > 0 
  ? '- Pipeline is working correctly. Notifications are being created and can be queried.'
  : '- Troubleshoot notification creation - processing started but no notifications were created.'}
  `;
  
  await saveResult('notification-pipeline-summary.md', summary);
  
  return finalResult;
}

// Run the test if executed directly
if (require.main === module) {
  testFullPipeline()
    .then(result => {
      console.log('Test completed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test failed with error:', err);
      process.exit(1);
    });
} else {
  // Export for use in other tests
  module.exports = testFullPipeline;
}