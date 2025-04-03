/**
 * NIFYA Testing Tools - Main Entry Point
 * 
 * This script provides a command-line interface to run various test suites
 * for the NIFYA platform. It serves as the main entry point for all testing.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Import test runners
const subscriptionTests = require('./run-subscription-tests');
const integrationTests = require('./run-integration-tests');
const allTestModules = require('./run-all-test-modules');

// Available test types
const TEST_TYPES = {
  'subscription': {
    name: 'Subscription API Tests',
    description: 'Tests for subscription management endpoints',
    runner: subscriptionTests.runAllTests
  },
  'integration': {
    name: 'Integration Tests',
    description: 'Cross-service integration tests',
    runner: integrationTests
  },
  'comprehensive': {
    name: 'Comprehensive Tests',
    description: 'Run all test modules across the platform',
    runner: allTestModules
  }
};

// Output directory for final reports
const REPORT_DIR = path.join(__dirname, 'outputs', 'reports');
const FINAL_REPORT = path.join(REPORT_DIR, 'final-test-report.md');

// Ensure report directory exists
async function ensureReportDir() {
  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
  } catch (err) {
    logger.warn(`Error creating report directory: ${err.message}`);
  }
}

// Display help information
function showHelp() {
  console.log(`
NIFYA Testing Tools
==================

Usage: 
  node index.js <command> [options]

Commands:
  list                  List available test types
  run <test-type>       Run a specific test type
  run-all               Run all tests
  help                  Show this help message

Available test types:
${Object.entries(TEST_TYPES).map(([key, config]) => 
    `  ${key.padEnd(20)} ${config.name}: ${config.description}`
  ).join('\n')}

Examples:
  node index.js run subscription    Run all subscription API tests
  node index.js run-all             Run all test types
  `);
}

// Run a specific test type
async function runTestType(type) {
  if (!TEST_TYPES[type]) {
    console.error(`Unknown test type: ${type}`);
    console.error(`Available types: ${Object.keys(TEST_TYPES).join(', ')}`);
    return false;
  }
  
  console.log(`\nRunning ${TEST_TYPES[type].name}...`);
  logger.info(`Starting test type: ${TEST_TYPES[type].name}`);
  
  try {
    // Run the tests
    const result = await TEST_TYPES[type].runner();
    
    console.log(`\n${TEST_TYPES[type].name} completed!`);
    
    if (result.summaryPath) {
      console.log(`Results saved to: ${result.summaryPath}`);
      
      // Display summary
      try {
        const summary = await fs.readFile(result.summaryPath, 'utf8');
        console.log('\nSummary:');
        console.log(summary.split('\n').slice(0, 15).join('\n') + '\n...');
      } catch (err) {
        logger.warn(`Could not read summary: ${err.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error running ${TEST_TYPES[type].name}:`, error);
    logger.error(`Error running ${TEST_TYPES[type].name}:`, error);
    return false;
  }
}

// Run all test types
async function runAllTests() {
  console.log('\nRunning all test types...');
  logger.info('Starting all test types');
  
  const results = {};
  let allSuccessful = true;
  
  for (const [type, config] of Object.entries(TEST_TYPES)) {
    console.log(`\n--- Running ${config.name} ---`);
    logger.info(`Starting test type: ${config.name}`);
    
    try {
      results[type] = await config.runner();
      console.log(`--- ${config.name} completed ---`);
    } catch (error) {
      console.error(`Error running ${config.name}:`, error);
      logger.error(`Error running ${config.name}:`, error);
      results[type] = { error: error.message };
      allSuccessful = false;
    }
  }
  
  // Generate final report
  await generateFinalReport(results);
  
  return allSuccessful;
}

// Generate a final report combining all results
async function generateFinalReport(results) {
  await ensureReportDir();
  
  const timestamp = new Date().toISOString();
  let finalReport = `# NIFYA Platform Test Results

**Test Time:** ${timestamp}

## Test Summary

| Test Type | Status | Details |
|-----------|--------|---------|
`;

  // Add each test type to the summary
  for (const [type, result] of Object.entries(results)) {
    const status = result.error ? '❌ FAILED' : '✅ COMPLETED';
    const details = result.summaryPath ? 
      `[View Details](${path.relative(REPORT_DIR, result.summaryPath)})` : 
      (result.error || 'No details available');
      
    finalReport += `| ${TEST_TYPES[type].name} | ${status} | ${details} |\n`;
  }
  
  // Add overall test conclusions
  finalReport += `
## System Status

The test results show the current status of the NIFYA platform services:

1. **Subscription Management**: ${results.subscription?.error ? '❌ Has issues' : '✅ Operational'}
2. **Cross-Service Integration**: ${results.integration?.error ? '❌ Has issues' : '✅ Operational'}
3. **End-to-End Functionality**: ${results.comprehensive?.error ? '❌ Has issues' : '✅ Operational'}

## Next Steps

- Review individual test reports for details on specific issues
- Address any critical failures identified in the tests
- Re-run tests after fixes to verify improvements

---
Report generated on: ${timestamp}
`;

  // Write the report
  await fs.writeFile(FINAL_REPORT, finalReport);
  logger.info(`Generated final report at ${FINAL_REPORT}`);
  
  console.log(`\nFinal test report saved to: ${FINAL_REPORT}`);
  return FINAL_REPORT;
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  if (command === 'list') {
    console.log('Available test types:');
    Object.entries(TEST_TYPES).forEach(([key, config]) => {
      console.log(`  ${key} - ${config.name}: ${config.description}`);
    });
    return;
  }
  
  if (command === 'run' && args[1]) {
    const success = await runTestType(args[1]);
    process.exit(success ? 0 : 1);
    return;
  }
  
  if (command === 'run-all') {
    const success = await runAllTests();
    process.exit(success ? 0 : 1);
    return;
  }
  
  console.error(`Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
} else {
  // Export for use in other scripts
  module.exports = {
    runTestType,
    runAllTests,
    listTestTypes: () => Object.keys(TEST_TYPES)
  };
}