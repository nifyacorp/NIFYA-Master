/**
 * Run Authentication Tests
 * 
 * This script runs all authentication service tests and generates a report.
 */

const fs = require('fs');
const path = require('path');
const authTests = require('./tests/auth/auth-management-tests');
const logger = require('./core/logger');

// Output directory for reports
const REPORTS_DIR = path.join(__dirname, 'outputs', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Generate a summary report of auth management test results
 */
function generateSummaryReport(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(REPORTS_DIR, `auth-summary-${timestamp}.md`);
  
  // Create report content
  let report = `# Authentication Management Tests Summary\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Health status
  const healthStatus = determineSystemHealth(results);
  report += `## System Health\n\n${healthStatus}\n\n`;
  
  // Test summary
  report += `## Test Summary\n\n`;
  report += `- **Total Tests:** ${results.overall.totalTests}\n`;
  report += `- **Passed Tests:** ${results.overall.passedTests}\n`;
  report += `- **Failed Tests:** ${results.overall.failedTests}\n`;
  report += `- **Success Rate:** ${results.overall.successRate.toFixed(2)}%\n`;
  report += `- **Duration:** ${results.overall.duration}ms\n\n`;
  
  // Individual test results
  report += `## Test Results\n\n`;
  report += `| Test | Status | Error |\n`;
  report += `|------|--------|-------|\n`;
  
  results.tests.forEach(test => {
    const status = test.success ? '✅ Pass' : '❌ Fail';
    const error = test.error || '-';
    report += `| ${test.name} | ${status} | ${error} |\n`;
  });
  
  // Recommendations section
  if (results.recommendations && results.recommendations.length > 0) {
    report += `\n## Recommendations\n\n`;
    results.recommendations.forEach(recommendation => {
      report += `- ${recommendation}\n`;
    });
  }
  
  // Write report to file
  fs.writeFileSync(reportFile, report);
  logger.info(`Auth summary report saved to ${reportFile}`);
  
  return report;
}

/**
 * Determine system health based on test results
 */
function determineSystemHealth(results) {
  const successRate = results.overall.successRate;
  
  if (successRate >= 90) {
    return `### ✅ EXCELLENT (${successRate.toFixed(2)}%)
The authentication system is functioning well with high reliability.`;
  } else if (successRate >= 75) {
    return `### ⚠️ GOOD (${successRate.toFixed(2)}%)
The authentication system is working but has some minor issues that should be addressed soon.`;
  } else if (successRate >= 50) {
    return `### ⚠️ PARTIAL (${successRate.toFixed(2)}%)
The authentication system is partially working but has significant issues that need immediate attention.`;
  } else {
    return `### ❌ FAILING (${successRate.toFixed(2)}%)
The authentication system is critically compromised with most tests failing. Immediate attention is required.`;
  }
}

/**
 * Run all authentication tests
 */
async function runAllTests() {
  logger.info('Starting Authentication Management tests');
  
  try {
    const startTime = Date.now();
    
    // Run authentication management tests
    const authManagementResults = await authTests();
    
    // Generate summary report
    generateSummaryReport(authManagementResults);
    
    const duration = Date.now() - startTime;
    logger.info(`Authentication tests completed in ${duration}ms`);
    
    return {
      success: authManagementResults.overall.success,
      successRate: authManagementResults.overall.successRate,
      duration,
      results: {
        authManagement: authManagementResults
      }
    };
  } catch (error) {
    logger.error('Failed to run authentication tests', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the tests if this script is called directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      if (results.success) {
        logger.success(`Authentication tests completed successfully with ${results.successRate.toFixed(2)}% success rate`);
        process.exit(0);
      } else {
        logger.error(`Authentication tests failed: ${results.error || 'See detailed reports'}`);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in authentication tests', error);
      process.exit(1);
    });
}

module.exports = runAllTests;