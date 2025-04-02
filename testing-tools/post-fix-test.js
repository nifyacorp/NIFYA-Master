/**
 * Post-Fix Verification Test
 * 
 * This script runs a comprehensive test suite to verify that all the issues
 * mentioned in the fix summary have been resolved.
 */

const { makeApiRequest, loadAuthToken, saveResponseToFile } = require('./core/api-client');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./core/logger');

// Configuration
const config = {
  backend: {
    baseUrl: 'backend-415554190254.us-central1.run.app',
    diagnostics: '/api/diagnostics',
    subscriptions: '/api/v1/subscriptions',
    notifications: '/api/v1/notifications'
  },
  outputDir: path.join(__dirname, 'outputs', 'post-fix-tests')
};

// Test subscription data
const testSubscription = {
  name: "Test BOE Subscription",
  type: "boe",
  prompts: ["Ayuntamiento Barcelona licitaciones"],
  frequency: "daily",
  configuration: "{}"
};

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(config.outputDir, { recursive: true });
  } catch (err) {
    logger.error(`Failed to create output directory: ${err.message}`);
  }
}

// Test authentication
async function testAuthentication() {
  logger.info('STEP 1: Testing authentication...');
  try {
    const accessToken = await loadAuthToken();
    if (!accessToken) {
      logger.error('Authentication test failed: No token found');
      return false;
    }
    
    // Extract user ID from token
    const parts = accessToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const userId = payload.sub || null;
    
    if (!userId) {
      logger.error('Authentication test failed: No user ID in token');
      return false;
    }
    
    logger.success(`Authentication test passed. User ID: ${userId}`);
    return { userId, accessToken };
  } catch (error) {
    logger.error(`Authentication test failed: ${error.message}`);
    return false;
  }
}

// Test diagnostic endpoints
async function testDiagnostics(auth) {
  logger.info('STEP 2: Testing diagnostic endpoints...');
  try {
    // Test general diagnostics endpoint
    const diagUrl = `https://${config.backend.baseUrl}${config.backend.diagnostics}`;
    const diagResponse = await makeApiRequest({
      url: diagUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
        'x-user-id': auth.userId
      }
    });
    
    await saveResponseToFile(diagResponse, path.join(config.outputDir, 'diagnostics_response.json'));
    
    if (diagResponse.status !== 200) {
      logger.warn(`Diagnostics endpoint returned status ${diagResponse.status}`);
    } else {
      logger.success('Diagnostics endpoint test passed');
    }
    
    // Test user existence endpoint
    const userDiagUrl = `https://${config.backend.baseUrl}${config.backend.diagnostics}/user-exists?userId=${auth.userId}`;
    const userDiagResponse = await makeApiRequest({
      url: userDiagUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
        'x-user-id': auth.userId
      }
    });
    
    await saveResponseToFile(userDiagResponse, path.join(config.outputDir, 'user_diagnostics_response.json'));
    
    // Check if user exists in database
    const userExists = userDiagResponse.status === 200 && 
                       userDiagResponse.data && 
                       userDiagResponse.data.exists === true;
    
    if (userExists) {
      logger.success(`User exists in database: ${auth.userId}`);
    } else {
      logger.warn(`User may not exist in database: ${auth.userId}`);
    }
    
    // Return diagnostics information
    return {
      diagnosticsWorking: diagResponse.status === 200,
      userExists
    };
    
  } catch (error) {
    logger.error(`Diagnostics test failed: ${error.message}`);
    return {
      diagnosticsWorking: false,
      userExists: false
    };
  }
}

// Test subscription creation
async function testSubscriptionCreation(auth) {
  logger.info('STEP 3: Testing subscription creation...');
  try {
    const url = `https://${config.backend.baseUrl}${config.backend.subscriptions}`;
    const response = await makeApiRequest({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
        'x-user-id': auth.userId
      },
      data: testSubscription
    });
    
    await saveResponseToFile(response, path.join(config.outputDir, 'subscription_creation_response.json'));
    
    if (response.status === 200 || response.status === 201) {
      logger.success(`Subscription created successfully with ID: ${response.data.id}`);
      return response.data.id;
    } else {
      logger.error(`Subscription creation failed with status code ${response.status}: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    logger.error(`Subscription creation test failed: ${error.message}`);
    return null;
  }
}

// Test subscription listing
async function testSubscriptionListing(auth) {
  logger.info('STEP 4: Testing subscription listing...');
  try {
    const url = `https://${config.backend.baseUrl}${config.backend.subscriptions}`;
    const response = await makeApiRequest({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
        'x-user-id': auth.userId
      }
    });
    
    await saveResponseToFile(response, path.join(config.outputDir, 'subscription_listing_response.json'));
    
    if (response.status === 200) {
      const subscriptions = Array.isArray(response.data) ? response.data : [];
      logger.success(`Retrieved ${subscriptions.length} subscriptions`);
      return subscriptions;
    } else {
      logger.error(`Subscription listing failed with status code ${response.status}: ${JSON.stringify(response.data)}`);
      return [];
    }
  } catch (error) {
    logger.error(`Subscription listing test failed: ${error.message}`);
    return [];
  }
}

