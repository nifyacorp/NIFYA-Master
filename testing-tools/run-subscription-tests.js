/**
 * Subscription API Test Runner
 * 
 * This script runs comprehensive tests for all subscription management APIs.
 * It provides a command-line interface to run specific test suites or all tests.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import test suites
const subscriptionManagerTests = require('./tests/subscriptions/subscription-manager-tests');
const debugFilterTest = require('./tests/subscriptions/debug-filter');
const debugFilterExtendedTest = require('./tests/subscriptions/debug-filter-extended');

// Available test suites
const TEST_SUITES = {
  'subscription-manager': {
    name: 'Subscription Management APIs',
    description: 'Tests all subscription CRUD operations, processing, and sharing',
    run: subscriptionManagerTests
  },
  'debug-filter': {
    name: 'Subscription Debug Filter',
    description: 'Tests the diagnostic endpoint for subscription filtering',
    run: debugFilterTest
  },
  'debug-filter-extended': {
    name: 'Extended Subscription Debug Filter',
    description: 'Tests subscription filtering with comparative analysis between endpoints',
    run: debugFilterExtendedTest
  }
};

// Output directory for combined reports
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');
const SUMMARY_FILE = path.join(REPORT_DIR, 'subscription-tests-summary.md');

// Ensure report directory exists
async function ensureReportDir() {
  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
  } catch (err) {
    logger.warn(`Error creating report directory: ${err.message}`);
  }
}

// Generate a combined summary report
async function generateSummaryReport(results) {
  await ensureReportDir();
  
  const timestamp = new Date().toISOString();
  
  // Create summary content
  const summary = `# NIFYA Subscription API Test Results

**Test Time:** ${timestamp}

## Summary

| Test Suite | Status | Success Rate | Details |
|------------|--------|--------------|---------|
${Object.entries(results).map(([suite, result]) => {
  // Handle cases where result or result.results might be undefined
  if (!result || !result.results || !result.results.overall) {
    return `| ${TEST_SUITES[suite].name} | ❌ FAILED | 0.00% | Error running tests |`;
  }
  const overallResult = result.results.overall;
  return `| ${TEST_SUITES[suite].name} | ${overallResult.success ? '✅ PASSED' : '❌ FAILED'} | ${overallResult.successRate.toFixed(2)}% | [View Details](${path.relative(REPORT_DIR, result.reportPath)}) |`;
}).join('\n')}

## Overall System Health

${determineOverallHealth(results)}

## Test Coverage

These tests cover:
- Authentication with the backend services
- Subscription management (create, read, update, delete)
- Subscription processing workflow
- Subscription sharing functionality
- Handling of different subscription types
- Diagnostic tools and filter parameter parsing
- Error cases and edge conditions

## Next Steps

${determineNextSteps(results)}

---
Generated on: ${timestamp}
`;

  await fs.writeFile(SUMMARY_FILE, summary);
  logger.info(`Generated summary report at ${SUMMARY_FILE}`);
  return SUMMARY_FILE;
}

// Determine overall system health
function determineOverallHealth(results) {
  let totalSuccessRate = 0;
  let suiteCount = 0;
  let failedSuites = [];
  
  for (const [suite, result] of Object.entries(results)) {
    const overallResult = result.results?.overall;
    totalSuccessRate += overallResult.successRate;
    suiteCount++;
    
    if (!overallResult.success) {
      failedSuites.push(TEST_SUITES[suite].name);
    }
  }
  
  const averageSuccessRate = totalSuccessRate / suiteCount;
  
  if (averageSuccessRate >= 90) {
    return `### ✅ EXCELLENT (${averageSuccessRate.toFixed(2)}%)
The subscription API system is functioning well with high reliability.`;
  } else if (averageSuccessRate >= 75) {
    return `### ✅ GOOD (${averageSuccessRate.toFixed(2)}%)
The subscription API system is working but has some minor issues.
${failedSuites.length > 0 ? `\nIssues were found in: ${failedSuites.join(', ')}` : ''}`;
  } else if (averageSuccessRate >= 50) {
    return `### ⚠️ MODERATE ISSUES (${averageSuccessRate.toFixed(2)}%)
The subscription API system has significant issues that need attention.
\nProblems were found in: ${failedSuites.join(', ')}`;
  } else {
    return `### ❌ CRITICAL ISSUES (${averageSuccessRate.toFixed(2)}%)
The subscription API system has critical failures and requires immediate attention.
\nFailing areas: ${failedSuites.join(', ')}`;
  }
}

// Determine next steps based on results
function determineNextSteps(results) {
  let criticalIssues = [];
  let moderateIssues = [];
  
  for (const [suite, result] of Object.entries(results)) {
    const failedTests = Object.entries(result.results.tests)
      .filter(([_, test]) => !test.success)
      .map(([name, test]) => ({
        name,
        endpoint: test.endpoint,
        error: test.error
      }));
    
    // Classify issues
    failedTests.forEach(test => {
      if (test.name.includes('Process') || 
          test.name.includes('Create') || 
          test.name.includes('Authentication')) {
        criticalIssues.push(`${test.name}: ${test.error || 'Failed'}`);
      } else {
        moderateIssues.push(`${test.name}: ${test.error || 'Failed'}`);
      }
    });
  }
  
  if (criticalIssues.length === 0 && moderateIssues.length === 0) {
    return `All subscription tests passed! No action required.`;
  }
  
  let nextSteps = '';
  
  if (criticalIssues.length > 0) {
    nextSteps += `### Critical Issues to Fix
${criticalIssues.map(issue => `- ${issue}`).join('\n')}

`;
  }
  
  if (moderateIssues.length > 0) {
    nextSteps += `### Issues to Address
${moderateIssues.map(issue => `- ${issue}`).join('\n')}

`;
  }
  
  nextSteps += `### Recommended Actions
- ${criticalIssues.length > 0 ? 'Fix critical subscription APIs first (creation and processing)' : 'Review and fix failing endpoints'}
- Check authentication service stability
- Verify database connection and schema
- Run tests again after fixes`;
  
  return nextSteps;
}

// Run all test suites
async function runAllTests() {
  logger.info('Starting all subscription API tests');
  const results = {};
  
  for (const [suite, config] of Object.entries(TEST_SUITES)) {
    logger.info(`Running test suite: ${config.name}`);
    try {
      results[suite] = await config.run();
      logger.info(`Completed test suite: ${config.name}`);
    } catch (error) {
      logger.error(`Error running test suite ${config.name}:`, error);
      results[suite] = {
        results: {
          overall: {
            success: false,
            successRate: 0,
            error: error.message
          },
          tests: {
            error: {
              success: false,
              error: error.message
            }
          }
        },
        reportPath: null
      };
    }
  }
  
  // Generate summary report
  const summaryPath = await generateSummaryReport(results);
  
  return {
    results,
    summaryPath
  };
}

// Run a specific test suite
async function runTestSuite(suite) {
  if (!TEST_SUITES[suite]) {
    logger.error(`Unknown test suite: ${suite}`);
    console.error(`Unknown test suite: ${suite}`);
    console.error(`Available suites: ${Object.keys(TEST_SUITES).join(', ')}`);
    return null;
  }
  
  logger.info(`Running test suite: ${TEST_SUITES[suite].name}`);
  
  try {
    const result = await TEST_SUITES[suite].run();
    logger.info(`Completed test suite: ${TEST_SUITES[suite].name}`);
    
    // Generate a simple summary just for this test
    const results = { [suite]: result };
    const summaryPath = await generateSummaryReport(results);
    
    return {
      results,
      summaryPath
    };
  } catch (error) {
    logger.error(`Error running test suite ${TEST_SUITES[suite].name}:`, error);
    return null;
  }
}

// Run if executed directly
if (require.main === module) {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'list') {
    // List available test suites
    console.log('Available test suites:');
    Object.entries(TEST_SUITES).forEach(([key, config]) => {
      console.log(`  ${key} - ${config.name}: ${config.description}`);
    });
  } else if (command === 'run' && args[1]) {
    // Run specific test suite
    const suite = args[1];
    runTestSuite(suite)
      .then(result => {
        if (!result) {
          process.exit(1);
        }
        console.log(`\nTest suite completed!`);
        console.log(`Report saved to: ${result.summaryPath}`);
        
        const overallSuccess = Object.values(result.results).every(r => r.results.overall.success);
        process.exit(overallSuccess ? 0 : 1);
      })
      .catch(error => {
        console.error('Error running test suite:', error);
        process.exit(1);
      });
  } else {
    // Run all test suites
    runAllTests()
      .then(({ summaryPath }) => {
        console.log(`\nAll subscription API tests completed!`);
        console.log(`Summary report saved to: ${summaryPath}`);
        
        // Note: process will exit with appropriate code based on test results
        fs.readFile(summaryPath, 'utf8')
          .then(content => {
            console.log('\nTest Summary:');
            console.log(content.split('\n').slice(0, 10).join('\n'));
            process.exit(content.includes('CRITICAL ISSUES') ? 1 : 0);
          })
          .catch(() => process.exit(0));
      })
      .catch(error => {
        console.error('Error running tests:', error);
        process.exit(1);
      });
  }
} else {
  // Export functions for use in other scripts
  module.exports = {
    runAllTests,
    runTestSuite,
    listTestSuites: () => Object.keys(TEST_SUITES)
  };
}