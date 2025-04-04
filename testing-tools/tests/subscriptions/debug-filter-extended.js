/**
 * Extended Subscription Debug Filter Test
 * 
 * This script provides extended testing for subscription filtering issues:
 * 1. Tests the new diagnostic endpoint for subscription filtering
 * 2. Compares the results with the standard list endpoint 
 * 3. Analyzes parameter parsing between both endpoints
 */

const fs = require('fs');
const path = require('path');
const apiClient = require('../../core/api-client');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');

// Output directories
const OUTPUT_DIR = path.join(__dirname, '../../outputs');
const RESPONSES_DIR = path.join(OUTPUT_DIR, 'responses');
const REPORTS_DIR = path.join(OUTPUT_DIR, 'reports');

// Ensure directories exist
if (!fs.existsSync(RESPONSES_DIR)) fs.mkdirSync(RESPONSES_DIR, { recursive: true });
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

/**
 * Test both the subscription debug-filter endpoint and list endpoint with the same parameters
 * This helps identify if the filter issues are in parameter parsing or endpoint implementation
 * @param {string} [token] - Authentication token (will be loaded from file if not provided)
 * @returns {Promise<Object>} Test result
 */
async function testExtendedDebugFilter(token = null) {
  const testName = 'subscription-debug-filter-extended';
  logger.info('Starting extended subscription debug-filter test', null, testName);
  
  // Load token if not provided
  if (!token) {
    token = apiClient.loadAuthToken();
    if (!token) {
      logger.error('No authentication token available', null, testName);
      logger.testResult(testName, false, 'No authentication token available');
      return { success: false, error: 'No authentication token available' };
    }
  }
  
  // Multiple test cases with different query parameters
  const testCases = [
    { name: 'basic', params: {} },
    { name: 'type-filter', params: { type: 'boe' } },
    { name: 'status-filter', params: { status: 'active' } },
    { name: 'date-filter', params: { createdAfter: '2025-01-01' } },
    { name: 'combined-filters', params: { type: 'boe', status: 'active', limit: 10 } },
    // Additional test cases for more debugging
    { name: 'with-search', params: { search: 'test' } },
    { name: 'with-sort', params: { sortBy: 'createdAt', sortOrder: 'desc' } },
    { name: 'pagination', params: { page: 1, limit: 5 } }
  ];
  
  const results = {
    debugFilter: [],
    listEndpoint: []
  };
  
  const userId = apiClient.getUserIdFromToken(token);
  
  // Run tests against both endpoints
  for (const testCase of testCases) {
    const queryParams = new URLSearchParams(testCase.params).toString();
    const queryString = queryParams ? `?${queryParams}` : '';
    
    logger.info(`Testing with params: ${JSON.stringify(testCase.params)}`, null, testName);
    
    // Test 1: Debug Filter Endpoint
    try {
      const debugFilterOptions = {
        hostname: endpoints.backend.baseUrl,
        port: 443,
        path: `${endpoints.backend.subscriptions.debugFilter}${queryString}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      };
      
      logger.info(`Testing debug-filter endpoint with params: ${JSON.stringify(testCase.params)}`, null, testName);
      const debugResponse = await apiClient.makeApiRequest(debugFilterOptions, token);
      
      // Save response to file
      const debugFileName = `subscription_debug_filter_${testCase.name}`;
      apiClient.saveResponseToFile(debugFileName, debugResponse, RESPONSES_DIR);
      
      results.debugFilter.push({
        testCase: testCase.name,
        success: debugResponse.statusCode === 200,
        statusCode: debugResponse.statusCode,
        response: debugResponse.data
      });
    } catch (error) {
      logger.error(`Error during debug filter test for '${testCase.name}'`, error, testName);
      results.debugFilter.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
    }
    
    // Test 2: Standard List Endpoint with the same parameters
    try {
      const listOptions = {
        hostname: endpoints.backend.baseUrl,
        port: 443,
        path: `${endpoints.backend.subscriptions.list}${queryString}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      };
      
      logger.info(`Testing list endpoint with params: ${JSON.stringify(testCase.params)}`, null, testName);
      const listResponse = await apiClient.makeApiRequest(listOptions, token);
      
      // Save response to file
      const listFileName = `subscription_list_${testCase.name}`;
      apiClient.saveResponseToFile(listFileName, listResponse, RESPONSES_DIR);
      
      results.listEndpoint.push({
        testCase: testCase.name,
        success: listResponse.statusCode === 200,
        statusCode: listResponse.statusCode,
        response: listResponse.data,
        count: listResponse.data?.data?.subscriptions?.length || 0
      });
    } catch (error) {
      logger.error(`Error during list endpoint test for '${testCase.name}'`, error, testName);
      results.listEndpoint.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Generate diagnostic report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFileName = `subscription-filter-diagnostic-${timestamp}.md`;
  const reportFilePath = path.join(REPORTS_DIR, reportFileName);
  
  try {
    // Generate diagnostic report
    const reportContent = generateDiagnosticReport(results, testCases);
    
    // Ensure report directory exists
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    
    fs.writeFileSync(reportFilePath, reportContent);
    logger.info(`Diagnostic report saved to ${reportFilePath}`, null, testName);
  } catch (error) {
    logger.error(`Error generating diagnostic report: ${error.message}`, null, testName);
  }
  
  // Determine overall success
  const debugFilterSuccess = results.debugFilter.every(result => result.success);
  const listEndpointSuccess = results.listEndpoint.every(result => result.success);
  const allSuccessful = debugFilterSuccess && listEndpointSuccess;
  
  if (allSuccessful) {
    logger.success(`All filter tests passed`, null, testName);
    logger.testResult(testName, true, { 
      totalTests: testCases.length * 2, 
      passedTests: testCases.length * 2
    });
    
    return { 
      success: true, 
      results: {
        tests: results,
        overall: {
          success: true,
          successRate: 100
        }
      },
      reportPath: reportFilePath
    };
  } else {
    const debugFailedCount = results.debugFilter.filter(result => !result.success).length;
    const listFailedCount = results.listEndpoint.filter(result => !result.success).length;
    const totalFailedCount = debugFailedCount + listFailedCount;
    const successRate = ((testCases.length * 2) - totalFailedCount) / (testCases.length * 2) * 100;
    
    logger.error(`Some filter tests failed (${(testCases.length * 2) - totalFailedCount}/${testCases.length * 2} passed)`, null, testName);
    logger.testResult(testName, false, { 
      totalTests: testCases.length * 2, 
      passedTests: (testCases.length * 2) - totalFailedCount,
      failedTests: totalFailedCount
    });
    
    return { 
      success: false, 
      results: {
        tests: results,
        overall: {
          success: false,
          successRate: successRate
        }
      },
      error: `${totalFailedCount} tests failed`,
      reportPath: reportFilePath
    };
  }
}

/**
 * Generate a comprehensive markdown report for the filter testing
 * @param {Object} results - Test results for both endpoints
 * @param {Array} testCases - Test cases that were run
 * @returns {string} Markdown report content
 */
function generateDiagnosticReport(results, testCases) {
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
  let report = `# Subscription Filter Diagnostic Report
  
**Test Date:** ${timestamp}
**Environment:** ${process.env.ENV || 'development'}

## Overview

This report documents comprehensive testing of subscription filtering mechanisms, comparing the new debug-filter endpoint with the standard list endpoint using identical query parameters.

## Test Cases

${testCases.map(tc => `- **${tc.name}**: \`${new URLSearchParams(tc.params).toString() || 'No parameters'}\``).join('\n')}

## Debug Filter Endpoint Results

| Test Case | Parameters | Status Code | Response |
|-----------|------------|-------------|----------|
${results.debugFilter.map(result => {
  const params = testCases.find(tc => tc.name === result.testCase).params;
  const queryString = new URLSearchParams(params).toString() || 'None';
  const response = result.response ? JSON.stringify(result.response).substring(0, 100) + (JSON.stringify(result.response).length > 100 ? '...' : '') : result.error || 'N/A';
  return `| ${result.testCase} | \`${queryString}\` | ${result.statusCode || 'Error'} | \`${response}\` |`;
}).join('\n')}

## List Endpoint Results

| Test Case | Parameters | Status Code | Items Count | Response |
|-----------|------------|-------------|-------------|----------|
${results.listEndpoint.map(result => {
  const params = testCases.find(tc => tc.name === result.testCase).params;
  const queryString = new URLSearchParams(params).toString() || 'None';
  const itemCount = result.count !== undefined ? result.count : 'N/A';
  const responseStr = result.response ? 
    (result.response.status === 'success' ? 'Success' : JSON.stringify(result.response).substring(0, 100) + '...') : 
    result.error || 'N/A';
  return `| ${result.testCase} | \`${queryString}\` | ${result.statusCode || 'Error'} | ${itemCount} | \`${responseStr}\` |`;
}).join('\n')}

## Analysis

### Debug Filter Endpoint

${results.debugFilter.every(r => r.statusCode === 404) ? 
  '**Major Issue**: The debug filter endpoint is consistently returning 404 "SUBSCRIPTION_NOT_FOUND" errors for all test cases. This suggests the endpoint is likely trying to find a specific subscription rather than debugging filter parameters.' : 
  '**Status**: The debug filter endpoint shows varying responses based on the parameters.'}

${results.debugFilter.some(r => r.success) ? 
  '**Successful Cases**: Some test cases returned 200 responses, indicating partial functionality.' : 
  '**No Successful Responses**: All test cases failed, indicating a fundamental issue with the endpoint implementation.'}

### List Endpoint

${results.listEndpoint.every(r => r.success) ? 
  '**Status**: The standard list endpoint is functioning correctly with all parameter combinations.' : 
  '**Issues Detected**: The standard list endpoint is showing failures with some parameter combinations.'}

${results.listEndpoint.some(r => r.count > 0) ? 
  `**Data Retrieved**: The list endpoint successfully retrieved subscription data in ${results.listEndpoint.filter(r => r.count > 0).length} of ${results.listEndpoint.length} test cases.` : 
  '**No Data**: The list endpoint did not return any subscription data in any test case, which could indicate an empty database or filtering issues.'}

## Parameter Processing Comparison

${testCases.map(tc => {
  const debugResult = results.debugFilter.find(r => r.testCase === tc.name);
  const listResult = results.listEndpoint.find(r => r.testCase === tc.name);
  const queryString = new URLSearchParams(tc.params).toString() || 'None';
  
  return `### Test Case: ${tc.name} (${queryString})
  
**Debug Filter Response**: ${debugResult?.statusCode || 'Error'} ${debugResult?.success ? 'Success' : 'Failed'}
**List Endpoint Response**: ${listResult?.statusCode || 'Error'} ${listResult?.success ? 'Success' : 'Failed'} (${listResult?.count || 0} items)

${(debugResult?.success && listResult?.success) ? 
  '**Consistent**: Both endpoints processed these parameters successfully.' : 
  ((!debugResult?.success && !listResult?.success) ? 
    '**Consistent Failure**: Both endpoints failed with these parameters.' : 
    '**Inconsistent**: One endpoint succeeded while the other failed with these parameters, suggesting different parameter handling logic.')}`;
}).join('\n\n')}

## Recommendations

1. **Debug Filter Implementation**: The backend team should revisit the debug filter endpoint implementation. It appears to be treating the route as a subscription detail endpoint rather than a diagnostic tool.

2. **Expected Behavior**: The debug filter endpoint should:
   - Return a 200 status code for all valid parameter combinations
   - Include the parsed parameters in the response
   - Show how those parameters are translated into database queries
   - Not attempt to find a specific subscription by ID

3. **Example Expected Response**:
\`\`\`json
{
  "status": "success",
  "data": {
    "parsedParams": {
      "type": "boe",
      "status": "active",
      "limit": 10
    },
    "sqlQuery": "SELECT * FROM subscriptions WHERE type = 'boe' AND status = 'active' LIMIT 10",
    "expectedResults": 5
  }
}
\`\`\`

4. **Filtering Logic Review**: ${results.listEndpoint.every(r => r.success) ? 
  'The standard list endpoint appears to handle all parameter combinations correctly.' : 
  'The standard list endpoint shows inconsistent behavior with some parameter combinations, suggesting filtering logic issues that should be addressed.'}

## Implementation Notes

To fix the debug filter endpoint, the backend team should ensure:

1. The route pattern matches \`/api/v1/subscriptions/debug-filter\` exactly
2. The controller function does not attempt to retrieve a subscription by ID
3. The function extracts and parses query parameters
4. A response is returned showing how those parameters would be used in filtering
5. No actual database query for subscriptions is necessary, just the parsing logic

## Conclusion

${results.debugFilter.every(r => r.statusCode === 404) ? 
  'The debug filter endpoint requires immediate attention as it is not functioning as intended. The 404 errors suggest a routing or implementation issue where the endpoint is being confused with a subscription detail endpoint.' : 
  'The debug filter endpoint shows varying levels of functionality depending on the parameters used.'}

${results.listEndpoint.every(r => r.success) ? 
  'The standard list endpoint is functioning correctly, suggesting the issue is isolated to the new debug endpoint.' : 
  'Both endpoints show issues that need to be addressed to ensure proper subscription filtering.'}

This report should be shared with the backend development team to help identify and resolve the issues with the debug filter endpoint.
`;

  return report;
}

// Run the test if this script is called directly
if (require.main === module) {
  testExtendedDebugFilter()
    .then(result => {
      if (result.success) {
        logger.success('Extended subscription debug-filter test completed successfully');
        logger.info(`Diagnostic report available at: ${result.reportPath}`);
      } else {
        logger.error('Extended subscription debug-filter test failed', result.error);
        logger.info(`Diagnostic report available at: ${result.reportPath}`);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error in extended subscription debug-filter test', error);
      process.exit(1);
    });
}

module.exports = testExtendedDebugFilter;