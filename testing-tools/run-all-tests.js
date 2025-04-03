/**
 * NIFYA Comprehensive Test Runner
 *
 * This script runs tests for all available endpoints and generates a comprehensive report.
 * It tests authentication, subscriptions, notifications, and diagnostic endpoints.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./core/logger');

// Define test sequence
const tests = [
  // Authentication tests
  {
    name: 'Authentication: Login',
    command: 'node tests/auth/test-login.js',
    category: 'authentication',
    critical: true
  },
  
  // Health check
  {
    name: 'Infrastructure: Health Check',
    command: 'node tests/health/health.js',
    category: 'infrastructure',
    critical: true
  },
  
  // Subscription tests
  {
    name: 'Subscriptions: List',
    command: 'node tests/subscriptions/list.js',
    category: 'subscriptions',
    critical: true
  },
  {
    name: 'Subscriptions: Create',
    command: 'node tests/subscriptions/minimal-create.js',
    category: 'subscriptions',
    critical: true
  },
  {
    name: 'Subscriptions: Create with User ID',
    command: 'node tests/subscriptions/user-id-create.js',
    category: 'subscriptions',
    critical: false
  },
  
  // Notification tests
  {
    name: 'Notifications: List',
    command: 'node tests/notifications/poll.js',
    category: 'notifications',
    critical: true
  },
  {
    name: 'Notifications: By Entity Type',
    command: 'node tests/notifications/get-by-entity.js',
    category: 'notifications', 
    critical: false
  },
  {
    name: 'Notifications: Activity',
    command: 'node tests/notifications/activity.js',
    category: 'notifications',
    critical: false
  },
  
  // Diagnostic tests
  {
    name: 'Diagnostics: API Info',
    command: 'node tests/admin/diagnose-database.js',
    category: 'diagnostics',
    critical: false
  }
];

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total: tests.length,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  categories: {},
  tests: []
};

/**
 * Run a single test and capture output
 * @param {Object} test - Test configuration
 * @returns {Object} Test result
 */
function runTest(test) {
  logger.info(`Running ${test.name}...`);
  
  try {
    const output = execSync(test.command, { encoding: 'utf8' });
    
    // Determine result based on output
    const success = !output.includes('ERROR') && !output.includes('FAILED');
    
    // Update category stats
    if (!results.categories[test.category]) {
      results.categories[test.category] = {
        total: 0,
        passed: 0,
        failed: 0
      };
    }
    
    results.categories[test.category].total++;
    
    if (success) {
      results.categories[test.category].passed++;
      results.summary.passed++;
      logger.success(`✅ ${test.name} PASSED`);
    } else {
      results.categories[test.category].failed++;
      results.summary.failed++;
      logger.error(`❌ ${test.name} FAILED`);
    }
    
    return {
      name: test.name,
      category: test.category,
      success,
      output: output.split('\n').filter(line => 
        line.includes('[INFO]') || 
        line.includes('[ERROR]') || 
        line.includes('[SUCCESS]') || 
        line.includes('[WARN]')
      ),
      critical: test.critical
    };
  } catch (error) {
    // Handle execution errors
    results.categories[test.category] = results.categories[test.category] || {
      total: 0,
      passed: 0,
      failed: 0
    };
    
    results.categories[test.category].total++;
    results.categories[test.category].failed++;
    results.summary.failed++;
    
    logger.error(`❌ ${test.name} FAILED: ${error.message}`);
    
    return {
      name: test.name,
      category: test.category,
      success: false,
      error: error.message,
      critical: test.critical
    };
  }
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
  logger.info('Starting comprehensive test run...');
  
  // Ensure outputs directory exists
  const outputDir = path.join(__dirname, 'outputs', 'comprehensive-tests');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Run each test
  for (const test of tests) {
    const result = runTest(test);
    results.tests.push(result);
    
    // If a critical test fails, we may want to stop
    if (test.critical && !result.success) {
      logger.warn(`Critical test ${test.name} failed. Some subsequent tests may be skipped.`);
      // We'll continue anyway but mark it as a warning
    }
  }
  
  // Save results
  const resultsFile = path.join(outputDir, `test-results-${new Date().toISOString().replace(/:/g, '-')}.json`);
  await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
  
  // Generate summary report
  const summaryFile = path.join(outputDir, 'latest-test-summary.md');
  
  // Build the summary markdown
  let summary = `# NIFYA Comprehensive Test Results\n\n`;
  summary += `Test run completed at: ${results.timestamp}\n\n`;
  
  summary += `## Summary\n\n`;
  summary += `- Total Tests: ${results.summary.total}\n`;
  summary += `- Passed: ${results.summary.passed}\n`;
  summary += `- Failed: ${results.summary.failed}\n`;
  summary += `- Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%\n\n`;
  
  summary += `## Results by Category\n\n`;
  
  for (const [category, stats] of Object.entries(results.categories)) {
    const successRate = Math.round((stats.passed / stats.total) * 100);
    summary += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    summary += `- Tests: ${stats.total}\n`;
    summary += `- Passed: ${stats.passed}\n`;
    summary += `- Failed: ${stats.failed}\n`;
    summary += `- Success Rate: ${successRate}%\n\n`;
  }
  
  summary += `## Detailed Test Results\n\n`;
  
  for (const test of results.tests) {
    summary += `### ${test.name}\n\n`;
    summary += `- Category: ${test.category}\n`;
    summary += `- Status: ${test.success ? '✅ PASSED' : '❌ FAILED'}\n`;
    summary += `- Critical: ${test.critical ? 'Yes' : 'No'}\n\n`;
    
    if (test.error) {
      summary += `**Error:** ${test.error}\n\n`;
    }
    
    if (test.output && test.output.length > 0) {
      summary += `<details><summary>Output Log (Click to expand)</summary>\n\n\`\`\`\n${test.output.join('\n')}\n\`\`\`\n\n</details>\n\n`;
    }
  }
  
  await fs.writeFile(summaryFile, summary);
  
  // Print final summary
  logger.info('==== TEST RUN COMPLETE ====');
  logger.info(`Total: ${results.summary.total}`);
  logger.info(`Passed: ${results.summary.passed}`);
  logger.info(`Failed: ${results.summary.failed}`);
  logger.info(`Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  logger.info('==========================');
  logger.info(`Detailed results saved to: ${outputDir}`);
}

// Run the tests
runAllTests().catch(error => {
  logger.error(`Test runner failed: ${error.message}`);
});