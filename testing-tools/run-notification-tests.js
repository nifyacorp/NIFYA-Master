/**
 * Notification API Test Runner
 * 
 * This script runs tests for all notification management endpoints.
 * It provides a command-line interface to run the tests and view results.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import test suites
const notificationTests = require('./tests/notifications/notification-management-tests');

// Output directory for reports
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');
const SUMMARY_FILE = path.join(REPORT_DIR, 'notification-tests-summary.md');

// Ensure report directory exists
async function ensureReportDir() {
  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
  } catch (err) {
    logger.warn(`Error creating report directory: ${err.message}`);
  }
}

// Generate a summary report
async function generateSummaryReport(results) {
  await ensureReportDir();
  
  const timestamp = new Date().toISOString();
  
  // Create summary content
  const summary = `# NIFYA Notification API Test Results

**Test Time:** ${timestamp}

## Overview

This test suite validates the notification management endpoints that allow users to view notifications, mark them as read, delete them, and see notification statistics and activity.

## Test Flow

1. **Notification Retrieval** 
   - Get all notifications
   - Test filtering with query parameters (limit, page, unread)
   - Get notification statistics
   - Get notification activity

2. **Notification Management**
   - Mark a notification as read
   - Verify read status
   - Delete a notification
   - Mark all notifications as read
   - Verify all notifications are read

## Test Results

| Status | Success Rate | Details |
|--------|--------------|---------|
| ${results.results.overall.success ? '✅ PASSED' : '❌ FAILED'} | ${results.results.overall.successRate.toFixed(2)}% | [View Detailed Report](${path.basename(results.reportPath)}) |

### Test Details

| Test | Status | Details |
|------|--------|---------|
${Object.entries(results.results.tests).map(([name, test]) => 
  `| ${name} | ${test.success ? '✅ PASSED' : '❌ FAILED'} | ${test.details || ''} |`
).join('\n')}

## Query Parameter Testing

This test suite specifically tested notification filtering through query parameters:

| Parameter | Value | Effect | Status |
|-----------|-------|--------|--------|
${results.results.queryParameterResults.map(param => 
  `| ${param.name} | ${param.value} | ${param.effect} | ${param.success ? '✅ WORKS' : '❌ FAILED'} |`
).join('\n')}

## Notification Schema

The notification objects contain the following structure:
\`\`\`json
${JSON.stringify(results.results.notificationSchema || {}, null, 2)}
\`\`\`

## Stats Schema

The notification statistics contain the following structure:
\`\`\`json
${JSON.stringify(results.results.statsSchema || {}, null, 2)}
\`\`\`

## Activity Schema

The notification activity contains the following structure:
\`\`\`json
${JSON.stringify(results.results.activitySchema || {}, null, 2)}
\`\`\`

## System Health Assessment

${determineSystemHealth(results.results)}

## Issues and Recommendations

${generateRecommendations(results.results)}

---
Generated on: ${timestamp}
`;

  await fs.writeFile(SUMMARY_FILE, summary);
  logger.info(`Generated summary report at ${SUMMARY_FILE}`);
  return SUMMARY_FILE;
}

// Determine system health based on test results
function determineSystemHealth(results) {
  const successRate = results.overall.successRate;
  
  if (successRate >= 90) {
    return `### ✅ EXCELLENT (${successRate.toFixed(2)}%)
The notification management system is functioning well with high reliability.`;
  } else if (successRate >= 75) {
    return `### ✅ GOOD (${successRate.toFixed(2)}%)
The notification management system is working but has some minor issues.`;
  } else if (successRate >= 50) {
    return `### ⚠️ MODERATE ISSUES (${successRate.toFixed(2)}%)
The notification management system has significant issues that need attention.`;
  } else {
    return `### ❌ CRITICAL ISSUES (${successRate.toFixed(2)}%)
The notification management system has critical failures and requires immediate attention.`;
  }
}

// Generate recommendations based on test results
function generateRecommendations(results) {
  // Find failing tests
  const failedTests = Object.entries(results.tests)
    .filter(([_, test]) => !test.success)
    .map(([name, test]) => ({
      name,
      endpoint: test.endpoint,
      method: test.method,
      error: test.error || 'Unknown error'
    }));
  
  if (failedTests.length === 0) {
    return `### No Issues Detected
All notification management endpoints are working correctly. No action required.`;
  }
  
  // Group issues by type
  const readManagementIssues = failedTests.filter(t => 
    t.name.includes('Mark') || 
    t.name.includes('Read') ||
    t.endpoint?.includes('/read')
  );
  
  const deletionIssues = failedTests.filter(t => 
    t.name.includes('Delete') || 
    t.method === 'DELETE'
  );
  
  const queryParameterIssues = failedTests.filter(t => 
    t.name.includes('with') && 
    (t.params || t.name.includes('Query') || t.name.includes('Filter'))
  );
  
  const retrievalIssues = failedTests.filter(t => 
    (t.method === 'GET' && !t.name.includes('Verify')) && 
    !queryParameterIssues.includes(t)
  );
  
  const verificationIssues = failedTests.filter(t => 
    t.name.includes('Verify')
  );
  
  let recommendations = "";
  
  if (retrievalIssues.length > 0) {
    recommendations += `### Notification Retrieval Issues
${retrievalIssues.map(f => `- **${f.name}** (${f.method} ${f.endpoint}): ${f.error}`).join('\n')}\n\n`;
  }
  
  if (readManagementIssues.length > 0) {
    recommendations += `### Read Status Management Issues
${readManagementIssues.map(f => `- **${f.name}** (${f.method} ${f.endpoint}): ${f.error}`).join('\n')}\n\n`;
  }
  
  if (deletionIssues.length > 0) {
    recommendations += `### Notification Deletion Issues
${deletionIssues.map(f => `- **${f.name}** (${f.method} ${f.endpoint}): ${f.error}`).join('\n')}\n\n`;
  }
  
  if (queryParameterIssues.length > 0) {
    recommendations += `### Query Parameter Issues
${queryParameterIssues.map(f => `- **${f.name}** (${f.method} ${f.endpoint}): ${f.error}`).join('\n')}\n\n`;
  }
  
  if (verificationIssues.length > 0) {
    recommendations += `### Verification Issues
${verificationIssues.map(f => `- **${f.name}**: ${f.error}`).join('\n')}\n\n`;
  }
  
  recommendations += `### Recommended Actions
- ${retrievalIssues.length > 0 ? 'Fix notification retrieval endpoints first' : 
     readManagementIssues.length > 0 ? 'Address read status management issues' :
     deletionIssues.length > 0 ? 'Resolve notification deletion problems' :
     'Verify data consistency across notification operations'}
- Ensure proper error handling for notification operations
- Verify database queries for notification filtering
- Test pagination functionality thoroughly
- Add more comprehensive validation for notification status changes`;
  
  return recommendations;
}

// Run the notification tests
async function runTests() {
  logger.info('Starting notification API tests');
  
  try {
    // Run the tests
    const results = await notificationTests();
    
    // Generate summary report
    const summaryPath = await generateSummaryReport(results);
    
    return {
      results,
      summaryPath
    };
  } catch (error) {
    logger.error('Error running notification tests:', error);
    return {
      error: error.message
    };
  }
}

// Run if executed directly
if (require.main === module) {
  runTests()
    .then(({ results, summaryPath }) => {
      if (results) {
        console.log(`\nNotification API tests completed!`);
        console.log(`Overall Status: ${results.results.overall.success ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Success Rate: ${results.results.overall.successRate.toFixed(2)}%`);
        
        console.log(`\nDetailed report saved to: ${results.reportPath}`);
        console.log(`Summary report saved to: ${summaryPath}`);
        
        // Display summary section
        fs.readFile(summaryPath, 'utf8')
          .then(content => {
            console.log('\nTest Summary:');
            // Display first part of the summary
            const lines = content.split('\n');
            const firstSection = lines.slice(0, Math.min(15, lines.length)).join('\n');
            console.log(firstSection);
            console.log('...');
          })
          .catch(() => {});
        
        process.exit(results.results.overall.success ? 0 : 1);
      } else {
        console.error('Tests completed with errors');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = runTests;
}