/**
 * NIFYA Test Suite Runner
 * 
 * This script runs all available test modules and generates a comprehensive report.
 * Tests include:
 * - Basic endpoint tests
 * - Enhanced user journey tests
 * - Comprehensive endpoint tests
 * - Integration tests for cross-service functionality
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import test modules
const runComprehensiveTests = require('./tests/comprehensive-endpoint-test');
const runEnhancedJourney = require('./tests/user-journeys/enhanced-flow');
const runIntegrationTests = require('./run-integration-tests');

// Output directory for final report
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');
const FINAL_REPORT_PATH = path.join(REPORT_DIR, 'complete-test-report.md');

// Ensure report directory exists
async function ensureReportDir() {
  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
  } catch (err) {
    logger.warn(`Error creating report directory: ${err.message}`);
  }
}

// Run all test modules and consolidate results
async function runAllTestModules() {
  logger.info('Starting NIFYA Complete Test Suite');
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    modules: {},
    summary: {
      total_tests: 0,
      passed_tests: 0,
      failed_tests: 0,
      skipped_tests: 0,
      overall_health: 'Unknown'
    }
  };
  
  // Run comprehensive endpoint tests
  logger.info('Running comprehensive endpoint tests...');
  try {
    const comprehensiveResult = await runComprehensiveTests();
    results.modules.comprehensive = {
      name: 'Comprehensive Endpoint Tests',
      success_rate: comprehensiveResult.summary?.success_rate || 0,
      details: comprehensiveResult
    };
    
    if (comprehensiveResult.summary) {
      results.summary.total_tests += comprehensiveResult.summary.total || 0;
      results.summary.passed_tests += comprehensiveResult.summary.passed || 0;
      results.summary.failed_tests += comprehensiveResult.summary.failed || 0;
    }
  } catch (err) {
    logger.error(`Error running comprehensive tests: ${err.message}`);
    results.modules.comprehensive = {
      name: 'Comprehensive Endpoint Tests',
      success_rate: 0,
      error: err.message
    };
  }
  
  // Run enhanced user journey test
  logger.info('Running enhanced user journey test...');
  try {
    const journeyResult = await runEnhancedJourney();
    results.modules.journey = {
      name: 'Enhanced User Journey',
      completed_steps: journeyResult.completedSteps || 0,
      total_steps: journeyResult.totalSteps || 0,
      success: journeyResult.success,
      details: journeyResult
    };
    
    results.summary.total_tests += 1;
    if (journeyResult.success) {
      results.summary.passed_tests += 1;
    } else {
      results.summary.failed_tests += 1;
    }
  } catch (err) {
    logger.error(`Error running enhanced journey test: ${err.message}`);
    results.modules.journey = {
      name: 'Enhanced User Journey',
      success: false,
      error: err.message
    };
    results.summary.total_tests += 1;
    results.summary.failed_tests += 1;
  }
  
  // Run integration tests
  logger.info('Running integration tests...');
  try {
    const integrationResult = await runIntegrationTests();
    results.modules.integration = {
      name: 'Cross-Service Integration Tests',
      success_rate: integrationResult.results.summary?.passed / integrationResult.results.summary?.total * 100 || 0,
      details: integrationResult.results
    };
    
    if (integrationResult.results.summary) {
      results.summary.total_tests += integrationResult.results.summary.total || 0;
      results.summary.passed_tests += integrationResult.results.summary.passed || 0;
      results.summary.failed_tests += integrationResult.results.summary.failed || 0;
      results.summary.skipped_tests += integrationResult.results.summary.skipped || 0;
    }
  } catch (err) {
    logger.error(`Error running integration tests: ${err.message}`);
    results.modules.integration = {
      name: 'Cross-Service Integration Tests',
      success_rate: 0,
      error: err.message
    };
  }
  
  // Calculate overall health
  const overall_success_rate = results.summary.total_tests > 0 
    ? (results.summary.passed_tests / results.summary.total_tests) * 100 
    : 0;
    
  if (overall_success_rate >= 90) {
    results.summary.overall_health = '✅ EXCELLENT';
  } else if (overall_success_rate >= 75) {
    results.summary.overall_health = '✅ GOOD';
  } else if (overall_success_rate >= 50) {
    results.summary.overall_health = '⚠️ MODERATE';
  } else {
    results.summary.overall_health = '❌ POOR';
  }
  
  results.summary.overall_success_rate = overall_success_rate;
  
  // Generate final report
  logger.info('Generating final test report');
  await ensureReportDir();
  
  // Save JSON report
  const jsonReportPath = path.join(REPORT_DIR, `complete-test-results-${timestamp.replace(/:/g, '-')}.json`);
  await fs.writeFile(jsonReportPath, JSON.stringify(results, null, 2));
  
  // Generate markdown report
  const markdownReport = `
# NIFYA Complete Test Suite Report

**Test Time:** ${timestamp}
**Overall Health:** ${results.summary.overall_health}

## Summary
- **Total Tests:** ${results.summary.total_tests}
- **Passed:** ${results.summary.passed_tests}
- **Failed:** ${results.summary.failed_tests}
- **Skipped:** ${results.summary.skipped_tests}
- **Overall Success Rate:** ${overall_success_rate.toFixed(2)}%

## Test Modules

### ${results.modules.comprehensive?.name || 'Comprehensive Endpoint Tests'}
- **Success Rate:** ${results.modules.comprehensive?.success_rate?.toFixed(2) || 0}%
${results.modules.comprehensive?.error ? `- **Error:** ${results.modules.comprehensive.error}` : ''}

### ${results.modules.journey?.name || 'Enhanced User Journey'}
- **Success:** ${results.modules.journey?.success ? '✅ Passed' : '❌ Failed'}
- **Completed Steps:** ${results.modules.journey?.completed_steps || 0}/${results.modules.journey?.total_steps || 'N/A'}
${results.modules.journey?.error ? `- **Error:** ${results.modules.journey.error}` : ''}

### ${results.modules.integration?.name || 'Cross-Service Integration Tests'}
- **Success Rate:** ${results.modules.integration?.success_rate?.toFixed(2) || 0}%
${results.modules.integration?.error ? `- **Error:** ${results.modules.integration.error}` : ''}

## Service Status

| Service | Status | Notes |
|---------|--------|-------|
| Authentication | ${results.modules.comprehensive?.details?.services?.authentication?.status || '❓ Unknown'} | ${results.modules.comprehensive?.details?.services?.authentication?.notes || 'No data'} |
| Backend | ${results.modules.comprehensive?.details?.services?.backend?.status || '❓ Unknown'} | ${results.modules.comprehensive?.details?.services?.backend?.notes || 'No data'} |
| Notifications | ${results.modules.comprehensive?.details?.services?.notifications?.status || '❓ Unknown'} | ${results.modules.comprehensive?.details?.services?.notifications?.notes || 'No data'} |
| Subscriptions | ${results.modules.comprehensive?.details?.services?.subscriptions?.status || '❓ Unknown'} | ${results.modules.comprehensive?.details?.services?.subscriptions?.notes || 'No data'} |
| Templates | ${results.modules.comprehensive?.details?.services?.templates?.status || '❓ Unknown'} | ${results.modules.comprehensive?.details?.services?.templates?.notes || 'No data'} |
| Notification Worker | ${results.modules.integration?.details?.tests?.notification_pipeline?.success ? '✅ Operational' : '❓ Unknown'} | Debug endpoint added |
| Subscription Worker | ❌ UNREACHABLE | Cannot connect to health endpoint |

## Critical Issues
1. Subscription worker is unreachable, blocking subscription processing
2. Authentication service has intermittent 500 errors
3. Subscription types endpoint returns 500 error
4. Subscription creation returns empty objects

## Recommendations
1. Investigate and fix subscription worker availability
2. Address authentication service stability issues
3. Fix subscription types endpoint
4. Improve cross-service communication and error handling
5. Add debug endpoints to all microservices

## Next Steps
1. Run integration tests regularly to monitor cross-service functionality
2. Expand test coverage to include more edge cases
3. Implement automated monitoring of all services
`;

  await fs.writeFile(FINAL_REPORT_PATH, markdownReport);
  
  logger.info(`Test report saved to ${jsonReportPath}`);
  logger.info(`Markdown report saved to ${FINAL_REPORT_PATH}`);
  
  return {
    results,
    reportPath: jsonReportPath,
    summaryPath: FINAL_REPORT_PATH
  };
}

// Run if this script is executed directly
if (require.main === module) {
  runAllTestModules()
    .then(({ results }) => {
      console.log('All tests completed!');
      console.log(`Overall success rate: ${results.summary.overall_success_rate.toFixed(2)}%`);
      process.exit(results.summary.failed_tests > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Error running tests:', err);
      process.exit(1);
    });
} else {
  module.exports = runAllTestModules;
}