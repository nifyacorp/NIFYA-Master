/**
 * User Profile Management Test Suite
 * 
 * This script tests all user profile management endpoints including:
 * - Retrieving user profile
 * - Updating user profile information
 * - Managing notification settings
 * - Email preference settings
 * - Email testing functionality
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const apiClient = require('../../core/api-client');
const testAuth = require('../auth/login');

// Output directory for test results
const OUTPUT_DIR = path.join(__dirname, '../../outputs/user-tests');
const RESULTS_DIR = path.join(__dirname, '../../outputs/reports');

// Test payloads
const TEST_PROFILE_UPDATE = {
  displayName: "Test User Updated " + new Date().toISOString().substring(0, 10),
  preferences: {
    language: "en",
    timezone: "Europe/Madrid"
  }
};

const TEST_NOTIFICATION_SETTINGS = {
  inApp: true,
  email: {
    daily: true,
    immediate: true
  },
  pushEnabled: false
};

const TEST_EMAIL_PREFERENCES = {
  daily: true,
  immediate: true,
  digest: "weekly"
};

// Ensure output directories exist
async function ensureDirectories() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(RESULTS_DIR, { recursive: true });
}

// Save result to file
async function saveResult(filename, data) {
  await ensureDirectories();
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  logger.info(`Saved result to ${filePath}`);
  return filePath;
}

// Generate test report in markdown format
async function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportFilename = `user-profile-test-${timestamp}.md`;
  const reportPath = path.join(RESULTS_DIR, reportFilename);
  
  // Generate report content
  const report = `# User Profile Management API Test Results

**Test Time:** ${new Date().toISOString()}
**Overall Status:** ${results.overall.success ? '✅ PASSED' : '❌ FAILED'}
**Success Rate:** ${results.overall.successRate.toFixed(2)}%

## Test Summary

| Test | Status | Details |
|------|--------|---------|
${Object.entries(results.tests).map(([name, test]) => 
  `| ${name} | ${test.success ? '✅ PASSED' : '❌ FAILED'} | ${test.details || ''} |`
).join('\n')}

## Detailed Results

${Object.entries(results.tests).map(([name, test]) => `
### ${name}
- **Status:** ${test.success ? '✅ PASSED' : '❌ FAILED'}
- **Endpoint:** \`${test.endpoint || 'N/A'}\`
- **Method:** \`${test.method || 'N/A'}\`
${test.error ? `- **Error:** ${test.error}` : ''}
${test.details ? `- **Details:** ${test.details}` : ''}
${test.duration ? `- **Duration:** ${test.duration}ms` : ''}
${test.responseData ? `- **Response Data:**\n\`\`\`json\n${JSON.stringify(test.responseData, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

## User Profile Schema

${results.userProfileSchema ? `
\`\`\`json
${JSON.stringify(results.userProfileSchema, null, 2)}
\`\`\`
` : 'User profile schema could not be extracted from the test response.'}

## Email Preferences Schema

${results.emailPreferencesSchema ? `
\`\`\`json
${JSON.stringify(results.emailPreferencesSchema, null, 2)}
\`\`\`
` : 'Email preferences schema could not be extracted from the test response.'}

## Test Environment

- **Backend URL:** ${endpoints.backend.baseUrl}
- **Authentication URL:** ${endpoints.auth.baseUrl}
- **Test Date:** ${new Date().toISOString()}

## Next Steps
${results.overall.successRate === 100 ? 
  '- All user profile management APIs are working correctly! No further action needed.' : 
  '- Investigate and fix failing endpoints\n- Ensure proper error handling for user profile operations\n- Verify data consistency across profile update operations'}

---
Generated ${new Date().toISOString()}
`;

  await fs.writeFile(reportPath, report);
  logger.info(`Generated test report at ${reportPath}`);
  return reportPath;
}

// Extract schema from response data
function extractSchema(obj, depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return "...";
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.length > 0 ? [extractSchema(obj[0], depth + 1, maxDepth)] : [];
  }
  if (typeof obj === 'object') {
    const schema = {};
    for (const [key, value] of Object.entries(obj)) {
      schema[key] = extractSchema(value, depth + 1, maxDepth);
    }
    return schema;
  }
  return typeof obj;
}

// Run a full suite of user profile management tests
async function runUserProfileTests() {
  logger.info('Starting user profile management tests');
  const startTime = Date.now();

  // Test authentication first
  logger.info('Authenticating user...');
  const authResult = await testAuth();
  
  if (!authResult.success) {
    logger.error('Authentication failed, cannot continue tests', authResult.error);
    return {
      overall: {
        success: false,
        successRate: 0,
        duration: Date.now() - startTime,
        error: 'Authentication failed'
      },
      tests: {
        authentication: {
          success: false,
          error: authResult.error,
          details: 'Authentication failed, cannot proceed with user profile tests'
        }
      }
    };
  }
  
  // Authentication successful, extract credentials
  const token = authResult.token;
  const userId = authResult.userId;
  
  // Store test results
  const results = {
    overall: {
      success: true,
      successCount: 0,
      failureCount: 0,
      successRate: 0
    },
    tests: {
      authentication: {
        success: true,
        endpoint: `https://${endpoints.auth.baseUrl}${endpoints.auth.login}`,
        method: 'POST',
        details: 'Successfully authenticated user',
        duration: Date.now() - startTime
      }
    },
    userProfileSchema: null,
    emailPreferencesSchema: null
  };
  
  // Helper to make authenticated API requests
  async function makeAuthorizedRequest({ method, endpoint, data = null }) {
    try {
      const url = `https://${endpoints.backend.baseUrl}${endpoint}`;
      const response = await apiClient.makeApiRequest({
        url,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        data
      });
      
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      logger.error(`API request failed: ${method} ${endpoint}`, error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.message
      };
    }
  }
  
  // Helper to run a test and record results
  async function runTest({ name, endpoint, method, data = null, saveResponseData = false, testFn = null }) {
    logger.info(`Running test: ${name}`);
    const testStartTime = Date.now();
    
    try {
      let response;
      
      if (testFn) {
        // Use custom test function if provided
        response = await testFn();
      } else {
        // Otherwise make a standard API request
        response = await makeAuthorizedRequest({
          method,
          endpoint,
          data
        });
      }
      
      // Save response data
      await saveResult(`${name.toLowerCase().replace(/\s+/g, '-')}.json`, response);
      
      // Record test result
      const testResult = {
        success: response.success,
        endpoint,
        method,
        duration: Date.now() - testStartTime
      };
      
      if (saveResponseData && response.data) {
        testResult.responseData = response.data;
      }
      
      if (!response.success) {
        testResult.error = response.error || `Request failed with status ${response.status}`;
        testResult.details = response.details || JSON.stringify(response.data);
        results.overall.failureCount++;
      } else {
        testResult.details = `Request successful with status ${response.status}`;
        results.overall.successCount++;
      }
      
      results.tests[name] = testResult;
      logger.info(`Test ${name} ${testResult.success ? 'passed' : 'failed'}`);
      
      return response;
    } catch (error) {
      // Handle any unexpected errors
      const testResult = {
        success: false,
        endpoint,
        method,
        error: error.message,
        details: 'Unexpected error during test execution',
        duration: Date.now() - testStartTime
      };
      
      results.tests[name] = testResult;
      results.overall.failureCount++;
      
      logger.error(`Test ${name} failed with error:`, error);
      return { success: false, error: error.message };
    }
  }

  // Test 1: Get User Profile
  const profileResult = await runTest({
    name: 'Get User Profile',
    endpoint: endpoints.backend.user.profile,
    method: 'GET',
    saveResponseData: true
  });
  
  // Extract schema if successful
  if (profileResult.success && profileResult.data) {
    const profileData = profileResult.data.data || profileResult.data;
    results.userProfileSchema = extractSchema(profileData);
  }
  
  // Test 2: Update User Profile
  await runTest({
    name: 'Update User Profile',
    endpoint: endpoints.backend.user.updateProfile,
    method: 'PATCH',
    data: TEST_PROFILE_UPDATE
  });
  
  // Test 3: Verify Profile Updates
  await runTest({
    name: 'Verify Profile Updates',
    endpoint: endpoints.backend.user.profile,
    method: 'GET',
    testFn: async () => {
      const response = await makeAuthorizedRequest({
        method: 'GET',
        endpoint: endpoints.backend.user.profile
      });
      
      if (!response.success) return response;
      
      // Check if our updates were applied
      const profile = response.data.data || response.data;
      const displayNameUpdated = profile.displayName === TEST_PROFILE_UPDATE.displayName;
      
      if (!displayNameUpdated) {
        response.success = false;
        response.error = 'Profile update verification failed';
        response.details = 'Profile does not contain the updated information';
        logger.warn('Profile update verification failed - name was not updated correctly');
      }
      
      return response;
    }
  });
  
  // Test 4: Update Notification Settings
  await runTest({
    name: 'Update Notification Settings',
    endpoint: endpoints.backend.user.notificationSettings,
    method: 'PATCH',
    data: TEST_NOTIFICATION_SETTINGS
  });
  
  // Test 5: Get Email Preferences
  const emailPrefsResult = await runTest({
    name: 'Get Email Preferences',
    endpoint: endpoints.backend.user.emailPreferences,
    method: 'GET',
    saveResponseData: true
  });
  
  // Extract schema if successful
  if (emailPrefsResult.success && emailPrefsResult.data) {
    const prefsData = emailPrefsResult.data.data || emailPrefsResult.data;
    results.emailPreferencesSchema = extractSchema(prefsData);
  }
  
  // Test 6: Update Email Preferences
  await runTest({
    name: 'Update Email Preferences',
    endpoint: endpoints.backend.user.emailPreferences,
    method: 'PATCH',
    data: TEST_EMAIL_PREFERENCES
  });
  
  // Test 7: Verify Email Preferences Update
  await runTest({
    name: 'Verify Email Preferences Update',
    endpoint: endpoints.backend.user.emailPreferences,
    method: 'GET',
    testFn: async () => {
      const response = await makeAuthorizedRequest({
        method: 'GET',
        endpoint: endpoints.backend.user.emailPreferences
      });
      
      if (!response.success) return response;
      
      // Check if our updates were applied
      const prefs = response.data.data || response.data;
      const dailyUpdated = prefs.daily === TEST_EMAIL_PREFERENCES.daily;
      const immediateUpdated = prefs.immediate === TEST_EMAIL_PREFERENCES.immediate;
      
      if (!dailyUpdated || !immediateUpdated) {
        response.success = false;
        response.error = 'Email preferences update verification failed';
        response.details = 'Email preferences do not contain the updated information';
        logger.warn('Email preferences update verification failed - settings were not updated correctly');
      }
      
      return response;
    }
  });
  
  // Test 8: Send Test Email (if available)
  await runTest({
    name: 'Send Test Email',
    endpoint: endpoints.backend.user.testEmail,
    method: 'POST',
    data: {
      email: authResult.user?.email || "test@example.com"
    }
  });
  
  // Calculate overall success rate
  const totalTests = results.overall.successCount + results.overall.failureCount;
  results.overall.successRate = (results.overall.successCount / totalTests) * 100;
  results.overall.success = results.overall.successRate >= 80; // Success if 80% or more tests pass
  results.overall.duration = Date.now() - startTime;
  
  // Generate and save test report
  const reportPath = await generateReport(results);
  
  return {
    results,
    reportPath,
    outputDir: OUTPUT_DIR
  };
}

// Run tests if executed directly
if (require.main === module) {
  runUserProfileTests()
    .then(({ results, reportPath }) => {
      console.log(`\nUser Profile Management Test Suite Complete!`);
      console.log(`Overall Status: ${results.overall.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Success Rate: ${results.overall.successRate.toFixed(2)}%`);
      console.log(`${results.overall.successCount} tests passed, ${results.overall.failureCount} tests failed`);
      console.log(`\nDetailed report saved to: ${reportPath}`);
      
      // Exit with appropriate code
      process.exit(results.overall.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running user profile management tests:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = runUserProfileTests;
}