/**
 * Subscription Journey End-to-End Test
 * 
 * This script tests the complete subscription processing journey from
 * creation to notification delivery across all microservices.
 * 
 * To run:
 * NODE_ENV=test node subscription-journey-test.js
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

const outputDir = path.join(__dirname, '../../outputs/journey-tests');

// Configuration
const CONFIG = {
  authServiceUrl: endpoints.auth.baseUrl,
  backendUrl: endpoints.backend.baseUrl,
  credentials: {
    email: process.env.TEST_USER_EMAIL || endpoints.testData.login.email,
    password: process.env.TEST_USER_PASSWORD || endpoints.testData.login.password
  },
  maxRetries: 10,
  retryDelay: 3000, // 3 seconds
  testTimeout: 5 * 60 * 1000, // 5 minutes
};

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    logger.info(`Output directory ready: ${outputDir}`);
  } catch (err) {
    logger.error('Failed to create output directory:', err);
    throw err;
  }
}

// Save test results to file
async function saveResults(filename, data) {
  const filePath = path.join(outputDir, filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    logger.info(`Results saved to ${filePath}`);
    return filePath;
  } catch (err) {
    logger.error('Failed to save results:', err);
    throw err;
  }
}

// Authenticate and get tokens - use existing token
async function authenticate() {
  logger.info('Authenticating using existing token...', null, 'journey-test');
  
  try {
    // Try to load existing token
    const token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No existing auth token found', null, 'journey-test');
      throw new Error('No auth token available');
    }
    
    // Get user ID from token
    const userId = apiClient.getUserIdFromToken(token);
    if (!userId) {
      logger.error('Could not extract user ID from token', null, 'journey-test');
      throw new Error('Invalid token format');
    }
    
    logger.success(`Successfully loaded existing token for user: ${userId}`, null, 'journey-test');
    
    return {
      token,
      userId,
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    };
  } catch (err) {
    logger.error('Authentication failed:', err, 'journey-test');
    throw err;
  }
}

// Create a test subscription
async function createSubscription(authInfo) {
  logger.info('Creating test subscription...', null, 'journey-test');
  
  const subscriptionData = {
    type_id: 'boe', // BOE subscription type
    name: `Test BOE Subscription ${new Date().toISOString()}`,
    description: 'Test subscription for E2E journey testing',
    prompts: {
      keywords: ['test', 'journey', Math.random().toString(36).substring(2, 7)], // Add some randomness
      sections: ['general'],
      categories: ['announcements']
    },
    frequency: 'daily',
    active: true
  };
  
  try {
    const options = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.subscriptions.create}`,
      method: 'POST',
      headers: authInfo.headers,
      data: subscriptionData
    };
    
    const response = await apiClient.makeApiRequest(options);
    
    // Handle different response formats
    const subscriptionId = response.data?.id || 
                         response.data?.data?.id || 
                         (response.data?.data?.subscription?.id);
    
    if (!subscriptionId) {
      logger.error('Invalid subscription creation response format:', response.data, 'journey-test');
      throw new Error('Invalid subscription creation response');
    }
    
    logger.success(`Created subscription with ID: ${subscriptionId}`, null, 'journey-test');
    await saveResults('subscription_creation.json', response);
    
    return subscriptionId;
  } catch (err) {
    logger.error('Subscription creation failed:', err, 'journey-test');
    throw err;
  }
}

// Verify subscription exists in listing
async function verifySubscriptionListing(authInfo, subscriptionId) {
  logger.info('Verifying subscription in listing...', null, 'journey-test');
  
  try {
    const options = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.subscriptions.list}`,
      method: 'GET',
      headers: authInfo.headers
    };
    
    const response = await apiClient.makeApiRequest(options);
    await saveResults('subscription_listing.json', response);
    
    // Handle different response formats
    const subscriptions = Array.isArray(response.data) ? response.data :
                         Array.isArray(response.data?.data) ? response.data.data :
                         [];
    
    if (!Array.isArray(subscriptions)) {
      logger.error('Invalid subscription listing response format:', response.data, 'journey-test');
      throw new Error('Invalid subscription listing response');
    }
    
    logger.info(`Found ${subscriptions.length} subscriptions in listing`, null, 'journey-test');
    
    const found = subscriptions.some(sub => sub.id === subscriptionId);
    
    if (!found) {
      throw new Error(`Subscription ${subscriptionId} not found in listing`);
    }
    
    logger.success('Subscription successfully verified in listing', null, 'journey-test');
    return true;
  } catch (err) {
    logger.error('Subscription verification failed:', err, 'journey-test');
    throw err;
  }
}

// Initiate subscription processing
async function initiateProcessing(authInfo, subscriptionId) {
  logger.info(`Initiating processing for subscription: ${subscriptionId}`, null, 'journey-test');
  
  try {
    const options = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.subscriptions.process(subscriptionId)}`,
      method: 'POST',
      headers: authInfo.headers
    };
    
    const response = await apiClient.makeApiRequest(options);
    await saveResults('processing_initiation.json', response);
    
    // Handle different response formats
    const jobId = response.data?.jobId || 
                 response.data?.data?.jobId || 
                 response.data?.id;
    
    if (!jobId) {
      logger.error('Invalid processing initiation response format:', response.data, 'journey-test');
      throw new Error('Invalid processing initiation response');
    }
    
    logger.success(`Processing initiated with job ID: ${jobId}`, null, 'journey-test');
    return jobId;
  } catch (err) {
    logger.error('Processing initiation failed:', err, 'journey-test');
    throw err;
  }
}

// Poll for processing status
async function pollProcessingStatus(authInfo, subscriptionId, jobId) {
  logger.info(`Polling for processing status of job: ${jobId}`, null, 'journey-test');
  
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      logger.info(`Checking processing status (attempt ${attempt}/${CONFIG.maxRetries})...`, null, 'journey-test');
      
      const options = {
        url: `https://${endpoints.backend.baseUrl}/api/v1/subscriptions/${subscriptionId}/process/${jobId}`,
        method: 'GET',
        headers: authInfo.headers
      };
      
      try {
        const response = await apiClient.makeApiRequest(options);
        await saveResults(`processing_status_${attempt}.json`, response);
        
        // Handle different response formats
        const status = response.data?.status ||
                     response.data?.data?.status ||
                     response.data?.state;
        
        if (!status) {
          logger.warn('Invalid processing status response format', response.data, 'journey-test');
          await sleep(CONFIG.retryDelay);
          continue;
        }
        
        logger.info(`Current processing status: ${status}`, null, 'journey-test');
        
        // Handle different status values for "completed"
        if (status === 'completed' || status === 'COMPLETED' || status === 'success' || status === 'SUCCESS') {
          return {
            status: 'completed',
            details: response.data
          };
        } 
        // Handle different status values for "failed"
        else if (status === 'failed' || status === 'FAILED' || status === 'error' || status === 'ERROR') {
          const errorMsg = response.data?.error || 
                        response.data?.data?.error || 
                        response.data?.message || 
                        'Unknown error';
          throw new Error(`Processing failed: ${errorMsg}`);
        }
      } catch (reqErr) {
        logger.warn(`Status check failed: ${reqErr.message}`, null, 'journey-test');
      }
      
      await sleep(CONFIG.retryDelay);
    } catch (err) {
      logger.error(`Error in attempt ${attempt}:`, err, 'journey-test');
      await sleep(CONFIG.retryDelay);
    }
  }
  
  throw new Error(`Processing did not complete after ${CONFIG.maxRetries} attempts`);
}

// Poll for notifications
async function pollForNotifications(authInfo, subscriptionId) {
  logger.info(`Polling for notifications for subscription: ${subscriptionId}`, null, 'journey-test');
  
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      logger.info(`Checking for notifications (attempt ${attempt}/${CONFIG.maxRetries})...`, null, 'journey-test');
      
      // Try both parameter formats (subscription_id and subscriptionId)
      const options = {
        url: `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.list}?subscription_id=${subscriptionId}&subscriptionId=${subscriptionId}`,
        method: 'GET',
        headers: authInfo.headers
      };
      
      try {
        const response = await apiClient.makeApiRequest(options);
        await saveResults(`notifications_attempt_${attempt}.json`, response);
        
        // Handle different response formats
        const notifications = response.data || 
                           response.data?.data || 
                           response.data?.notifications || 
                           response.data?.data?.notifications || 
                           [];
        
        // Ensure we have an array
        const notificationsArray = Array.isArray(notifications) ? notifications : [];
        
        logger.info(`Found ${notificationsArray.length} potential notifications`, null, 'journey-test');
        
        // Check if we have notifications for this subscription
        const relevantNotifications = notificationsArray.filter(n => 
          n.subscription_id === subscriptionId || 
          n.subscriptionId === subscriptionId
        );
        
        logger.info(`Found ${relevantNotifications.length} notifications for subscription ${subscriptionId}`, null, 'journey-test');
        
        if (relevantNotifications.length > 0) {
          logger.success(`Found ${notifications.length} notifications for subscription`, null, 'journey-test');
          return notifications;
        }
        
        logger.info('No notifications found yet, waiting...', null, 'journey-test');
      } catch (reqErr) {
        logger.warn(`Notification check failed: ${reqErr.message}`, null, 'journey-test');
      }
      
      await sleep(CONFIG.retryDelay);
    } catch (err) {
      logger.error(`Error in attempt ${attempt}:`, err, 'journey-test');
      await sleep(CONFIG.retryDelay);
    }
  }
  
  throw new Error(`No notifications found after ${CONFIG.maxRetries} attempts`);
}

// Test notification actions
async function testNotificationActions(authInfo, notificationId) {
  logger.info(`Testing actions for notification: ${notificationId}`, null, 'journey-test');
  
  try {
    // Mark as read - try POST method since some APIs use POST for this operation
    // If it fails, we'll try PATCH
    let markReadResult;
    try {
      const markReadPostOptions = {
        url: `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.markAsRead(notificationId)}`,
        method: 'POST',
        headers: authInfo.headers
      };
      
      markReadResult = await apiClient.makeApiRequest(markReadPostOptions);
      logger.info('Successfully marked notification as read using POST method', null, 'journey-test');
    } catch (postErr) {
      logger.warn(`POST method failed for marking notification as read: ${postErr.message}`, null, 'journey-test');
      
      // Try PATCH instead
      const markReadPatchOptions = {
        url: `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.markAsRead(notificationId)}`,
        method: 'PATCH',
        headers: authInfo.headers
      };
      
      markReadResult = await apiClient.makeApiRequest(markReadPatchOptions);
      logger.info('Successfully marked notification as read using PATCH method', null, 'journey-test');
    }
    
    // Save the result of marking notification as read
    await saveResults('notification_mark_read.json', markReadResult);
    logger.success('Successfully marked notification as read', null, 'journey-test');
    
    // Verify read status
    const verifyOptions = {
      url: `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.getById(notificationId)}`,
      method: 'GET',
      headers: authInfo.headers
    };
    
    const verifyResult = await apiClient.makeApiRequest(verifyOptions);
    await saveResults('notification_verify.json', verifyResult);
    
    // Handle different response formats
    const notification = verifyResult.data?.data || 
                       verifyResult.data || 
                       verifyResult;
    
    logger.info('Notification verification response:', notification, 'journey-test');
    
    // Check if the notification is marked as read using various property names
    const isRead = notification?.read === true || 
                 notification?.isRead === true || 
                 notification?.status === 'read';
                 
    if (!notification || !isRead) {
      logger.error('Notification read status verification failed:', notification, 'journey-test');
      throw new Error('Notification read status was not updated correctly');
    }
    
    logger.success('Successfully verified notification read status', null, 'journey-test');
    return true;
  } catch (err) {
    logger.error('Notification action testing failed:', err, 'journey-test');
    throw err;
  }
}

// Generate test report
async function generateTestReport(testResults) {
  const reportData = {
    timestamp: new Date().toISOString(),
    success: testResults.success,
    duration: testResults.duration,
    steps: testResults.steps,
    errors: testResults.errors || []
  };
  
  // Create markdown report
  const markdownReport = [
    `# Subscription Journey Test Report`,
    ``,
    `- **Date**: ${new Date().toLocaleString()}`,
    `- **Duration**: ${Math.round(testResults.duration / 1000)} seconds`,
    `- **Status**: ${testResults.success ? '✅ Success' : '❌ Failed'}`,
    ``,
    `## Test Steps`,
    ``,
  ];
  
  testResults.steps.forEach(step => {
    markdownReport.push(`### ${step.name}`);
    markdownReport.push(`- **Status**: ${step.success ? '✅ Success' : '❌ Failed'}`);
    markdownReport.push(`- **Duration**: ${step.duration}ms`);
    
    if (step.details) {
      markdownReport.push(`- **Details**:`);
      Object.entries(step.details).forEach(([key, value]) => {
        markdownReport.push(`  - ${key}: ${value}`);
      });
    }
    
    if (step.error) {
      markdownReport.push(`- **Error**: ${step.error}`);
    }
    
    markdownReport.push(``);
  });
  
  if (testResults.errors && testResults.errors.length > 0) {
    markdownReport.push(`## Errors`);
    markdownReport.push(``);
    
    testResults.errors.forEach((error, index) => {
      markdownReport.push(`### Error ${index + 1}`);
      markdownReport.push(`- **Message**: ${error.message}`);
      markdownReport.push(`- **Step**: ${error.step}`);
      
      if (error.details) {
        markdownReport.push(`- **Details**: ${JSON.stringify(error.details)}`);
      }
      
      markdownReport.push(``);
    });
  }
  
  // Save both JSON and Markdown reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await saveResults(`test_results_${timestamp}.json`, reportData);
  
  const reportPath = path.join(outputDir, `test_report_${timestamp}.md`);
  await fs.writeFile(reportPath, markdownReport.join('\n'));
  
  console.log(`Test report saved to ${reportPath}`);
  return reportPath;
}

// Main test function
async function runJourneyTest() {
  logger.info('====== SUBSCRIPTION JOURNEY TEST ======', null, 'journey-test');
  logger.info(`Starting test at ${new Date().toLocaleString()}`, null, 'journey-test');
  
  // Log environment info for debugging
  logger.info('Test environment configuration:', {
    authServiceUrl: `https://${CONFIG.authServiceUrl}`,
    backendUrl: `https://${CONFIG.backendUrl}`,
    endpoints: {
      auth: endpoints.auth.login,
      subscriptions: endpoints.backend.subscriptions.list,
      notifications: endpoints.backend.notifications.list
    },
    email: CONFIG.credentials.email ? CONFIG.credentials.email.substring(0, 3) + '***' : undefined
  }, 'journey-test');
  
  const startTime = Date.now();
  const testResults = {
    success: false,
    duration: 0,
    steps: [],
    errors: []
  };
  
  try {
    await ensureOutputDir();
    
    // Step 1: Authenticate
    let authStep = { name: 'Authentication', startTime: Date.now() };
    try {
      const authInfo = await authenticate();
      authStep.success = true;
      authStep.details = { userId: authInfo.userId };
    } catch (err) {
      authStep.success = false;
      authStep.error = err.message;
      testResults.errors.push({ step: 'Authentication', message: err.message });
      throw err;
    } finally {
      authStep.duration = Date.now() - authStep.startTime;
      testResults.steps.push(authStep);
    }
    
    // Get authentication info for subsequent steps
    const authInfo = await authenticate();
    
    // Step 2: Create subscription
    let createStep = { name: 'Create Subscription', startTime: Date.now() };
    let subscriptionId;
    try {
      subscriptionId = await createSubscription(authInfo);
      createStep.success = true;
      createStep.details = { subscriptionId };
    } catch (err) {
      createStep.success = false;
      createStep.error = err.message;
      testResults.errors.push({ step: 'Create Subscription', message: err.message });
      throw err;
    } finally {
      createStep.duration = Date.now() - createStep.startTime;
      testResults.steps.push(createStep);
    }
    
    // Step 3: Verify subscription listing
    let verifyStep = { name: 'Verify Subscription', startTime: Date.now() };
    try {
      await verifySubscriptionListing(authInfo, subscriptionId);
      verifyStep.success = true;
      verifyStep.details = { subscriptionId };
    } catch (err) {
      verifyStep.success = false;
      verifyStep.error = err.message;
      testResults.errors.push({ step: 'Verify Subscription', message: err.message });
      throw err;
    } finally {
      verifyStep.duration = Date.now() - verifyStep.startTime;
      testResults.steps.push(verifyStep);
    }
    
    // Step 4: Initiate processing
    let processStep = { name: 'Initiate Processing', startTime: Date.now() };
    let jobId;
    try {
      jobId = await initiateProcessing(authInfo, subscriptionId);
      processStep.success = true;
      processStep.details = { subscriptionId, jobId };
    } catch (err) {
      processStep.success = false;
      processStep.error = err.message;
      testResults.errors.push({ step: 'Initiate Processing', message: err.message });
      throw err;
    } finally {
      processStep.duration = Date.now() - processStep.startTime;
      testResults.steps.push(processStep);
    }
    
    // Step 5: Poll for processing completion
    let pollStep = { name: 'Poll Processing Status', startTime: Date.now() };
    try {
      const status = await pollProcessingStatus(authInfo, subscriptionId, jobId);
      pollStep.success = true;
      pollStep.details = { status: status.status };
    } catch (err) {
      pollStep.success = false;
      pollStep.error = err.message;
      testResults.errors.push({ step: 'Poll Processing Status', message: err.message });
      throw err;
    } finally {
      pollStep.duration = Date.now() - pollStep.startTime;
      testResults.steps.push(pollStep);
    }
    
    // Step 6: Check for notifications
    let notificationStep = { name: 'Check for Notifications', startTime: Date.now() };
    let notifications;
    try {
      notifications = await pollForNotifications(authInfo, subscriptionId);
      notificationStep.success = true;
      notificationStep.details = { count: notifications.length };
    } catch (err) {
      notificationStep.success = false;
      notificationStep.error = err.message;
      testResults.errors.push({ step: 'Check for Notifications', message: err.message });
      throw err;
    } finally {
      notificationStep.duration = Date.now() - notificationStep.startTime;
      testResults.steps.push(notificationStep);
    }
    
    // Step 7: Test notification actions
    if (notifications && notifications.length > 0) {
      let actionStep = { name: 'Test Notification Actions', startTime: Date.now() };
      try {
        await testNotificationActions(authInfo, notifications[0].id);
        actionStep.success = true;
        actionStep.details = { notificationId: notifications[0].id };
      } catch (err) {
        actionStep.success = false;
        actionStep.error = err.message;
        testResults.errors.push({ step: 'Test Notification Actions', message: err.message });
        // Don't throw here, it's not a critical failure
      } finally {
        actionStep.duration = Date.now() - actionStep.startTime;
        testResults.steps.push(actionStep);
      }
    }
    
    // Test completed successfully
    testResults.success = true;
  } catch (err) {
    console.error('Test failed:', err);
    testResults.success = false;
  } finally {
    testResults.duration = Date.now() - startTime;
    
    // Generate and save test report
    const reportPath = await generateTestReport(testResults);
    
    console.log(`====== TEST ${testResults.success ? 'SUCCEEDED' : 'FAILED'} ======`);
    console.log(`Duration: ${Math.round(testResults.duration / 1000)} seconds`);
    console.log(`Report saved to: ${reportPath}`);
  }
  
  return testResults;
}

// Execute the test if running directly
if (require.main === module) {
  runJourneyTest().catch(err => {
    console.error('Unhandled error in test:', err);
    process.exit(1);
  });
}

module.exports = {
  runJourneyTest,
  authenticate,
  createSubscription,
  verifySubscriptionListing,
  initiateProcessing,
  pollProcessingStatus,
  pollForNotifications,
  testNotificationActions
};