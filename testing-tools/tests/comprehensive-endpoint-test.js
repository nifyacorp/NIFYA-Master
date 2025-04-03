/**
 * NIFYA Comprehensive API Endpoint Test
 * 
 * This script tests all available endpoints in the NIFYA backend API to ensure
 * they are responding correctly. It generates a detailed report of endpoint health,
 * including authentication issues, response codes, and performance metrics.
 */

const fs = require('fs').promises;
const path = require('path');
const { makeApiRequest, loadAuthToken, saveResponseToFile } = require('../core/api-client');
const logger = require('../core/logger');
const endpointConfig = require('../config/endpoints');

// Output directory for test results
const OUTPUT_DIR = path.join(__dirname, '..', 'outputs', 'endpoint-tests');

// Configure which endpoints to test
const TEST_OPTIONS = {
  includeTestOnly: true,   // Include endpoints marked as test-only
  includeDiagnostics: true // Include diagnostic endpoints
};

/**
 * Test a single endpoint and return the results
 * 
 * @param {Object} endpoint - Endpoint configuration
 * @param {string} token - Authentication token if required
 * @returns {Object} Test result
 */
async function testEndpoint(endpoint, token) {
  const startTime = Date.now();
  const baseUrl = `https://${endpointConfig.backend.baseUrl}`;
  
  // Skip endpoints with parameters for now
  if (endpoint.path.includes(':')) {
    logger.warn(`Skipping endpoint with parameters: ${endpoint.method} ${endpoint.path}`);
    return {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: 'SKIPPED',
      reason: 'Endpoint requires parameters'
    };
  }
  
  try {
    logger.info(`Testing endpoint: ${endpoint.method} ${endpoint.path}`);
    
    // Construct request options
    const requestOptions = {
      url: `${baseUrl}${endpoint.path}`,
      method: endpoint.method
    };
    
    // Determine if we need the token
    const useToken = endpoint.auth ? token : null;
    
    // For POST endpoints without specific test data, use empty object
    const requestBody = (endpoint.method === 'POST' && !endpoint.testData) ? {} : endpoint.testData;
    
    // Make the request
    const response = await makeApiRequest(requestOptions, useToken, requestBody);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Define what counts as a "success" status code
    const isSuccess = response.status >= 200 && response.status < 400;
    
    // Create test result object
    const result = {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: isSuccess ? 'PASSED' : 'FAILED',
      statusCode: response.status,
      responseTime,
      responseSize: response.raw ? response.raw.length : 0,
      authenticated: !!useToken
    };
    
    // Save response to file for reference
    const safeEndpointName = endpoint.path.replace(/\//g, '_').replace(/:/g, '');
    const responseFileName = `${safeEndpointName}_${endpoint.method.toLowerCase()}.json`;
    await saveResponseToFile(response, path.join(OUTPUT_DIR, 'responses', responseFileName));
    
    // Log outcome
    if (isSuccess) {
      logger.success(`✅ ${endpoint.method} ${endpoint.path} - ${response.status} (${responseTime}ms)`);
    } else {
      logger.error(`❌ ${endpoint.method} ${endpoint.path} - ${response.status} (${responseTime}ms)`);
    }
    
    return result;
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logger.error(`❌ Error testing ${endpoint.method} ${endpoint.path}: ${error.message}`);
    
    return {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: 'ERROR',
      error: error.message,
      responseTime,
      authenticated: endpoint.auth
    };
  }
}

/**
 * Run tests for all endpoints
 */
async function runAllEndpointTests() {
  logger.info('Starting comprehensive endpoint test run...');
  
  // Ensure output directory exists
  await fs.mkdir(path.join(OUTPUT_DIR, 'responses'), { recursive: true });
  
  // Get the auth token for tests that need it
  const token = loadAuthToken();
  if (!token) {
    logger.error('Authentication token not found. Run auth/test-login.js first.');
    process.exit(1);
  }
  
  // Initialize results object
  const testResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
      skipped: 0
    },
    categories: {},
    endpoints: []
  };
  
  // Get the endpoints to test
  const endpointsToTest = endpointConfig.comprehensiveEndpoints.filter(endpoint => {
    // Filter out test-only endpoints if not included
    if (endpoint.testOnly && !TEST_OPTIONS.includeTestOnly) {
      return false;
    }
    
    // Filter out diagnostic endpoints if not included
    if (endpoint.category === 'diagnostics' && !TEST_OPTIONS.includeDiagnostics) {
      return false;
    }
    
    return true;
  });
  
  // Update total count
  testResults.summary.total = endpointsToTest.length;
  
  // Initialize categories
  for (const endpoint of endpointsToTest) {
    if (!testResults.categories[endpoint.category]) {
      testResults.categories[endpoint.category] = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: 0,
        skipped: 0
      };
    }
    testResults.categories[endpoint.category].total++;
  }
  
  // Run tests for each endpoint
  for (const endpoint of endpointsToTest) {
    const result = await testEndpoint(endpoint, token);
    testResults.endpoints.push(result);
    
    // Update summary counts
    if (result.status === 'PASSED') {
      testResults.summary.passed++;
      testResults.categories[endpoint.category].passed++;
    } else if (result.status === 'FAILED') {
      testResults.summary.failed++;
      testResults.categories[endpoint.category].failed++;
    } else if (result.status === 'ERROR') {
      testResults.summary.errors++;
      testResults.categories[endpoint.category].errors++;
    } else if (result.status === 'SKIPPED') {
      testResults.summary.skipped++;
      testResults.categories[endpoint.category].skipped++;
    }
  }
  
  // Save results
  const resultsFile = path.join(OUTPUT_DIR, `endpoint-test-results-${new Date().toISOString().replace(/:/g, '-')}.json`);
  await fs.writeFile(resultsFile, JSON.stringify(testResults, null, 2));
  
  // Save a copy as "latest" for easy reference
  await fs.writeFile(path.join(OUTPUT_DIR, 'latest-results.json'), JSON.stringify(testResults, null, 2));
  
  // Generate a markdown report
  await generateMarkdownReport(testResults);
  
  // Print summary
  logger.info('==== ENDPOINT TEST COMPLETE ====');
  logger.info(`Total: ${testResults.summary.total}`);
  logger.info(`Passed: ${testResults.summary.passed}`);
  logger.info(`Failed: ${testResults.summary.failed}`);
  logger.info(`Errors: ${testResults.summary.errors}`);
  logger.info(`Skipped: ${testResults.summary.skipped}`);
  logger.info(`Success Rate: ${Math.round((testResults.summary.passed / (testResults.summary.total - testResults.summary.skipped)) * 100)}%`);
  logger.info('===============================');
  logger.info(`Detailed results saved to: ${OUTPUT_DIR}`);
}