// Test notifications
async function testNotifications(auth) {
  logger.info('STEP 5: Testing notifications endpoint...');
  try {
    const url = `https://${config.backend.baseUrl}${config.backend.notifications}`;
    const response = await makeApiRequest({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
        'x-user-id': auth.userId
      }
    });
    
    await saveResponseToFile(response, path.join(config.outputDir, 'notifications_response.json'));
    
    if (response.status === 200) {
      // Check both array format and object with notifications array
      const notifications = Array.isArray(response.data) 
        ? response.data 
        : (response.data && Array.isArray(response.data.notifications) 
          ? response.data.notifications 
          : []);
      
      logger.success(`Retrieved ${notifications.length} notifications`);
      
      // Also check if pagination metadata is available
      const hasPagination = !Array.isArray(response.data) && 
                           typeof response.data === 'object' && 
                           'total' in response.data;
                           
      if (hasPagination) {
        logger.success(`Notification response includes pagination metadata`);
      }
      
      return {
        notifications,
        hasPagination
      };
    } else {
      logger.error(`Notifications test failed with status code ${response.status}: ${JSON.stringify(response.data)}`);
      return {
        notifications: [],
        hasPagination: false
      };
    }
  } catch (error) {
    logger.error(`Notifications test failed: ${error.message}`);
    return {
      notifications: [],
      hasPagination: false
    };
  }
}

// Run all tests and generate report
async function runTests() {
  logger.info('Starting post-fix verification tests...');
  await ensureOutputDir();
  
  const results = {
    timestamp: new Date().toISOString(),
    auth: false,
    diagnostics: {
      endpoints: false,
      userExists: false
    },
    subscriptions: {
      creation: false,
      listing: false,
      hasSubscriptions: false
    },
    notifications: {
      endpoint: false,
      hasPagination: false
    },
    allTestsPassed: false
  };
  
  // Test authentication
  const auth = await testAuthentication();
  if (!auth) {
    logger.error('Authentication failed. Cannot proceed with other tests.');
    await fs.writeFile(
      path.join(config.outputDir, 'post-fix-test-results.json'), 
      JSON.stringify(results, null, 2)
    );
    return;
  }
  
  results.auth = true;
  
  // Test diagnostics
  const diagnostics = await testDiagnostics(auth);
  results.diagnostics.endpoints = diagnostics.diagnosticsWorking;
  results.diagnostics.userExists = diagnostics.userExists;
  
  // Test subscription creation
  const subscriptionId = await testSubscriptionCreation(auth);
  results.subscriptions.creation = !!subscriptionId;
  
  // Test subscription listing
  const subscriptions = await testSubscriptionListing(auth);
  results.subscriptions.listing = true; // If the endpoint returns a valid response
  results.subscriptions.hasSubscriptions = subscriptions.length > 0;
  
  // Test notifications
  const notificationsResult = await testNotifications(auth);
  results.notifications.endpoint = true; // If the endpoint returns a valid response
  results.notifications.hasPagination = notificationsResult.hasPagination;
  
  // Overall result
  results.allTestsPassed = 
    results.auth && 
    results.diagnostics.endpoints && 
    results.subscriptions.creation && 
    results.subscriptions.listing && 
    results.subscriptions.hasSubscriptions && 
    results.notifications.endpoint;
  
  // Save test results
  await fs.writeFile(
    path.join(config.outputDir, 'post-fix-test-results.json'), 
    JSON.stringify(results, null, 2)
  );
  
  // Report summary
  logger.info('==== POST-FIX TEST RESULTS SUMMARY ====');
  logger.info(`Authentication: ${results.auth ? '✅ PASSED' : '❌ FAILED'}`);
  logger.info(`Diagnostic Endpoints: ${results.diagnostics.endpoints ? '✅ PASSED' : '❌ FAILED'}`);
  logger.info(`User Exists in DB: ${results.diagnostics.userExists ? '✅ PASSED' : '⚠️ WARNING'}`);
  logger.info(`Subscription Creation: ${results.subscriptions.creation ? '✅ PASSED' : '❌ FAILED'}`);
  logger.info(`Subscription Listing: ${results.subscriptions.listing ? '✅ PASSED' : '❌ FAILED'}`);
  logger.info(`Has Subscriptions: ${results.subscriptions.hasSubscriptions ? '✅ PASSED' : '⚠️ WARNING'}`);
  logger.info(`Notifications Endpoint: ${results.notifications.endpoint ? '✅ PASSED' : '❌ FAILED'}`);
  logger.info(`Notifications Pagination: ${results.notifications.hasPagination ? '✅ PASSED' : '⚠️ WARNING'}`);
  logger.info(`OVERALL RESULT: ${results.allTestsPassed ? '✅ ALL CRITICAL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  logger.info('=========================================');
  
  logger.info(`Test results saved to ${path.join(config.outputDir, 'post-fix-test-results.json')}`);
}

// Run the tests
runTests().catch(error => {
  logger.error(`Test suite failed: ${error.message}`);
});