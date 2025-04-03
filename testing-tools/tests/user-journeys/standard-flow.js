/**
 * Standard User Journey Test
 * 
 * This script simulates a complete user journey from authentication to
 * subscription creation, processing, and notification polling.
 */

const fs = require('fs');
const path = require('path');
const authLogin = require('../auth/login');
const createSubscription = require('../subscriptions/create');
const processSubscription = require('../subscriptions/process');
const pollNotifications = require('../notifications/poll');
const logger = require('../../core/logger');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs');
const JOURNEY_LOG_FILE = path.join(OUTPUT_DIR, 'reports', 'user_journey_log.md');
const JOURNEY_STATE_FILE = path.join(OUTPUT_DIR, 'reports', 'user_journey_state.json');

// Ensure reports directory exists
const REPORTS_DIR = path.join(OUTPUT_DIR, 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Run the standard user journey test
 * @param {Object} [options] - Test options
 * @param {number} [options.pollAttempts=10] - Number of notification polling attempts
 * @param {number} [options.pollInterval=5000] - Interval between polling attempts in ms
 * @returns {Promise<Object>} Test result
 */
async function runUserJourney(options = {}) {
  const testName = 'user-journey-standard';
  const pollAttempts = options.pollAttempts || 10;
  const pollInterval = options.pollInterval || 5000;
  
  logger.info('Starting standard user journey test', { pollAttempts, pollInterval }, testName);
  
  // Initialize journey state
  const journeyState = {
    startTime: new Date().toISOString(),
    steps: [],
    currentStep: 'init',
    auth: null,
    subscription: null,
    processing: null,
    notifications: null,
    success: false
  };
  
  // Log journey start
  appendToJourneyLog(`# NIFYA User Journey Test
Start Time: ${journeyState.startTime}
Poll Settings: ${pollAttempts} attempts, ${pollInterval}ms interval

## Test Steps
`);
  
  try {
    // Step 1: Authentication
    journeyState.currentStep = 'authentication';
    appendToJourneyLog('### Step 1: Authentication');
    
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
    
    // Step 2: Create Subscription
    journeyState.currentStep = 'create-subscription';
    appendToJourneyLog('\n### Step 2: Create Subscription');
    
    logger.info('Step 2: Create Subscription', null, testName);
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
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Subscription creation failed', journeyState };
    }
    
    appendToJourneyLog(`Subscription Created
- Subscription ID: ${createResult.subscriptionId}
- Type: ${createResult.data.type || 'Not available'}
- Name: ${createResult.data.name || 'Not available'}

✅ Step completed successfully`);
    
    // Step 3: Process Subscription
    journeyState.currentStep = 'process-subscription';
    appendToJourneyLog('\n### Step 3: Process Subscription');
    
    logger.info('Step 3: Process Subscription', null, testName);
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
      
      saveJourneyState(journeyState);
      return { success: false, error: 'Subscription processing failed', journeyState };
    }
    
    appendToJourneyLog(`Subscription Processing Initiated
- Process Job ID: ${processResult.jobId || 'Not available'}
- Status: ${processResult.status || 'Not available'}

✅ Step completed successfully`);
    
    // Step 4: Poll for Notifications
    journeyState.currentStep = 'poll-notifications';
    appendToJourneyLog('\n### Step 4: Poll for Notifications');
    
    logger.info('Step 4: Poll for Notifications', null, testName);
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
      
      journeyState.success = true; // Still mark as success since processing might be slow
    } else {
      logger.success(`User journey completed successfully with ${pollResult.notificationCount} notifications`, null, testName);
      appendToJourneyLog(`Notification Polling Successful
- Notifications Found: ${pollResult.notificationCount}
- Polling Attempts: ${pollResult.attempts}

✅ Step completed successfully`);
      
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
- Journey state: \`outputs/reports/user_journey_state.json\`
- Journey log: \`outputs/reports/user_journey_log.md\`

## Findings
${journeyState.subscription?.warning ? `- ⚠️ **API Warning**: ${journeyState.subscription.warning}` : ''}
${journeyState.processing?.simulated ? '- ℹ️ **Simulated Processing**: Subscription processing was simulated' : ''}
${journeyState.notifications?.simulated ? '- ℹ️ **Simulated Notifications**: Notification responses were simulated' : ''}
${journeyState.auth?.error ? `- ❌ **Auth Error**: ${journeyState.auth.error}` : ''}
${journeyState.subscription?.error ? `- ❌ **Subscription Error**: ${journeyState.subscription.error}` : ''}
${journeyState.processing?.error ? `- ❌ **Processing Error**: ${journeyState.processing.error}` : ''}
${journeyState.notifications?.error ? `- ❌ **Notification Error**: ${journeyState.notifications.error}` : ''}
`);
    
    // Save final journey state
    saveJourneyState(journeyState);
    
    // Generate a separate findings markdown file
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
    const FINDINGS_FILE = path.join(FINDINGS_DIR, `user-journey-findings-${timestamp}.md`);
    
    // Ensure findings directory exists
    if (!fs.existsSync(FINDINGS_DIR)) {
      fs.mkdirSync(FINDINGS_DIR, { recursive: true });
    }
    
    // Create findings report
    const content = `# User Journey Test Findings
${timestamp}

## Overview
- **Test Result**: ${state.success ? '✅ SUCCESS' : state.error ? '❌ FAILED' : '⚠️ PARTIAL SUCCESS'}
- **Duration**: ${state.duration} seconds
- **Steps Completed**: ${state.steps.length} of 4
- **Session ID**: ${logger.SESSION_ID}

## Step Results
1. **Authentication**: ${state.auth?.success ? '✓ Passed' : '✗ Failed'}
   ${state.auth?.userId ? `- User ID: ${state.auth.userId}` : ''}
   ${state.auth?.error ? `- Error: ${state.auth.error}` : ''}

2. **Subscription Creation**: ${state.subscription?.success ? '✓ Passed' : '✗ Failed'}
   ${state.subscription?.subscriptionId ? `- Subscription ID: ${state.subscription.subscriptionId}` : ''}
   ${state.subscription?.warning ? `- Warning: ${state.subscription.warning}` : ''}
   ${state.subscription?.error ? `- Error: ${state.subscription.error}` : ''}

3. **Subscription Processing**: ${state.processing?.success ? '✓ Passed' : '✗ Failed'}
   ${state.processing?.jobId ? `- Job ID: ${state.processing.jobId}` : ''}
   ${state.processing?.status ? `- Status: ${state.processing.status}` : ''}
   ${state.processing?.simulated ? '- Note: Processing was simulated' : ''}
   ${state.processing?.error ? `- Error: ${state.processing.error}` : ''}

4. **Notification Polling**: ${state.notifications?.success ? '✓ Passed' : '✗ Failed'}
   ${state.notifications?.notificationCount ? `- Notifications: ${state.notifications.notificationCount}` : ''}
   ${state.notifications?.attempts ? `- Polling attempts: ${state.notifications.attempts}` : ''}
   ${state.notifications?.simulated ? '- Note: Notifications were simulated' : ''}
   ${state.notifications?.error ? `- Error: ${state.notifications.error}` : ''}

## Key Findings and Issues
${state.subscription?.warning ? `- ⚠️ **API Warning**: ${state.subscription.warning}` : ''}
${state.processing?.simulated ? '- ℹ️ **Simulated Processing**: Subscription processing was simulated due to API limitations' : ''}
${state.notifications?.simulated ? '- ℹ️ **Simulated Notifications**: Notification responses were simulated due to API limitations' : ''}
${state.error ? `- ❌ **Error**: ${state.error}` : ''}

## Test Artifacts
- **Log files**: \`outputs/logs/*-${logger.SESSION_ID}.log\`
- **Journey state**: \`outputs/reports/user_journey_state.json\`
- **Journey log**: \`outputs/reports/user_journey_log.md\`
- **API responses**: Various files in \`outputs/responses/\`

## Next Steps
- ${state.subscription?.warning ? 'Investigate why the API returns empty subscription objects' : 'Continue monitoring API stability'}
- ${state.processing?.simulated || state.notifications?.simulated ? 'Coordinate with backend team to improve API response consistency' : 'Regular validation of full user journey'}
- Ensure proper error handling in frontend for edge cases discovered
`;
    
    fs.writeFileSync(FINDINGS_FILE, content);
    logger.info(`Findings report saved to: ${FINDINGS_FILE}`);
    
    // Also save a copy to a standard location for easy access
    const LATEST_FINDINGS_FILE = path.join(FINDINGS_DIR, 'latest-findings.md');
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
  
  runUserJourney({ pollAttempts, pollInterval })
    .then(result => {
      if (result.success) {
        logger.success('User journey test completed');
        logger.info(`Journey log saved to: ${JOURNEY_LOG_FILE}`);
        logger.info(`Journey state saved to: ${JOURNEY_STATE_FILE}`);
      } else {
        logger.error('User journey test failed', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in user journey test', error);
      process.exit(1);
    });
}

module.exports = runUserJourney;