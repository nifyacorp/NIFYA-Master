/**
 * Notification Management Test Suite
 * 
 * This script tests all notification management endpoints including:
 * - Retrieving notifications with filtering
 * - Marking notifications as read/unread
 * - Deleting notifications
 * - Getting notification statistics
 * - Working with notification activity
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const apiClient = require('../../core/api-client');
const testAuth = require('../auth/login');

// Output directory for test results
const OUTPUT_DIR = path.join(__dirname, '../../outputs/notification-tests');
const RESULTS_DIR = path.join(__dirname, '../../outputs/reports');

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
  const reportFilename = `notification-management-test-${timestamp}.md`;
  const reportPath = path.join(RESULTS_DIR, reportFilename);
  
  // Generate report content
  const report = `# Notification Management API Test Results

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

## Notification Schema

${results.notificationSchema ? `
\`\`\`json
${JSON.stringify(results.notificationSchema, null, 2)}
\`\`\`
` : 'Notification schema could not be extracted from the test response.'}

## Stats Schema

${results.statsSchema ? `
\`\`\`json
${JSON.stringify(results.statsSchema, null, 2)}
\`\`\`
` : 'Stats schema could not be extracted from the test response.'}

## Activity Schema

${results.activitySchema ? `
\`\`\`json
${JSON.stringify(results.activitySchema, null, 2)}
\`\`\`
` : 'Activity schema could not be extracted from the test response.'}

## Query Parameter Testing Results

${results.queryParameterResults ? `
| Parameter | Value | Effect | Status |
|-----------|-------|--------|--------|
${results.queryParameterResults.map(param => 
  `| ${param.name} | ${param.value} | ${param.effect} | ${param.success ? '✅ WORKS' : '❌ FAILED'} |`
).join('\n')}
` : 'Query parameter tests were not performed or did not yield valid results.'}

## Test Environment

- **Backend URL:** ${endpoints.backend.baseUrl}
- **Authentication URL:** ${endpoints.auth.baseUrl}
- **Test Date:** ${new Date().toISOString()}

## Next Steps
${results.overall.successRate === 100 ? 
  '- All notification management APIs are working correctly! No further action needed.' : 
  '- Investigate and fix failing endpoints\n- Ensure proper error handling for notification operations\n- Verify data consistency across notification operations'}

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

// Verify notification was marked as read
async function verifyNotificationRead(token, userId, notificationId) {
  try {
    // Get notifications
    const url = `https://${endpoints.backend.baseUrl}${endpoints.backend.notifications.list}`;
    const response = await apiClient.makeApiRequest({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    });
    
    if (!response.success && response.status !== 200) {
      return { success: false, error: 'Failed to get notifications' };
    }
    
    // Find the notification
    const notifications = response.data?.data || response.data?.notifications || response.data || [];
    
    if (Array.isArray(notifications)) {
      const notification = notifications.find(n => n.id === notificationId || n._id === notificationId);
      
      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }
      
      // Check if it's marked as read
      const isRead = notification.read === true || notification.read_at != null;
      
      return { 
        success: isRead, 
        error: isRead ? null : 'Notification was not marked as read'
      };
    }
    
    return { success: false, error: 'Invalid notifications data' };
  } catch (error) {
    logger.error('Error verifying notification read status:', error);
    return { success: false, error: error.message };
  }
}

// Run a full suite of notification management tests
async function runNotificationTests() {
  logger.info('Starting notification management tests');
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
          details: 'Authentication failed, cannot proceed with notification tests'
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
    notificationSchema: null,
    statsSchema: null,
    activitySchema: null,
    queryParameterResults: []
  };
  
  // Helper to make authenticated API requests
  async function makeAuthorizedRequest({ method, endpoint, data = null, params = null }) {
    try {
      let url = `https://${endpoints.backend.baseUrl}${endpoint}`;
      
      // Add query parameters if provided
      if (params) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== null && value !== undefined) {
            queryParams.append(key, value);
          }
        }
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
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
        data: response.data,
        url
      };
    } catch (error) {
      logger.error(`API request failed: ${method} ${endpoint}`, error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.message,
        url: `https://${endpoints.backend.baseUrl}${endpoint}`
      };
    }
  }
  
  // Helper to run a test and record results
  async function runTest({ name, endpoint, method, data = null, params = null, saveResponseData = false, testFn = null }) {
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
          data,
          params
        });
      }
      
      // Save response data
      await saveResult(`${name.toLowerCase().replace(/\s+/g, '-')}.json`, response);
      
      // Record test result
      const testResult = {
        success: response.success,
        endpoint,
        method,
        duration: Date.now() - testStartTime,
        params: params
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

  // Test 1: Get Notifications
  const notificationsResult = await runTest({
    name: 'Get Notifications',
    endpoint: endpoints.backend.notifications.list,
    method: 'GET',
    saveResponseData: true
  });
  
  // Extract schema if successful
  if (notificationsResult.success && notificationsResult.data) {
    const notificationsData = notificationsResult.data.data || 
                             notificationsResult.data.notifications || 
                             notificationsResult.data;
                             
    if (Array.isArray(notificationsData) && notificationsData.length > 0) {
      results.notificationSchema = extractSchema(notificationsData[0]);
    }
  }
  
  // Store notification IDs for later tests
  let notificationIds = [];
  if (notificationsResult.success && notificationsResult.data) {
    const notificationsData = notificationsResult.data.data || 
                             notificationsResult.data.notifications || 
                             notificationsResult.data;
                             
    if (Array.isArray(notificationsData)) {
      notificationIds = notificationsData
        .map(n => n.id || n._id)
        .filter(id => id);
    }
  }
  
  // Test 2: Get Notifications with Query Parameters - Limit
  const limitQueryResult = await runTest({
    name: 'Get Notifications with Limit',
    endpoint: endpoints.backend.notifications.list,
    method: 'GET',
    params: { limit: 3 }
  });
  
  // Record query parameter result
  if (limitQueryResult.success) {
    const notificationsData = limitQueryResult.data.data || 
                             limitQueryResult.data.notifications || 
                             limitQueryResult.data || [];
    const correctLimit = Array.isArray(notificationsData) && notificationsData.length <= 3;
    
    results.queryParameterResults.push({
      name: 'limit',
      value: 3,
      effect: `Returned ${Array.isArray(notificationsData) ? notificationsData.length : 'unknown'} notifications`,
      success: correctLimit
    });
  } else {
    results.queryParameterResults.push({
      name: 'limit',
      value: 3,
      effect: 'Query failed',
      success: false
    });
  }
  
  // Test 3: Get Notifications with Query Parameters - Page
  await runTest({
    name: 'Get Notifications with Page',
    endpoint: endpoints.backend.notifications.list,
    method: 'GET',
    params: { page: 2, limit: 5 }
  });
  
  // Test 4: Get Notifications with Unread Filter
  const unreadQueryResult = await runTest({
    name: 'Get Notifications with Unread Filter',
    endpoint: endpoints.backend.notifications.list,
    method: 'GET',
    params: { unread: true }
  });
  
  // Record query parameter result
  if (unreadQueryResult.success) {
    const notificationsData = unreadQueryResult.data.data || 
                             unreadQueryResult.data.notifications || 
                             unreadQueryResult.data || [];
    
    const onlyUnread = Array.isArray(notificationsData) && 
                       notificationsData.every(n => n.read === false || n.read_at === null);
    
    results.queryParameterResults.push({
      name: 'unread',
      value: 'true',
      effect: `Returned ${Array.isArray(notificationsData) ? notificationsData.length : 'unknown'} unread notifications`,
      success: onlyUnread
    });
  } else {
    results.queryParameterResults.push({
      name: 'unread',
      value: 'true',
      effect: 'Query failed',
      success: false
    });
  }
  
  // Test 5: Get Notification Statistics
  const statsResult = await runTest({
    name: 'Get Notification Statistics',
    endpoint: endpoints.backend.notifications.stats,
    method: 'GET',
    saveResponseData: true
  });
  
  // Extract schema if successful
  if (statsResult.success && statsResult.data) {
    const statsData = statsResult.data.data || statsResult.data;
    results.statsSchema = extractSchema(statsData);
  }
  
  // Test 6: Get Notification Activity
  const activityResult = await runTest({
    name: 'Get Notification Activity',
    endpoint: endpoints.backend.notifications.activity,
    method: 'GET',
    saveResponseData: true
  });
  
  // Extract schema if successful
  if (activityResult.success && activityResult.data) {
    const activityData = activityResult.data.data || activityResult.data;
    results.activitySchema = extractSchema(activityData);
  }
  
  // Only run notification-specific tests if we have notification IDs
  if (notificationIds.length > 0) {
    const notificationId = notificationIds[0];
    
    // Test 7: Mark Notification as Read
    const markReadResult = await runTest({
      name: 'Mark Notification as Read',
      endpoint: endpoints.backend.notifications.markAsRead(notificationId),
      method: 'PATCH'
    });
    
    // Test 8: Verify Notification Read Status
    if (markReadResult.success) {
      await runTest({
        name: 'Verify Notification Read Status',
        endpoint: endpoints.backend.notifications.list,
        method: 'GET',
        testFn: async () => {
          const verifyResult = await verifyNotificationRead(token, userId, notificationId);
          return {
            success: verifyResult.success,
            error: verifyResult.error,
            data: { result: verifyResult.success ? 'Notification marked as read' : 'Notification not marked as read' }
          };
        }
      });
    }
    
    // Test 9: Delete Notification
    if (notificationIds.length > 1) {
      const deleteNotificationId = notificationIds[1];
      await runTest({
        name: 'Delete Notification',
        endpoint: endpoints.backend.notifications.delete(deleteNotificationId),
        method: 'DELETE'
      });
    }
  }
  
  // Test 10: Mark All Notifications as Read
  await runTest({
    name: 'Mark All Notifications as Read',
    endpoint: endpoints.backend.notifications.readAll,
    method: 'POST'
  });
  
  // Test 11: Verify All Notifications Read
  await runTest({
    name: 'Verify All Notifications Read',
    endpoint: endpoints.backend.notifications.list,
    method: 'GET',
    testFn: async () => {
      const response = await makeAuthorizedRequest({
        method: 'GET',
        endpoint: endpoints.backend.notifications.list
      });
      
      if (!response.success) return response;
      
      const notifications = response.data?.data || response.data?.notifications || response.data || [];
      
      if (!Array.isArray(notifications)) {
        return { 
          success: false, 
          error: 'Invalid notifications data',
          data: response.data
        };
      }
      
      // Check if all are marked as read
      const allRead = notifications.length === 0 || 
                     notifications.every(n => n.read === true || n.read_at != null);
      
      return { 
        success: allRead, 
        error: allRead ? null : 'Not all notifications are marked as read',
        data: { 
          all_read: allRead,
          total: notifications.length,
          unread: notifications.filter(n => !n.read && n.read_at == null).length
        }
      };
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
  runNotificationTests()
    .then(({ results, reportPath }) => {
      console.log(`\nNotification Management Test Suite Complete!`);
      console.log(`Overall Status: ${results.overall.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Success Rate: ${results.overall.successRate.toFixed(2)}%`);
      console.log(`${results.overall.successCount} tests passed, ${results.overall.failureCount} tests failed`);
      console.log(`\nDetailed report saved to: ${reportPath}`);
      
      // Exit with appropriate code
      process.exit(results.overall.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running notification management tests:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = runNotificationTests;
}