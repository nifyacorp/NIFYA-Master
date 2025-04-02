/**
 * Test Runner Utility
 * 
 * This script provides a CLI for running various tests or test suites.
 */

const fs = require('fs');
const path = require('path');
const logger = require('../core/logger');

// Test imports
const authLogin = require('../tests/auth/login');
const createSubscription = require('../tests/subscriptions/create');
const processSubscription = require('../tests/subscriptions/process');
const pollNotifications = require('../tests/notifications/poll');
const userJourney = require('../tests/user-journeys/standard-flow');

// Output directory for reports
const OUTPUT_DIR = path.join(__dirname, '..', 'outputs');
const REPORTS_DIR = path.join(OUTPUT_DIR, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Available test suites
const TEST_SUITES = {
  auth: [
    { name: 'Authentication Login', fn: authLogin }
  ],
  subscriptions: [
    { name: 'Create Subscription', fn: createSubscription },
    { name: 'Process Subscription', fn: processSubscription }
  ],
  notifications: [
    { name: 'Poll Notifications', fn: pollNotifications }
  ],
  'user-journeys': [
    { name: 'Standard User Journey', fn: userJourney }
  ],
  all: [] // Will be populated with all tests
};

// Populate 'all' test suite
Object.keys(TEST_SUITES).forEach(suite => {
  if (suite !== 'all') {
    TEST_SUITES.all = TEST_SUITES.all.concat(TEST_SUITES[suite]);
  }
});

/**
 * Run a specific test suite
 * @param {string} suite - Name of the test suite to run
 * @returns {Promise<Object>} Test results
 */
async function runTestSuite(suite) {
  // Check if the suite exists
  if (!TEST_SUITES[suite]) {
    logger.error(`Test suite '${suite}' not found`);
    return { success: false, error: `Test suite '${suite}' not found` };
  }
  
  const tests = TEST_SUITES[suite];
  logger.info(`Running test suite: ${suite} (${tests.length} tests)`);
  
  const results = {
    suite,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0,
    tests: [],
    passed: 0,
    failed: 0,
    success: false
  };
  
  // Run each test in the suite
  for (const test of tests) {
    logger.info(`Running test: ${test.name}`);
    
    try {
      const testStart = new Date();
      const testResult = await test.fn();
      const testEnd = new Date();
      const testDuration = (testEnd - testStart) / 1000;
      
      results.tests.push({
        name: test.name,
        duration: testDuration,
        success: testResult.success,
        error: testResult.error || null
      });
      
      if (testResult.success) {
        results.passed++;
        logger.success(`Test ${test.name} passed (${testDuration.toFixed(2)}s)`);
      } else {
        results.failed++;
        logger.error(`Test ${test.name} failed: ${testResult.error}`, null, 'test-runner');
      }
    } catch (error) {
      results.tests.push({
        name: test.name,
        duration: 0,
        success: false,
        error: error.message
      });
      
      results.failed++;
      logger.error(`Test ${test.name} threw an error`, error, 'test-runner');
    }
  }
  
  // Calculate results
  results.endTime = new Date().toISOString();
  results.duration = (new Date(results.endTime) - new Date(results.startTime)) / 1000;
  results.success = results.failed === 0;
  
  // Log summary
  logger.info(`Test suite '${suite}' complete`, {
    passed: results.passed,
    failed: results.failed,
    duration: `${results.duration.toFixed(2)}s`
  }, 'test-runner');
  
  // Save results
  saveTestResults(suite, results);
  
  return results;
}

/**
 * Save test results to file
 * @param {string} suite - Test suite name
 * @param {Object} results - Test results
 */
function saveTestResults(suite, results) {
  const filename = path.join(REPORTS_DIR, `${suite}-${logger.SESSION_ID}.json`);
  
  try {
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    logger.info(`Test results saved to ${filename}`, null, 'test-runner');
    
    // Also generate a markdown report
    const markdownReport = generateMarkdownReport(suite, results);
    const mdFilename = path.join(REPORTS_DIR, `${suite}-${logger.SESSION_ID}.md`);
    fs.writeFileSync(mdFilename, markdownReport);
    logger.info(`Markdown report saved to ${mdFilename}`, null, 'test-runner');
  } catch (error) {
    logger.error('Failed to save test results', error, 'test-runner');
  }
}

/**
 * Generate a markdown report from test results
 * @param {string} suite - Test suite name
 * @param {Object} results - Test results
 * @returns {string} Markdown report
 */
function generateMarkdownReport(suite, results) {
  return `# Test Suite Report: ${suite}

## Summary
- **Start Time:** ${results.startTime}
- **End Time:** ${results.endTime}
- **Duration:** ${results.duration.toFixed(2)} seconds
- **Tests Passed:** ${results.passed}
- **Tests Failed:** ${results.failed}
- **Overall Result:** ${results.success ? '✅ PASSED' : '❌ FAILED'}

## Test Results

${results.tests.map(test => `### ${test.name}
- **Result:** ${test.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${test.duration.toFixed(2)} seconds
${test.error ? `- **Error:** ${test.error}` : ''}`).join('\n\n')}

## System Information
- **Session ID:** ${logger.SESSION_ID}
- **Node Version:** ${process.version}
- **Platform:** ${process.platform}
`;
}

/**
 * Display usage information
 */
function displayUsage() {
  console.log(`
NIFYA Test Runner
=================

Usage: node test-runner.js <suite> [options]

Available test suites:
${Object.keys(TEST_SUITES).map(suite => `  - ${suite} (${TEST_SUITES[suite].length} tests)`).join('\n')}

Options:
  --help    Display this help message

Example:
  node test-runner.js auth
  node test-runner.js all
  `);
}

// Run the script if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Check for help flag
  if (args.includes('--help') || args.length === 0) {
    displayUsage();
    process.exit(0);
  }
  
  const suite = args[0];
  
  // Run the test suite
  runTestSuite(suite)
    .then(results => {
      if (results.success) {
        logger.success(`Test suite '${suite}' passed`);
        process.exit(0);
      } else {
        logger.error(`Test suite '${suite}' failed`);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Error running test suite', error);
      process.exit(1);
    });
}

module.exports = {
  runTestSuite,
  TEST_SUITES
};