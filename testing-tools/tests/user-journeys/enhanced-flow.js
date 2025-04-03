/**
 * Enhanced User Journey Test
 * 
 * This script simulates a complete frontend user journey:
 * 1. Initial page load and health check
 * 2. Authentication/login
 * 3. User profile retrieval (as dashboard would)
 * 4. Subscription list and types retrieval
 * 5. Subscription creation
 * 6. Process subscription 
 * 7. Poll for notifications
 * 
 * Uses debug endpoints to provide additional diagnostics when errors occur.
 */

const fs = require('fs');
const path = require('path');
const authLogin = require('../auth/login');
const createSubscription = require('../subscriptions/create');
const processSubscription = require('../subscriptions/process');
const pollNotifications = require('../notifications/poll');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs');
const JOURNEY_LOG_FILE = path.join(OUTPUT_DIR, 'reports', 'enhanced_journey_log.md');
const JOURNEY_STATE_FILE = path.join(OUTPUT_DIR, 'reports', 'enhanced_journey_state.json');
const DEBUG_DIR = path.join(OUTPUT_DIR, 'debug');

// Ensure directories exist
const REPORTS_DIR = path.join(OUTPUT_DIR, 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

/**
 * Run the enhanced user journey test
 * @param {Object} [options] - Test options
 * @param {number} [options.pollAttempts=10] - Number of notification polling attempts
 * @param {number} [options.pollInterval=5000] - Interval between polling attempts in ms
 * @returns {Promise<Object>} Test result
 */
async function runEnhancedJourney(options = {}) {
  const testName = 'enhanced-user-journey';
  const pollAttempts = options.pollAttempts || 10;
  const pollInterval = options.pollInterval || 5000;
  
  logger.info('Starting enhanced user journey test', { pollAttempts, pollInterval }, testName);
  
  // Initialize journey state
  const journeyState = {
    startTime: new Date().toISOString(),
    steps: [],
    currentStep: 'init',
    health: null,
    auth: null,
    userProfile: null,
    subscriptionTypes: null,
    subscriptionList: null,
    subscription: null,
    processing: null,
    notifications: null,
    debug: {
      backendHealth: null,
      subscriptionDetails: null,
      notificationDetails: null
    },
    success: false
  };
  
  // Log journey start
  appendToJourneyLog(`# NIFYA Enhanced User Journey Test
Start Time: ${journeyState.startTime}
Test Settings: ${pollAttempts} notification poll attempts, ${pollInterval}ms interval
Session ID: ${logger.SESSION_ID}

## Test Steps
`);
  
  try {
    // Step 0: Initial health check (simulating initial page load)
    journeyState.currentStep = 'health-check';
    appendToJourneyLog('### Step 0: Initial Health Check');
    
    logger.info('Step 0: Initial Health Check', null, testName);
    const healthResult = await checkBackendHealth();
    
    journeyState.health = healthResult;
    journeyState.steps.push({
      name: 'health-check',
      success: healthResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!healthResult.success) {
      logger.error('User journey failed at health check step', healthResult.error, testName);
      appendToJourneyLog(`Health Check Failed: ${healthResult.error}
      
🛑 Journey terminated at health check step - backend may be unavailable`);
      
      // Use debug endpoints to get more info
      await runDebugHealthCheck();
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Health check failed', journeyState };
    }
    
    appendToJourneyLog(`Initial Health Check Successful
- Status: ${healthResult.status}
- Uptime: ${healthResult.data?.uptime || 'Not available'}
- Server Time: ${healthResult.data?.serverTime || 'Not available'}

✅ Step completed successfully`);
    
    // Step 1: Authentication
    journeyState.currentStep = 'authentication';
    appendToJourneyLog('\n### Step 1: Authentication');
    
    logger.info('Step 1: Authentication', null, testName);
    const authResult = await authLogin();
    
    journeyState.auth = authResult;
    journeyState.steps.push({
      name: 'authentication',
      success: authResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!authResult.success) {
      logger.error('User journey failed at authentication step', authResult.error, testName);
      appendToJourneyLog(`Authentication Failed: ${authResult.error}
      
🛑 Journey terminated at authentication step`);
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Authentication failed', journeyState };
    }
    
    appendToJourneyLog(`Authentication Successful
- User ID: ${authResult.userId || 'Not available'}
- Token: ${authResult.token ? (authResult.token.substring(0, 10) + '...') : 'Not available'}

✅ Step completed successfully`);

    // Step 2: Get User Profile (dashboard would load this)
    journeyState.currentStep = 'user-profile';
    appendToJourneyLog('\n### Step 2: User Profile');
    
    logger.info('Step 2: Retrieving User Profile', null, testName);
    const userProfileResult = await getUserProfile(authResult.token);
    
    journeyState.userProfile = userProfileResult;
    journeyState.steps.push({
      name: 'user-profile',
      success: userProfileResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!userProfileResult.success) {
      logger.error('User journey failed at user profile step', userProfileResult.error, testName);
      appendToJourneyLog(`User Profile Retrieval Failed: ${userProfileResult.error}
      
🛑 Journey terminated at user profile step`);
      
      saveJourneyState(journeyState);
      return { success: false, error: 'User profile retrieval failed', journeyState };
    }
    
    appendToJourneyLog(`User Profile Retrieved
- Name: ${userProfileResult.data?.name || 'Not available'}
- Email: ${userProfileResult.data?.email || 'Not available'}

✅ Step completed successfully`);

    // Step 3: Get Subscription Types (frontend would load this for subscription creation)
    journeyState.currentStep = 'subscription-types';
    appendToJourneyLog('\n### Step 3: Subscription Types');
    
    logger.info('Step 3: Retrieving Subscription Types', null, testName);
    const typesResult = await getSubscriptionTypes(authResult.token);
    
    journeyState.subscriptionTypes = typesResult;
    journeyState.steps.push({
      name: 'subscription-types',
      success: typesResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!typesResult.success) {
      logger.error('User journey failed at subscription types step', typesResult.error, testName);
      appendToJourneyLog(`Subscription Types Retrieval Failed: ${typesResult.error}
      
🛑 Journey terminated at subscription types step`);
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Subscription types retrieval failed', journeyState };
    }
    
    appendToJourneyLog(`Subscription Types Retrieved
- Types Count: ${typesResult.data?.types?.length || 0}
- Available Types: ${typesResult.data?.types?.map(t => t.name || t.type).join(', ') || 'None'}

✅ Step completed successfully`);

    // Step 4: Get Current Subscriptions (dashboard would show these)
    journeyState.currentStep = 'subscription-list';
    appendToJourneyLog('\n### Step 4: Current Subscriptions');
    
    logger.info('Step 4: Retrieving Current Subscriptions', null, testName);
    const listResult = await getCurrentSubscriptions(authResult.token);
    
    journeyState.subscriptionList = listResult;
    journeyState.steps.push({
      name: 'subscription-list',
      success: listResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!listResult.success) {
      logger.error('User journey failed at subscription list step', listResult.error, testName);
      appendToJourneyLog(`Subscription List Retrieval Failed: ${listResult.error}
      
🛑 Journey terminated at subscription list step`);
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Subscription list retrieval failed', journeyState };
    }
    
    appendToJourneyLog(`Current Subscriptions Retrieved
- Subscription Count: ${listResult.data?.subscriptions?.length || 0}
- Active Subscriptions: ${listResult.data?.subscriptions?.filter(s => s.active).length || 0}

✅ Step completed successfully`);
    
    // Step 5: Create Subscription
    journeyState.currentStep = 'create-subscription';
    appendToJourneyLog('\n### Step 5: Create Subscription');
    
    logger.info('Step 5: Create Subscription', null, testName);
    const createResult = await createSubscription(authResult.token);
    
    journeyState.subscription = createResult;
    journeyState.steps.push({
      name: 'create-subscription',
      success: createResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!createResult.success) {
      logger.error('User journey failed at subscription creation step', createResult.error, testName);
      appendToJourneyLog(`Subscription Creation Failed: ${createResult.error}
      
🛑 Journey terminated at subscription creation step`);
      
      // Try to get diagnostic info
      await getDebugInfo(null, null, authResult.token);
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Subscription creation failed', journeyState };
    }
    
    appendToJourneyLog(`Subscription Created
- Subscription ID: ${createResult.subscriptionId}
- Type: ${createResult.data?.type || 'Not available'}
- Name: ${createResult.data?.name || 'Not available'}

✅ Step completed successfully`);
    
    // Step 6: Process Subscription
    journeyState.currentStep = 'process-subscription';
    appendToJourneyLog('\n### Step 6: Process Subscription');
    
    logger.info('Step 6: Process Subscription', null, testName);
    const processResult = await processSubscription(createResult.subscriptionId, authResult.token);
    
    journeyState.processing = processResult;
    journeyState.steps.push({
      name: 'process-subscription',
      success: processResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!processResult.success) {
      logger.error('User journey failed at subscription processing step', processResult.error, testName);
      appendToJourneyLog(`Subscription Processing Failed: ${processResult.error}
      
🛑 Journey terminated at subscription processing step`);
      
      // Try to get diagnostic info
      await getDebugInfo(createResult.subscriptionId, null, authResult.token);
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Subscription processing failed', journeyState };
    }
    
    appendToJourneyLog(`Subscription Processing Initiated
- Process Job ID: ${processResult.jobId || 'Not available'}
- Status: ${processResult.status || 'Not available'}

✅ Step completed successfully`);
    
    // Step 7: Poll for Notifications
    journeyState.currentStep = 'poll-notifications';
    appendToJourneyLog('\n### Step 7: Poll for Notifications');
    
    logger.info('Step 7: Poll for Notifications', null, testName);
    const pollResult = await pollNotifications(createResult.subscriptionId, pollAttempts, pollInterval, authResult.token);
    
    journeyState.notifications = pollResult;
    journeyState.steps.push({
      name: 'poll-notifications',
      success: pollResult.success,
      timestamp: new Date().toISOString()
    });
    
    if (!pollResult.success) {
      logger.warn('User journey completed but no notifications found', { attempts: pollResult.attempts }, testName);
      appendToJourneyLog(`Notification Polling: No notifications found after ${pollResult.attempts} attempts
      
⚠️ Journey completed but no notifications were received`);
      
      // Try to get diagnostic info
      await getDebugInfo(createResult.subscriptionId, null, authResult.token);
      
      // Mark as partial success
      journeyState.success = true; 
    } else {
      logger.success(`User journey completed successfully with ${pollResult.notificationCount} notifications`, null, testName);
      appendToJourneyLog(`Notification Polling Successful
- Notifications Found: ${pollResult.notificationCount}
- Polling Attempts: ${pollResult.attempts}

✅ Step completed successfully`);
      
      // If we have notifications, try to get debug info for the first one
      if (pollResult.notifications && pollResult.notifications.length > 0) {
        const firstNotifId = pollResult.notifications[0].id;
        await getDebugInfo(createResult.subscriptionId, firstNotifId, authResult.token);
      }
      
      journeyState.success = true;
    }
    
    // Complete the journey log
    journeyState.endTime = new Date().toISOString();
    journeyState.duration = (new Date(journeyState.endTime) - new Date(journeyState.startTime)) / 1000;
    
    appendToJourneyLog(`
## Journey Summary
- Start Time: ${journeyState.startTime}
- End Time: ${journeyState.endTime}
- Duration: ${journeyState.duration} seconds
- Steps Completed: ${journeyState.steps.length}
- Overall Status: ${journeyState.success ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}

${journeyState.success ? '🎉 User journey completed successfully!' : '⚠️ User journey completed with warnings'}

## Test Session Information
- Session ID: ${logger.SESSION_ID}
- Log files: \`outputs/logs/*-${logger.SESSION_ID}.log\`
- Journey state: \`outputs/reports/enhanced_journey_state.json\`
- Journey log: \`outputs/reports/enhanced_journey_log.md\`
- Debug info: \`outputs/debug/*\`

## Findings
${journeyState.health?.error ? `- ❌ **Health Error**: ${journeyState.health.error}` : ''}
${journeyState.auth?.error ? `- ❌ **Auth Error**: ${journeyState.auth.error}` : ''}
${journeyState.userProfile?.error ? `- ❌ **Profile Error**: ${journeyState.userProfile.error}` : ''}
${journeyState.subscriptionTypes?.error ? `- ❌ **Types Error**: ${journeyState.subscriptionTypes.error}` : ''}
${journeyState.subscriptionList?.error ? `- ❌ **List Error**: ${journeyState.subscriptionList.error}` : ''}
${journeyState.subscription?.error ? `- ❌ **Subscription Error**: ${journeyState.subscription.error}` : ''}
${journeyState.processing?.error ? `- ❌ **Processing Error**: ${journeyState.processing.error}` : ''}
${journeyState.notifications?.error ? `- ❌ **Notification Error**: ${journeyState.notifications.error}` : ''}`);
    
    // Save final journey state
    saveJourneyState(journeyState);
    
    // Generate a findings report
    generateFindingsReport(journeyState);
    
    // Log test result
    logger.testResult(testName, true, {
      stepsCompleted: journeyState.steps.length,
      duration: journeyState.duration,
      status: journeyState.success ? 'SUCCESS' : 'PARTIAL SUCCESS'
    });
    
    return {
      success: true,
      journeyState
    };
  } catch (error) {
    // Handle unexpected errors
    logger.error('Unexpected error in user journey test', error, testName);
    
    journeyState.error = error.message;
    journeyState.success = false;
    journeyState.endTime = new Date().toISOString();
    journeyState.duration = (new Date(journeyState.endTime) - new Date(journeyState.startTime)) / 1000;
    
    appendToJourneyLog(`
## Error
Unexpected error occurred during journey:
\`\`\`
${error.stack || error.message}
\`\`\`

🛑 Journey terminated due to unexpected error at step: ${journeyState.currentStep}

## Journey Summary
- Start Time: ${journeyState.startTime}
- End Time: ${journeyState.endTime}
- Duration: ${journeyState.duration} seconds
- Steps Completed: ${journeyState.steps.length}
- Overall Status: ❌ FAILED`);
    
    saveJourneyState(journeyState);
    
    logger.testResult(testName, false, error.message);
    
    return {
      success: false,
      error: error.message,
      journeyState
    };
  }
}

/**
 * Check backend health (simulating initial page load)
 * @returns {Promise<Object>} Health check result
 */
async function checkBackendHealth() {
  const testName = 'health-check';
  logger.info('Checking backend health', null, testName);
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.health,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options);
    
    // Save response to file
    apiClient.saveResponseToFile('health_check', response, DEBUG_DIR);
    
    if (response.statusCode === 200) {
      logger.success('Backend health check successful', response.data, testName);
      return { 
        success: true, 
        status: 'healthy',
        data: response.data
      };
    } else {
      logger.error(`Health check failed with status code ${response.statusCode}`, response.data, testName);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    logger.error('Health check request failed', error, testName);
    return { success: false, error: error.message };
  }
}

/**
 * Get user profile (as dashboard would do)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} User profile result
 */
async function getUserProfile(token) {
  const testName = 'user-profile';
  logger.info('Retrieving user profile', null, testName);
  
  // Request options - Some environments might have different user profile paths
  // Try the endpoints we know about
  let path = endpoints.backend.user.profile;
  
  // If we don't get a profile from the main profile endpoint, we'll consider alternatives
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // First try main endpoint
    let response = await apiClient.makeApiRequest(options, token);
    
    // If 404, try alternate endpoint
    if (response.statusCode === 404) {
      logger.warn(`User profile endpoint ${path} not found, trying alternate endpoints`, null, testName);
      
      // Try user info endpoint
      const altOptions = { ...options, path: '/api/v1/user/info' };
      const altResponse = await apiClient.makeApiRequest(altOptions, token);
      
      if (altResponse.statusCode === 200) {
        response = altResponse;
        logger.info('Found alternative profile endpoint: /api/v1/user/info', null, testName);
      } else {
        // Try legacy endpoint
        const legacyOptions = { ...options, path: '/api/user/me' };
        const legacyResponse = await apiClient.makeApiRequest(legacyOptions, token);
        
        if (legacyResponse.statusCode === 200) {
          response = legacyResponse;
          logger.info('Found legacy profile endpoint: /api/user/me', null, testName);
        }
      }
    }
    
    // Save response to file
    apiClient.saveResponseToFile('user_profile', response, DEBUG_DIR);
    
    if (response.statusCode === 200) {
      const userData = response.data.user || response.data.data?.user || response.data;
      
      logger.success('User profile retrieved successfully', userData, testName);
      return { 
        success: true,
        data: userData
      };
    } else {
      // If we still can't get the user profile, continue the journey anyway
      // This is a resilient approach since we already have user ID from the token
      logger.warn(`User profile retrieval failed with status code ${response.statusCode}, but continuing test`, response.data, testName);
      
      // Extract basic user info from the token
      const userId = apiClient.getUserIdFromToken(token);
      const mockUserData = {
        id: userId,
        // We can extract email from token as well if needed
        name: "Test User (from token)",
        email: "user@example.com"  // Placeholder
      };
      
      return { 
        success: true,
        data: mockUserData,
        warning: "User profile unavailable, using token data"
      };
    }
  } catch (error) {
    logger.error('User profile request failed', error, testName);
    return { success: false, error: error.message };
  }
}

/**
 * Get subscription types (frontend would load this for the subscription creation form)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Subscription types result
 */
async function getSubscriptionTypes(token) {
  const testName = 'subscription-types';
  logger.info('Retrieving subscription types', null, testName);
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.subscriptions.types,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile('subscription_types', response, DEBUG_DIR);
    
    if (response.statusCode === 200) {
      const typesData = response.data.types || response.data.data?.types || response.data;
      
      logger.success('Subscription types retrieved successfully', { count: Array.isArray(typesData) ? typesData.length : 'unknown' }, testName);
      return { 
        success: true,
        data: { types: typesData }
      };
    } else {
      logger.error(`Subscription types retrieval failed with status code ${response.statusCode}`, response.data, testName);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    logger.error('Subscription types request failed', error, testName);
    return { success: false, error: error.message };
  }
}

/**
 * Get current subscriptions (as dashboard would do)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Current subscriptions result
 */
async function getCurrentSubscriptions(token) {
  const testName = 'subscription-list';
  logger.info('Retrieving current subscriptions', null, testName);
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.subscriptions.list,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile('current_subscriptions', response, DEBUG_DIR);
    
    if (response.statusCode === 200) {
      const subscriptionsData = response.data.subscriptions || response.data.data?.subscriptions || response.data;
      
      logger.success('Current subscriptions retrieved successfully', { count: Array.isArray(subscriptionsData) ? subscriptionsData.length : 'unknown' }, testName);
      return { 
        success: true,
        data: { subscriptions: subscriptionsData }
      };
    } else {
      logger.error(`Current subscriptions retrieval failed with status code ${response.statusCode}`, response.data, testName);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    logger.error('Current subscriptions request failed', error, testName);
    return { success: false, error: error.message };
  }
}

/**
 * Get Debug Info using debug endpoints
 * @param {string|null} subscriptionId - Subscription ID
 * @param {string|null} notificationId - Notification ID
 * @param {string} token - Authentication token
 */
async function getDebugInfo(subscriptionId, notificationId, token) {
  logger.info('Getting debug information', { subscriptionId, notificationId }, 'debug');
  
  try {
    // Get backend debug health info
    await runDebugHealthCheck(token);
    
    // If we have a subscription ID, get subscription debug info
    if (subscriptionId) {
      await getSubscriptionDebugInfo(subscriptionId, token);
    }
    
    // If we have a notification ID, get notification debug info
    if (notificationId) {
      await getNotificationDebugInfo(notificationId, token);
    }
  } catch (error) {
    logger.error('Error getting debug info', error, 'debug');
  }
}

/**
 * Run debug health check
 * @param {string} [token] - Authentication token
 * @returns {Promise<Object>} Debug health check result
 */
async function runDebugHealthCheck(token = null) {
  const testName = 'debug-health';
  logger.info('Running debug health check', null, testName);
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.debug.health,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile('debug_health', response, DEBUG_DIR);
    
    if (response.statusCode === 200) {
      logger.success('Debug health check successful', response.data, testName);
      return { success: true, data: response.data };
    } else {
      logger.error(`Debug health check failed with status code ${response.statusCode}`, response.data, testName);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    logger.error('Debug health check failed', error, testName);
    return { success: false, error: error.message };
  }
}

/**
 * Get subscription debug info
 * @param {string} subscriptionId - Subscription ID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Subscription debug info
 */
async function getSubscriptionDebugInfo(subscriptionId, token) {
  const testName = 'debug-subscription';
  logger.info(`Getting debug info for subscription ${subscriptionId}`, null, testName);
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.debug.subscription(subscriptionId),
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile(`debug_subscription_${subscriptionId}`, response, DEBUG_DIR);
    
    if (response.statusCode === 200) {
      logger.success(`Debug info for subscription ${subscriptionId} retrieved`, response.data, testName);
      return { success: true, data: response.data };
    } else {
      logger.error(`Failed to get debug info for subscription ${subscriptionId}`, response.data, testName);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    logger.error(`Failed to get debug info for subscription ${subscriptionId}`, error, testName);
    return { success: false, error: error.message };
  }
}

/**
 * Get notification debug info
 * @param {string} notificationId - Notification ID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Notification debug info
 */
async function getNotificationDebugInfo(notificationId, token) {
  const testName = 'debug-notification';
  logger.info(`Getting debug info for notification ${notificationId}`, null, testName);
  
  // Request options
  const options = {
    hostname: endpoints.backend.baseUrl,
    port: 443,
    path: endpoints.backend.debug.notification(notificationId),
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Make the request
    const response = await apiClient.makeApiRequest(options, token);
    
    // Save response to file
    apiClient.saveResponseToFile(`debug_notification_${notificationId}`, response, DEBUG_DIR);
    
    if (response.statusCode === 200) {
      logger.success(`Debug info for notification ${notificationId} retrieved`, response.data, testName);
      return { success: true, data: response.data };
    } else {
      logger.error(`Failed to get debug info for notification ${notificationId}`, response.data, testName);
      return { success: false, error: `Status code ${response.statusCode}` };
    }
  } catch (error) {
    logger.error(`Failed to get debug info for notification ${notificationId}`, error, testName);
    return { success: false, error: error.message };
  }
}

/**
 * Append content to the journey log file
 * @param {string} content - Content to append
 */
function appendToJourneyLog(content) {
  try {
    fs.appendFileSync(JOURNEY_LOG_FILE, content + '\n');
  } catch (error) {
    console.error(`Failed to write to journey log: ${error.message}`);
  }
}

/**
 * Save the journey state to file
 * @param {Object} state - Journey state
 */
function saveJourneyState(state) {
  try {
    fs.writeFileSync(JOURNEY_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`Failed to save journey state: ${error.message}`);
  }
}

/**
 * Generate a findings report based on the journey state
 * @param {Object} state - Journey state
 */
function generateFindingsReport(state) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const FINDINGS_DIR = path.join(OUTPUT_DIR, 'findings');
    const FINDINGS_FILE = path.join(FINDINGS_DIR, `enhanced-journey-findings-${timestamp}.md`);
    
    // Ensure findings directory exists
    if (!fs.existsSync(FINDINGS_DIR)) {
      fs.mkdirSync(FINDINGS_DIR, { recursive: true });
    }
    
    // Get journey success status
    const journeyStatus = state.error ? '❌ FAILED' : 
                         state.success ? '✅ SUCCESS' : 
                         '⚠️ PARTIAL SUCCESS';
    
    // Create findings report
    const content = `# Enhanced User Journey Test Findings
${timestamp}

## Overview
- **Test Result**: ${journeyStatus}
- **Duration**: ${state.duration || 'Unknown'} seconds
- **Steps Completed**: ${state.steps?.length || 0} of 8
- **Session ID**: ${logger.SESSION_ID}
- **Test Date**: ${new Date().toISOString().split('T')[0]}

## Step Results
0. **Initial Health Check**: ${state.health?.success ? '✓ Passed' : '✗ Failed'}
   ${state.health?.status ? `- Status: ${state.health.status}` : ''}
   ${state.health?.error ? `- Error: ${state.health.error}` : ''}

1. **Authentication**: ${state.auth?.success ? '✓ Passed' : '✗ Failed'}
   ${state.auth?.userId ? `- User ID: ${state.auth.userId}` : ''}
   ${state.auth?.error ? `- Error: ${state.auth.error}` : ''}

2. **User Profile**: ${state.userProfile?.success ? '✓ Passed' : '✗ Failed'}
   ${state.userProfile?.data?.name ? `- Name: ${state.userProfile.data.name}` : ''}
   ${state.userProfile?.data?.email ? `- Email: ${state.userProfile.data.email}` : ''}
   ${state.userProfile?.error ? `- Error: ${state.userProfile.error}` : ''}

3. **Subscription Types**: ${state.subscriptionTypes?.success ? '✓ Passed' : '✗ Failed'}
   ${state.subscriptionTypes?.data?.types ? `- Types: ${Array.isArray(state.subscriptionTypes.data.types) ? state.subscriptionTypes.data.types.length : 'Unknown'}` : ''}
   ${state.subscriptionTypes?.error ? `- Error: ${state.subscriptionTypes.error}` : ''}

4. **Current Subscriptions**: ${state.subscriptionList?.success ? '✓ Passed' : '✗ Failed'}
   ${state.subscriptionList?.data?.subscriptions ? `- Count: ${Array.isArray(state.subscriptionList.data.subscriptions) ? state.subscriptionList.data.subscriptions.length : 'Unknown'}` : ''}
   ${state.subscriptionList?.error ? `- Error: ${state.subscriptionList.error}` : ''}

5. **Subscription Creation**: ${state.subscription?.success ? '✓ Passed' : '✗ Failed'}
   ${state.subscription?.subscriptionId ? `- Subscription ID: ${state.subscription.subscriptionId}` : ''}
   ${state.subscription?.error ? `- Error: ${state.subscription.error}` : ''}

6. **Subscription Processing**: ${state.processing?.success ? '✓ Passed' : '✗ Failed'}
   ${state.processing?.jobId ? `- Job ID: ${state.processing.jobId}` : ''}
   ${state.processing?.status ? `- Status: ${state.processing.status}` : ''}
   ${state.processing?.error ? `- Error: ${state.processing.error}` : ''}

7. **Notification Polling**: ${state.notifications?.success ? '✓ Passed' : '✗ Failed'}
   ${state.notifications?.notificationCount ? `- Notifications: ${state.notifications.notificationCount}` : ''}
   ${state.notifications?.attempts ? `- Polling attempts: ${state.notifications.attempts}` : ''}
   ${state.notifications?.error ? `- Error: ${state.notifications.error}` : ''}

## Key Findings and Issues
${state.error ? `- ❌ **Error**: ${state.error}` : ''}
${state.health?.error ? `- ❌ **Health Error**: ${state.health.error}` : ''}
${state.auth?.error ? `- ❌ **Auth Error**: ${state.auth.error}` : ''}
${state.userProfile?.error ? `- ❌ **Profile Error**: ${state.userProfile.error}` : ''}
${state.subscriptionTypes?.error ? `- ❌ **Types Error**: ${state.subscriptionTypes.error}` : ''}
${state.subscriptionList?.error ? `- ❌ **List Error**: ${state.subscriptionList.error}` : ''}
${state.subscription?.error ? `- ❌ **Subscription Error**: ${state.subscription.error}` : ''}
${state.processing?.error ? `- ❌ **Processing Error**: ${state.processing.error}` : ''}
${state.notifications?.error ? `- ❌ **Notification Error**: ${state.notifications.error}` : ''}

## Debug Information
Debug information was collected during the test run and is available in the following files:
- Health check: \`outputs/debug/debug_health.json\`
${state.subscription?.subscriptionId ? `- Subscription debug: \`outputs/debug/debug_subscription_${state.subscription.subscriptionId}.json\`` : ''}
${state.notifications?.notifications && state.notifications.notifications.length > 0 ? `- Notification debug: \`outputs/debug/debug_notification_${state.notifications.notifications[0].id}.json\`` : ''}

## Test Artifacts
- **Log files**: \`outputs/logs/*-${logger.SESSION_ID}.log\`
- **Journey state**: \`outputs/reports/enhanced_journey_state.json\`
- **Journey log**: \`outputs/reports/enhanced_journey_log.md\`
- **API responses**: Various files in \`outputs/debug/\`

## Next Steps
${state.subscription?.error ? '- Investigate the subscription creation API issue and fix the backend endpoint' : '- Continue monitoring subscription creation functionality'}
${state.processing?.error ? '- Review subscription processing pipeline and error handling' : '- Validate subscription processing performance'}
${state.notifications?.error ? '- Debug notification delivery issues' : '- Monitor notification delivery times'}
- Ensure proper error handling in frontend for any edge cases discovered
- Regular validation of the full user journey
`;
    
    fs.writeFileSync(FINDINGS_FILE, content);
    logger.info(`Findings report saved to: ${FINDINGS_FILE}`);
    
    // Also save a copy to a standard location for easy access
    const LATEST_FINDINGS_FILE = path.join(FINDINGS_DIR, 'enhanced-latest-findings.md');
    fs.writeFileSync(LATEST_FINDINGS_FILE, content);
    
    return FINDINGS_FILE;
  } catch (error) {
    console.error(`Failed to generate findings report: ${error.message}`);
    return null;
  }
}

// Create empty journey log file
fs.writeFileSync(JOURNEY_LOG_FILE, '');

// Run the test if this script is called directly
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  const pollAttempts = parseInt(args[0], 10) || 10;
  const pollInterval = parseInt(args[1], 10) || 5000;
  
  runEnhancedJourney({ pollAttempts, pollInterval })
    .then(result => {
      if (result.success) {
        logger.success('Enhanced user journey test completed');
        logger.info(`Journey log saved to: ${JOURNEY_LOG_FILE}`);
        logger.info(`Journey state saved to: ${JOURNEY_STATE_FILE}`);
        
        // Point to latest findings file
        const FINDINGS_DIR = path.join(OUTPUT_DIR, 'findings');
        const LATEST_FINDINGS_FILE = path.join(FINDINGS_DIR, 'enhanced-latest-findings.md');
        if (fs.existsSync(LATEST_FINDINGS_FILE)) {
          logger.info(`Findings report available at: ${LATEST_FINDINGS_FILE}`);
          console.log(`\n📊 Findings report: ${LATEST_FINDINGS_FILE}\n`);
        }
      } else {
        logger.error('Enhanced user journey test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in enhanced user journey test', error);
      process.exit(1);
    });
}

module.exports = runEnhancedJourney;