/**
 * Generate a markdown report from the test results
 * 
 * @param {Object} results - Test results object
 */
async function generateMarkdownReport(results) {
  let markdown = `# NIFYA API Endpoint Test Results\n\n`;
  markdown += `Test run completed at: ${results.timestamp}\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total Endpoints: ${results.summary.total}\n`;
  markdown += `- Passed: ${results.summary.passed}\n`;
  markdown += `- Failed: ${results.summary.failed}\n`;
  markdown += `- Errors: ${results.summary.errors}\n`;
  markdown += `- Skipped: ${results.summary.skipped}\n`;
  
  const successRate = Math.round((results.summary.passed / (results.summary.total - results.summary.skipped)) * 100);
  markdown += `- Success Rate: ${successRate}%\n\n`;
  
  markdown += `## Results by Category\n\n`;
  
  for (const [category, stats] of Object.entries(results.categories)) {
    const categorySuccessRate = Math.round((stats.passed / (stats.total - stats.skipped)) * 100);
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    
    markdown += `### ${formattedCategory}\n\n`;
    markdown += `- Endpoints: ${stats.total}\n`;
    markdown += `- Passed: ${stats.passed}\n`;
    markdown += `- Failed: ${stats.failed}\n`;
    markdown += `- Errors: ${stats.errors}\n`;
    markdown += `- Skipped: ${stats.skipped}\n`;
    markdown += `- Success Rate: ${categorySuccessRate}%\n\n`;
  }
  
  markdown += `## Detailed Endpoint Results\n\n`;
  
  // Group endpoints by category for better organization
  const endpointsByCategory = {};
  
  for (const endpoint of results.endpoints) {
    const category = endpointConfig.comprehensiveEndpoints.find(e => 
      e.path === endpoint.path && e.method === endpoint.method
    )?.category || 'unknown';
    
    if (!endpointsByCategory[category]) {
      endpointsByCategory[category] = [];
    }
    
    endpointsByCategory[category].push(endpoint);
  }
  
  // Create a table for each category
  for (const [category, endpoints] of Object.entries(endpointsByCategory)) {
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    markdown += `### ${formattedCategory} Endpoints\n\n`;
    
    markdown += `| Endpoint | Method | Status | Response Code | Response Time |\n`;
    markdown += `|----------|--------|--------|---------------|---------------|\n`;
    
    for (const endpoint of endpoints) {
      const statusIcon = endpoint.status === 'PASSED' ? '✅' : 
                        endpoint.status === 'FAILED' ? '❌' : 
                        endpoint.status === 'ERROR' ? '⚠️' : '➖';
      
      markdown += `| ${endpoint.path} | ${endpoint.method} | ${statusIcon} ${endpoint.status} | ${endpoint.statusCode || '-'} | ${endpoint.responseTime || '-'}ms |\n`;
    }
    
    markdown += `\n`;
  }
  
  // Write the report
  const reportPath = path.join(OUTPUT_DIR, 'endpoint-test-report.md');
  await fs.writeFile(reportPath, markdown);
  
  // Also save as latest
  await fs.writeFile(path.join(OUTPUT_DIR, 'latest-report.md'), markdown);
  
  logger.info(`Markdown report generated: ${reportPath}`);
}

// Run the tests
runAllEndpointTests().catch(error => {
  logger.error(`Test runner failed: ${error.message}`);
});