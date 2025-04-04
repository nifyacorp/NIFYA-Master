/**
 * Subscription Management Test Suite
 * 
 * This script tests all subscription management endpoints including:
 * - Creating subscriptions
 * - Retrieving subscription details
 * - Updating subscriptions
 * - Toggling subscription status
 * - Processing subscriptions
 * - Deleting subscriptions
 * - Sharing subscriptions
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../core/logger');
const endpoints = require('../../config/endpoints');
const apiClient = require('../../core/api-client');
const testAuth = require('../auth/login');

// Output directory for test results
const OUTPUT_DIR = path.join(__dirname, '../../outputs/subscription-tests');
const RESULTS_DIR = path.join(__dirname, '../../outputs/reports');

// Test subscription payloads
const TEST_SUBSCRIPTIONS = {
  boe: {
    name: "Test BOE Subscription " + new Date().toISOString(),
    type: "boe",
    templateId: "boe-default",
    prompts: { value: "Ayuntamiento Barcelona licitaciones" },
    frequency: "daily",
    configuration: {},
    logo: null
  },
  realEstate: {
    name: "Test Real Estate Subscription " + new Date().toISOString(),
    type: "real-estate",
    templateId: "real-estate-rental",
    prompts: { value: "Barcelona, 2 bedrooms, < 1200€" },
    frequency: "daily",
    configuration: {
      location: "Barcelona",
      maxPrice: 1200,
      bedrooms: 2
    },
    logo: null
  }
};

// Ensure output directories exist
async function ensureDirectories() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(RESULTS_DIR, { recursive: true });
}

// Save result to file
async function saveResult(filename, data) {
  await ensureDirectories();
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  logger.info(`Saved result to ${filePath}`);
  return filePath;
}

// Generate test report in markdown format
async function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportFilename = `subscription-management-test-${timestamp}.md`;
  const reportPath = path.join(RESULTS_DIR, reportFilename);
  
  // Generate report content
  const report = `# Subscription Management API Test Results

**Test Time:** ${new Date().toISOString()}
**Overall Status:** ${results.overall.success ? '✅ PASSED' : '❌ FAILED'}
**Success Rate:** ${results.overall.successRate.toFixed(2)}%

## Test Summary

| Test | Status | Details |
|------|--------|---------|
${Object.entries(results.tests).map(([name, test]) => 
  `| ${name} | ${test.success ? '✅ PASSED' : '❌ FAILED'} | ${test.details || ''} |`
).join('\n')}

## Detailed Results

${Object.entries(results.tests).map(([name, test]) => `
### ${name}
- **Status:** ${test.success ? '✅ PASSED' : '❌ FAILED'}
- **Endpoint:** \`${test.endpoint || 'N/A'}\`
- **Method:** \`${test.method || 'N/A'}\`
${test.error ? `- **Error:** ${test.error}` : ''}
${test.details ? `- **Details:** ${test.details}` : ''}
${test.duration ? `- **Duration:** ${test.duration}ms` : ''}
`).join('\n')}

## Test Environment

- **Backend URL:** ${endpoints.backend.baseUrl}
- **Authentication URL:** ${endpoints.auth.baseUrl}
- **Test Date:** ${new Date().toISOString()}

## Next Steps
${results.overall.successRate === 100 ? 
  '- All subscription management APIs are working correctly! No further action needed.' : 
  '- Investigate and fix failing endpoints\n- Ensure subscription processing is operational\n- Check database connections for subscription operations'}

---
Generated ${new Date().toISOString()}
`;

  await fs.writeFile(reportPath, report);
  logger.info(`Generated test report at ${reportPath}`);
  return reportPath;
}

// Run a full suite of subscription management tests
async function runSubscriptionTests() {
  logger.info('Starting subscription management tests');
  const startTime = Date.now();

  // Test authentication first
  logger.info('Authenticating user...');
  const authResult = await testAuth();
  
  if (!authResult.success) {
    logger.error('Authentication failed, cannot continue tests', authResult.error);
    return {
      overall: {
        success: false,
        successRate: 0,
        duration: Date.now() - startTime,
        error: 'Authentication failed'
      },
      tests: {
        authentication: {
          success: false,
          error: authResult.error,
          details: 'Authentication failed, cannot proceed with subscription tests'
        }
      }
    };
  }
  
  // Authentication successful, extract credentials
  const token = authResult.token;
  const userId = authResult.userId;
  
  // Store test results
  const results = {
    overall: {
      success: true,
      successCount: 0,
      failureCount: 0,
      successRate: 0
    },
    tests: {
      authentication: {
        success: true,
        endpoint: `https://${endpoints.auth.baseUrl}${endpoints.auth.login}`,
        method: 'POST',
        details: 'Successfully authenticated user',
        duration: Date.now() - startTime
      }
    },
    createdSubscriptions: []
  };
  
  // Track created subscriptions for cleanup
  const createdSubscriptions = [];
  let currentSubscriptionId = null; // Will be set when first subscription is created
  
  // Helper to make authenticated API requests
  async function makeAuthorizedRequest({ method, endpoint, data = null }) {
    try {
      const url = `https://${endpoints.backend.baseUrl}${endpoint}`;
      const response = await apiClient.makeApiRequest({
        url,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        data
      });
      
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      logger.error(`API request failed: ${method} ${endpoint}`, error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.message
      };
    }
  }
  
  // Helper to run a test and record results
  async function runTest({ name, endpoint, method, data = null, testFn = null }) {
    logger.info(`Running test: ${name}`);
    const testStartTime = Date.now();
    
    try {
      let response;
      
      if (testFn) {
        // Use custom test function if provided
        response = await testFn();
      } else {
        // Otherwise make a standard API request
        response = await makeAuthorizedRequest({
          method,
          endpoint,
          data
        });
      }
      
      // Save response data
      await saveResult(`${name.toLowerCase().replace(/\s+/g, '-')}.json`, response);
      
      // Record test result
      const testResult = {
        success: response.success,
        endpoint,
        method,
        duration: Date.now() - testStartTime
      };
      
      if (!response.success) {
        testResult.error = response.error || `Request failed with status ${response.status}`;
        testResult.details = response.details || JSON.stringify(response.data);
        results.overall.failureCount++;
      } else {
        testResult.details = `Request successful with status ${response.status}`;
        results.overall.successCount++;
      }
      
      results.tests[name] = testResult;
      logger.info(`Test ${name} ${testResult.success ? 'passed' : 'failed'}`);
      
      return response;
    } catch (error) {
      // Handle any unexpected errors
      const testResult = {
        success: false,
        endpoint,
        method,
        error: error.message,
        details: 'Unexpected error during test execution',
        duration: Date.now() - testStartTime
      };
      
      results.tests[name] = testResult;
      results.overall.failureCount++;
      
      logger.error(`Test ${name} failed with error:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // Test 1: List Subscriptions
  await runTest({
    name: 'List Subscriptions',
    endpoint: endpoints.backend.subscriptions.list,
    method: 'GET'
  });
  
  // Test 2: Get Subscription Types
  await runTest({
    name: 'Get Subscription Types',
    endpoint: endpoints.backend.subscriptions.types,
    method: 'GET'
  });
  
  // Test 2.1: Debug Filter Endpoint
  await runTest({
    name: 'Debug Filter Endpoint',
    endpoint: endpoints.backend.subscriptions.debugFilter,
    method: 'GET'
  });
  
  // Test 2.2: Debug Filter with Parameters
  await runTest({
    name: 'Debug Filter with Parameters',
    endpoint: `${endpoints.backend.subscriptions.debugFilter}?type=boe&status=active&limit=10`,
    method: 'GET'
  });
  
  // Test 3: Create BOE Subscription
  const createResult = await runTest({
    name: 'Create BOE Subscription',
    endpoint: endpoints.backend.subscriptions.create,
    method: 'POST',
    data: TEST_SUBSCRIPTIONS.boe
  });
  
  // If subscription was created, save ID for later tests
  if (createResult.success && createResult.data) {
    // Handle different response formats
    if (createResult.data.data?.subscription?.id) {
      currentSubscriptionId = createResult.data.data.subscription.id;
    } else if (createResult.data.data?.id) {
      currentSubscriptionId = createResult.data.data.id;
    } else if (createResult.data.subscription?.id) {
      currentSubscriptionId = createResult.data.subscription.id;
    } else if (createResult.data.id) {
      currentSubscriptionId = createResult.data.id;
    }
    
    if (currentSubscriptionId) {
      createdSubscriptions.push(currentSubscriptionId);
      logger.info(`Created subscription with ID: ${currentSubscriptionId}`);
    } else {
      logger.warn('Subscription created but ID not found in response');
    }
  }
  
  // Test 4: Create Real Estate Subscription (only if first creation worked)
  if (createResult.success) {
    const createRealEstateResult = await runTest({
      name: 'Create Real Estate Subscription',
      endpoint: endpoints.backend.subscriptions.create,
      method: 'POST',
      data: TEST_SUBSCRIPTIONS.realEstate
    });
    
    // Save ID if successful
    if (createRealEstateResult.success && createRealEstateResult.data) {
      let subscriptionId;
      // Handle different response formats
      if (createRealEstateResult.data.data?.subscription?.id) {
        subscriptionId = createRealEstateResult.data.data.subscription.id;
      } else if (createRealEstateResult.data.data?.id) {
        subscriptionId = createRealEstateResult.data.data.id;
      } else if (createRealEstateResult.data.subscription?.id) {
        subscriptionId = createRealEstateResult.data.subscription.id;
      } else if (createRealEstateResult.data.id) {
        subscriptionId = createRealEstateResult.data.id;
      }
      
      if (subscriptionId) {
        createdSubscriptions.push(subscriptionId);
        logger.info(`Created real estate subscription with ID: ${subscriptionId}`);
      }
    }
  }
  
  // Only continue with subscription-specific tests if we have an ID
  if (currentSubscriptionId) {
    // Test 5: Get Subscription Details
    await runTest({
      name: 'Get Subscription Details',
      endpoint: endpoints.backend.subscriptions.detail(currentSubscriptionId),
      method: 'GET'
    });
    
    // Test 6: Update Subscription
    await runTest({
      name: 'Update Subscription',
      endpoint: endpoints.backend.subscriptions.update(currentSubscriptionId),
      method: 'PUT',
      data: {
        name: `Updated BOE Subscription ${new Date().toISOString()}`,
        prompts: { value: "Ayuntamiento Barcelona contratos públicos" }
      }
    });
    
    // Test 7: Toggle Subscription
    await runTest({
      name: 'Toggle Subscription',
      endpoint: endpoints.backend.subscriptions.toggle(currentSubscriptionId),
      method: 'POST'
    });
    
    // Test 8: Get Subscription Status
    await runTest({
      name: 'Get Subscription Status',
      endpoint: endpoints.backend.subscriptions.status(currentSubscriptionId),
      method: 'GET'
    });
    
    // Test 9: Process Subscription
    await runTest({
      name: 'Process Subscription',
      endpoint: endpoints.backend.subscriptions.process(currentSubscriptionId),
      method: 'POST'
    });
    
    // Test 10: Share Subscription (if endpoint supports it)
    await runTest({
      name: 'Share Subscription',
      endpoint: endpoints.backend.subscriptions.share(currentSubscriptionId),
      method: 'POST',
      data: {
        emails: ["test@example.com"]
      }
    });
    
    // Test 11: Remove Sharing (if endpoint supports it)
    await runTest({
      name: 'Remove Subscription Sharing',
      endpoint: endpoints.backend.subscriptions.removeSharing(currentSubscriptionId),
      method: 'DELETE'
    });
  }
  
  // Test 12: Cleanup - Delete Subscriptions
  // Only attempt deletion if we created subscriptions
  if (createdSubscriptions.length > 0) {
    let allDeletionsSuccessful = true;
    
    // Delete each subscription
    for (const subscriptionId of createdSubscriptions) {
      const deleteResult = await runTest({
        name: `Delete Subscription ${subscriptionId}`,
        endpoint: endpoints.backend.subscriptions.delete(subscriptionId),
        method: 'DELETE'
      });
      
      if (!deleteResult.success) {
        allDeletionsSuccessful = false;
      }
    }
    
    results.tests['Subscription Cleanup'] = {
      success: allDeletionsSuccessful,
      details: `Deleted ${createdSubscriptions.length} test subscriptions`,
      endpoint: 'Multiple DELETE endpoints',
      method: 'DELETE'
    };
    
    if (allDeletionsSuccessful) {
      results.overall.successCount++;
    } else {
      results.overall.failureCount++;
    }
  }
  
  // Calculate overall success rate
  const totalTests = results.overall.successCount + results.overall.failureCount;
  results.overall.successRate = (results.overall.successCount / totalTests) * 100;
  results.overall.success = results.overall.successRate >= 80; // Success if 80% or more tests pass
  results.overall.duration = Date.now() - startTime;
  
  // Generate and save test report
  const reportPath = await generateReport(results);
  
  return {
    results,
    reportPath,
    outputDir: OUTPUT_DIR
  };
}

// Run tests if executed directly
if (require.main === module) {
  runSubscriptionTests()
    .then(({ results, reportPath }) => {
      console.log(`\nSubscription Management Test Suite Complete!`);
      console.log(`Overall Status: ${results.overall.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Success Rate: ${results.overall.successRate.toFixed(2)}%`);
      console.log(`${results.overall.successCount} tests passed, ${results.overall.failureCount} tests failed`);
      console.log(`\nDetailed report saved to: ${reportPath}`);
      
      // Exit with appropriate code
      process.exit(results.overall.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running subscription management tests:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = runSubscriptionTests;
}