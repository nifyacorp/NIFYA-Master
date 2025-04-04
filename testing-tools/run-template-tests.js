/**
 * Template API Test Runner
 * 
 * This script runs tests for all template-related endpoints.
 * It provides a command-line interface to run the tests and view results.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import test suites
const listTemplatesTest = require('./tests/subscriptions/templates');
const templateDetailsTest = require('./tests/templates/template-details');
const createTemplateTest = require('./tests/templates/create-template');
const subscribeFromTemplateTest = require('./tests/templates/subscribe-from-template');

// Output directory for reports
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');
const SUMMARY_FILE = path.join(REPORT_DIR, 'template-tests-summary.md');

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
  const summary = `# NIFYA Template API Test Results

**Test Time:** ${timestamp}

## Overview

This test suite validates the template management endpoints that allow users to view templates, get template details, create templates, and subscribe to templates.

## Test Flow

1. **Template Listing** 
   - Get list of available templates
   - Verify proper format and structure

2. **Template Details**
   - Get details for a specific template
   - Validate template structure

3. **Template Creation**
   - Create a new template
   - Verify template appears in listing

4. **Subscription from Template**
   - Create a subscription from an existing template
   - Verify subscription is created correctly

## Test Results

| Test | Status | Details |
|------|--------|---------|
${Object.entries(results).map(([name, result]) => 
  `| ${name} | ${result.success ? '✅ PASSED' : '❌ FAILED'} | ${result.details || result.error || ''} |`
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
The template management system is functioning well with high reliability.`;
  } else if (successRate >= 75) {
    return `### ✅ GOOD (${successRate.toFixed(2)}%)
The template management system is working but has some minor issues.`;
  } else if (successRate >= 50) {
    return `### ⚠️ MODERATE ISSUES (${successRate.toFixed(2)}%)
The template management system has significant issues that need attention.`;
  } else {
    return `### ❌ CRITICAL ISSUES (${successRate.toFixed(2)}%)
The template management system has critical failures and requires immediate attention.`;
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
  
  if (failedTests.length === 0) {
    return `### No Issues Detected
All template management endpoints are working correctly. No action required.`;
  }
  
  let recommendations = `### Failed Tests
${failedTests.map(test => `- **${test.name}**: ${test.error}`).join('\n')}

### Recommended Actions
- ${failedTests.some(t => t.name.includes('Create')) ? 'Fix template creation endpoint first' : 
     failedTests.some(t => t.name.includes('List')) ? 'Ensure template listing works correctly' :
     'Address template management issues'}
- Verify database connections for template operations
- Ensure proper error handling for template management
- Check permissions and authorization for template operations`;
  
  return recommendations;
}

// Run the template tests
async function runTemplateTests() {
  logger.info('Starting template API tests');
  
  // Results object to store test outcomes
  const results = {};
  
  try {
    // Run List Templates Test
    logger.info('Running List Templates test...');
    results['List Templates'] = await listTemplatesTest();
    
    // Run Template Details Test
    logger.info('Running Template Details test...');
    results['Template Details'] = await templateDetailsTest();
    
    // Run Create Template Test
    logger.info('Running Create Template test...');
    results['Create Template'] = await createTemplateTest();
    
    // Run Subscribe From Template Test
    logger.info('Running Subscribe From Template test...');
    results['Subscribe From Template'] = await subscribeFromTemplateTest();
    
    // Generate summary report
    const summaryPath = await generateSummaryReport(results);
    
    return {
      results,
      summaryPath
    };
  } catch (error) {
    logger.error('Error running template tests:', error);
    return {
      error: error.message
    };
  }
}

// Run if executed directly
if (require.main === module) {
  runTemplateTests()
    .then(({ results, summaryPath }) => {
      if (results) {
        const successCount = Object.values(results).filter(r => r.success).length;
        const totalCount = Object.keys(results).length;
        
        console.log(`\nTemplate API tests completed!`);
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
  module.exports = runTemplateTests;
}