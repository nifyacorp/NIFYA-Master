/**
 * User Profile API Test Runner
 * 
 * This script runs tests for all user profile management endpoints.
 * It provides a command-line interface to run the tests and view results.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import test suites
const userProfileTests = require('./tests/user/user-profile-tests');

// Output directory for reports
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');
const SUMMARY_FILE = path.join(REPORT_DIR, 'user-profile-tests-summary.md');

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
  const summary = `# NIFYA User Profile API Test Results

**Test Time:** ${timestamp}

## Overview

This test suite validates the user profile management endpoints that allow users to view and update their profile information, notification settings, and email preferences.

## Test Flow

1. **Profile Management** 
   - Get user profile
   - Update profile information
   - Verify profile updates were applied

2. **Notification Settings**
   - Update notification preferences
   - Verify notification settings are saved correctly

3. **Email Preferences**
   - Get email notification preferences
   - Update email preferences
   - Verify email preference updates
   - Send test email (when available)

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

## User Profile Schema

The user profile contains the following structure:
\`\`\`json
${JSON.stringify(results.results.userProfileSchema || {}, null, 2)}
\`\`\`

## Email Preferences Schema

The email preferences contain the following structure:
\`\`\`json
${JSON.stringify(results.results.emailPreferencesSchema || {}, null, 2)}
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
The user profile management system is functioning well with high reliability.`;
  } else if (successRate >= 75) {
    return `### ✅ GOOD (${successRate.toFixed(2)}%)
The user profile management system is working but has some minor issues.`;
  } else if (successRate >= 50) {
    return `### ⚠️ MODERATE ISSUES (${successRate.toFixed(2)}%)
The user profile management system has significant issues that need attention.`;
  } else {
    return `### ❌ CRITICAL ISSUES (${successRate.toFixed(2)}%)
The user profile management system has critical failures and requires immediate attention.`;
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
All user profile management endpoints are working correctly. No action required.`;
  }
  
  // Group issues by type
  const dataConsistencyIssues = failedTests.filter(t => 
    t.name.includes('Verify') || 
    t.error.includes('verification failed')
  );
  
  const endpointFailures = failedTests.filter(t => 
    !t.name.includes('Verify') && 
    !t.error.includes('verification failed')
  );
  
  let recommendations = "";
  
  if (endpointFailures.length > 0) {
    recommendations += `### Endpoint Failures
${endpointFailures.map(f => `- **${f.name}** (${f.method} ${f.endpoint}): ${f.error}`).join('\n')}\n\n`;
  }
  
  if (dataConsistencyIssues.length > 0) {
    recommendations += `### Data Consistency Issues
${dataConsistencyIssues.map(f => `- **${f.name}**: ${f.error}`).join('\n')}\n\n`;
  }
  
  recommendations += `### Recommended Actions
- ${endpointFailures.length > 0 ? 'Fix failing endpoints first' : 'Verify data consistency across profile update operations'}
- Ensure proper error handling for user profile operations
- Validate data model consistency between client and server
- Check database connection and schema for user-related tables`;
  
  return recommendations;
}

// Run the user profile tests
async function runTests() {
  logger.info('Starting user profile API tests');
  
  try {
    // Run the tests
    const results = await userProfileTests();
    
    // Generate summary report
    const summaryPath = await generateSummaryReport(results);
    
    return {
      results,
      summaryPath
    };
  } catch (error) {
    logger.error('Error running user profile tests:', error);
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
        console.log(`\nUser Profile API tests completed!`);
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