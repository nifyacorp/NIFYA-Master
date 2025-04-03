/**
 * Test Notification Pipeline
 * 
 * This script runs the notification pipeline test to verify
 * end-to-end functionality of subscription processing and
 * notification delivery.
 */

const path = require('path');
const fs = require('fs').promises;
const logger = require('./core/logger');
const testPipeline = require('./tests/integration/test-notification-pipeline');

// Run the test and display results
async function runTest() {
  logger.info('Starting notification pipeline test');
  
  try {
    const result = await testPipeline();
    
    // Print results to console
    console.log('\n==============================');
    console.log('NOTIFICATION PIPELINE TEST RESULTS');
    console.log('==============================\n');
    
    console.log(`Overall Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Test Time: ${new Date().toISOString()}`);
    
    // Print step results
    console.log('\nTest Steps:');
    console.log(`1. Authentication: ${result.steps.authentication.success ? '✅ Succeeded' : '❌ Failed'}`);
    console.log(`2. Subscription Creation: ${result.steps.subscription_creation.success ? '✅ Succeeded' : '❌ Failed'}`);
    console.log(`   - Subscription ID: ${result.steps.subscription_creation.subscription_id || 'N/A'}`);
    console.log(`3. Subscription Processing: ${result.steps.subscription_processing.success ? '✅ Succeeded' : '❌ Failed'}`);
    console.log(`4. Backend Notifications: ${result.steps.backend_notifications.success ? '✅ Succeeded' : '❌ Failed'}`);
    console.log(`   - Total Notifications: ${result.steps.backend_notifications.count}`);
    console.log(`   - Relevant Notifications: ${result.steps.backend_notifications.relevant_count}`);
    console.log(`5. Worker Debug Endpoint: ${result.steps.worker_debug.success ? '✅ Succeeded' : '❌ Failed'}`);
    console.log(`   - Notifications in Worker: ${result.steps.worker_debug.count}`);
    
    console.log('\nSummary:');
    console.log(result.test_summary);
    
    // Display outputs location
    console.log('\nDetailed test outputs saved to:');
    console.log(path.join(__dirname, 'outputs', 'integration'));
    
    return result;
  } catch (err) {
    console.error('Test failed with error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Run if executed directly
if (require.main === module) {
  runTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
} else {
  module.exports = runTest;
}