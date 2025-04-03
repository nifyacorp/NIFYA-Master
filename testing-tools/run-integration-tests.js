/**
 * Run Integration Tests
 * 
 * This script runs all integration tests that verify cross-service 
 * functionality in the NIFYA system.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import tests
const pipelineTest = require('./tests/integration/test-notification-pipeline');

// Output directory for reports
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');

// Ensure report directory exists
async function ensureReportDir() {
  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
  } catch (err) {
    logger.warn(`Error creating report directory: ${err.message}`);
  }
}

// Run all tests and generate a summary
async function runAllTests() {
  logger.info('Starting integration tests');
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const results = {
    timestamp,
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    }
  };
  
  // Run notification pipeline test
  logger.info('Running notification pipeline test');
  try {
    const pipelineResult = await pipelineTest();
    results.tests.notification_pipeline = {
      name: 'Notification Pipeline',
      success: pipelineResult.success,
      details: pipelineResult
    };
    
    if (pipelineResult.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
    results.summary.total++;
  } catch (err) {
    logger.error(`Error running notification pipeline test: ${err.message}`);
    results.tests.notification_pipeline = {
      name: 'Notification Pipeline',
      success: false,
      error: err.message
    };
    results.summary.failed++;
    results.summary.total++;
  }
  
  // Add more tests here as they are created
  
  // Generate report
  logger.info('Generating test report');
  await ensureReportDir();
  
  const reportFilename = `integration-tests-${timestamp}.json`;
  const reportPath = path.join(REPORT_DIR, reportFilename);
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  
  // Generate markdown summary
  const summaryMd = `
# NIFYA Integration Tests Report

**Run Time:** ${timestamp}

## Summary
- **Total Tests:** ${results.summary.total}
- **Passed:** ${results.summary.passed}
- **Failed:** ${results.summary.failed}
- **Skipped:** ${results.summary.skipped}
- **Success Rate:** ${results.summary.total > 0 ? Math.round((results.summary.passed / results.summary.total) * 100) : 0}%

## Test Results

${Object.entries(results.tests).map(([key, test]) => `
### ${test.name}
- **Status:** ${test.success ? '✅ Success' : '❌ Failed'}
${test.error ? `- **Error:** ${test.error}` : ''}
${test.details?.test_summary ? `- **Summary:** ${test.details.test_summary}` : ''}
`).join('\n')}

## Next Steps
${results.summary.failed > 0 ? 
  '- Review failed tests and fix issues in the appropriate services' : 
  '- All integration tests are passing! The system is functioning correctly across services'}
`;
  
  const summaryPath = path.join(REPORT_DIR, 'integration-tests-summary.md');
  await fs.writeFile(summaryPath, summaryMd);
  
  logger.info(`Test report saved to ${reportPath}`);
  logger.info(`Test summary saved to ${summaryPath}`);
  
  return {
    results,
    reportPath,
    summaryPath
  };
}

// Run if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(({ results }) => {
      console.log('Integration tests completed!');
      console.log(`Passed: ${results.summary.passed}/${results.summary.total}`);
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Error running integration tests:', err);
      process.exit(1);
    });
} else {
  module.exports = runAllTests;
}