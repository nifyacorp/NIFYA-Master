/**
 * API Explorer Test Runner
 * 
 * This script runs tests for the API explorer and documentation endpoints.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import test suite
const apiExplorerTest = require('./tests/explorer/api-explorer');

// Output directory for reports
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');
const SUMMARY_FILE = path.join(REPORT_DIR, 'explorer-tests-summary.md');

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
  const summary = `# NIFYA API Explorer Test Results

**Test Time:** ${timestamp}

## Overview

This test suite validates the API explorer endpoints that provide documentation for the API.

## Test Flow

1. **API Explorer Listing** 
   - Get list of available API endpoints
   - Verify proper format and structure

2. **API Endpoint Details**
   - Get details for a specific API endpoint
   - Validate documentation structure

## Test Results

| Test | Status | Details |
|------|--------|---------|
${Object.entries(results).map(([name, result]) => 
  `| ${name} | ${result.success ? '✅ PASSED' : '❌ FAILED'} | ${result.details ? JSON.stringify(result.details) : result.error || ''} |`
).join('\n')}

## System Health Assessment

${determineSystemHealth(results)}

## Issues and Recommendations

${generateRecommendations(results)}

---
Generated on: ${timestamp}
`;

  await fs.writeFile(SUMMARY_FILE, summary);
  logger.info(`Generated summary report at ${SUMMARY_FILE}`);
  return SUMMARY_FILE;
}

// Determine system health based on test results
function determineSystemHealth(results) {
  let passedCount = 0;
  let totalCount = 0;
  
  for (const result of Object.values(results)) {
    totalCount++;
    if (result.success) {
      passedCount++;
    }
  }
  
  const successRate = (passedCount / totalCount) * 100;
  
  if (successRate >= 90) {
    return `### ✅ EXCELLENT (${successRate.toFixed(2)}%)
The API explorer is functioning well with high reliability.`;
  } else if (successRate >= 75) {
    return `### ✅ GOOD (${successRate.toFixed(2)}%)
The API explorer is working but has some minor issues.`;
  } else if (successRate >= 50) {
    return `### ⚠️ MODERATE ISSUES (${successRate.toFixed(2)}%)
The API explorer has significant issues that need attention.`;
  } else {
    return `### ❌ CRITICAL ISSUES (${successRate.toFixed(2)}%)
The API explorer has critical failures and requires immediate attention.`;
  }
}

// Generate recommendations based on test results
function generateRecommendations(results) {
  // Find failing tests
  const failedTests = Object.entries(results)
    .filter(([_, result]) => !result.success)
    .map(([name, result]) => ({
      name,
      error: result.error || 'Unknown error'
    }));
  
  // Find warnings
  const warningTests = Object.entries(results)
    .filter(([_, result]) => result.warning)
    .map(([name, result]) => ({
      name,
      warning: result.warning
    }));
  
  if (failedTests.length === 0 && warningTests.length === 0) {
    return `### No Issues Detected
All API explorer endpoints are working correctly. No action required.`;
  }
  
  let recommendations = "";
  
  if (failedTests.length > 0) {
    recommendations += `### Failed Tests
${failedTests.map(test => `- **${test.name}**: ${test.error}`).join('\n')}

`;
  }
  
  if (warningTests.length > 0) {
    recommendations += `### Warnings
${warningTests.map(test => `- **${test.name}**: ${test.warning}`).join('\n')}

`;
  }
  
  recommendations += `### Recommended Actions
- ${failedTests.length > 0 ? 'Fix API explorer endpoint issues first' : 'Address API explorer warnings'}
- Ensure proper documentation is available for all endpoints
- Check that API endpoint details are correctly formatted
- Verify that the explorer endpoints are accessible without authentication`;
  
  return recommendations;
}

// Run the explorer tests
async function runExplorerTests() {
  logger.info('Starting API explorer tests');
  
  // Results object to store test outcomes
  const results = {};
  
  try {
    // Run API Explorer Test
    logger.info('Running API Explorer test...');
    results['API Explorer'] = await apiExplorerTest();
    
    // Generate summary report
    const summaryPath = await generateSummaryReport(results);
    
    return {
      results,
      summaryPath
    };
  } catch (error) {
    logger.error('Error running API explorer tests:', error);
    return {
      error: error.message
    };
  }
}

// Run if executed directly
if (require.main === module) {
  runExplorerTests()
    .then(({ results, summaryPath }) => {
      if (results) {
        const successCount = Object.values(results).filter(r => r.success).length;
        const totalCount = Object.keys(results).length;
        
        console.log(`\nAPI Explorer tests completed!`);
        console.log(`Overall Status: ${successCount === totalCount ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Success Rate: ${(successCount / totalCount * 100).toFixed(2)}%`);
        
        console.log(`\nSummary report saved to: ${summaryPath}`);
        
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
        
        process.exit(successCount === totalCount ? 0 : 1);
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
  module.exports = runExplorerTests;
}