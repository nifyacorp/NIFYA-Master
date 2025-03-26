const { execSync } = require('child_process');
const fs = require('fs');

// Initialize TEST_DETAILS.txt with a header
const testHeader = `
NIFYA BACKEND TEST SUITE
========================
Started: ${new Date().toISOString()}
`;
fs.writeFileSync('TEST_DETAILS.txt', testHeader);

console.log('======================================================');
console.log('NIFYA Backend Test Suite');
console.log('======================================================');

// Helper function to run a script with proper error handling
function runScript(scriptName, description) {
  console.log(`\n[${new Date().toISOString()}] Running: ${description}`);
  console.log('------------------------------------------------------');
  
  try {
    execSync(`node ${scriptName}`, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed with error:`, error.message);
    fs.appendFileSync('TEST_DETAILS.txt', `
${description.toUpperCase()} FAILURE
==========================================
Time: ${new Date().toISOString()}
Error: ${error.message}
`);
    return false;
  }
}

// Run each test in sequence
const steps = [
  { script: 'auth-login.js', description: 'Authentication', required: true },
  { script: 'get-profile.js', description: 'User Profile Retrieval', required: false },
  { script: 'list-subscriptions.js', description: 'Subscription Listing', required: false },
  { script: 'create-subscription.js', description: 'Subscription Creation', required: true },
  { script: 'process-subscription.js', description: 'Subscription Processing', required: false },
  { script: 'poll-notifications.js', description: 'Notification Polling', required: false }
];

// Track test results
const results = {
  total: steps.length,
  success: 0,
  failed: 0,
  skipped: 0
};

// Run all steps
let continueTests = true;
for (const step of steps) {
  if (!continueTests && step.required) {
    console.log(`\n⏩ Skipping ${step.description} (previous required step failed)`);
    results.skipped++;
    continue;
  }
  
  const success = runScript(step.script, step.description);
  
  if (success) {
    results.success++;
  } else {
    results.failed++;
    if (step.required) {
      continueTests = false;
    }
  }
  
  // Add a short delay between tests
  if (step !== steps[steps.length - 1]) {
    console.log('Waiting 2 seconds before next test...');
    execSync('sleep 2');
  }
}

// Add summary to TEST_DETAILS.txt
const summary = `
TEST SUMMARY
==========================================
Total Tests: ${results.total}
Successful: ${results.success}
Failed: ${results.failed}
Skipped: ${results.skipped}
Completed: ${new Date().toISOString()}
`;

fs.appendFileSync('TEST_DETAILS.txt', summary);

// Display final results
console.log('\n======================================================');
console.log('Test Suite Completed');
console.log('======================================================');
console.log(`Total Tests: ${results.total}`);
console.log(`Successful: ${results.success}`);
console.log(`Failed: ${results.failed}`);
console.log(`Skipped: ${results.skipped}`);
console.log('\nResults have been saved to TEST_DETAILS.txt');
console.log('======================================================');