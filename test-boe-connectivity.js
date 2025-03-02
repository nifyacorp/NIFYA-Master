/**
 * BOE Parser Connectivity Test
 * 
 * This script tests the connectivity between the subscription worker and the BOE parser service.
 * It validates environment configuration and attempts a basic request to ensure the services can communicate.
 * 
 * Usage:
 * 1. Place this file in the subscription-worker directory
 * 2. Run with: node test-boe-connectivity.js
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const BOE_API_URL = process.env.BOE_API_URL || 'https://boe-parser-415554190254.us-central1.run.app';
const BOE_API_KEY = process.env.BOE_API_KEY || '';

// Display configuration
console.log('\n=== BOE Parser Connectivity Test ===\n');
console.log('Configuration:');
console.log(`BOE_API_URL: ${BOE_API_URL}`);
console.log(`BOE_API_KEY: ${BOE_API_KEY ? '✓ Set' : '✗ Not Set'}`);
console.log('\n');

// Create an axios client with the same configuration as the BOEProcessor
const client = axios.create({
  baseURL: BOE_API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    ...(BOE_API_KEY && { 'Authorization': `Bearer ${BOE_API_KEY}` })
  }
});

// Helper function to print status messages
function printStatus(message, success = true) {
  const icon = success ? '✓' : '✗';
  const color = success ? '\x1b[32m' : '\x1b[31m'; // Green or Red
  console.log(`${color}${icon} ${message}\x1b[0m`);
}

// Step 1: Check if the BOE parser service is reachable
async function testHealth() {
  console.log('Step 1: Testing BOE parser health endpoint...');
  
  try {
    const response = await client.get('/health');
    printStatus(`Health check successful: Status ${response.status}`, true);
    return true;
  } catch (error) {
    printStatus('Health check failed', false);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('  No response received. Service might be down or unreachable.');
    } else {
      console.log(`  Error: ${error.message}`);
    }
    return false;
  }
}

// Step 2: Test a basic analysis request
async function testAnalyzeText() {
  console.log('\nStep 2: Testing BOE parser analyze-text endpoint...');
  
  const testData = {
    prompts: ['Información general del BOE'],
    user_id: 'test-user',
    subscription_id: 'test-subscription'
  };
  
  try {
    const response = await client.post('/analyze-text', testData);
    printStatus('Analysis request successful', true);
    console.log(`  Status: ${response.status}`);
    console.log(`  Response contains: ${Object.keys(response.data).join(', ')}`);
    
    // Check if the response has the expected structure
    if (response.data.entries && Array.isArray(response.data.entries)) {
      printStatus(`Response contains ${response.data.entries.length} entries`, true);
    } else {
      printStatus('Response does not contain entries array', false);
    }
    
    return true;
  } catch (error) {
    printStatus('Analysis request failed', false);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('  No response received. Service might be down or unreachable.');
    } else {
      console.log(`  Error: ${error.message}`);
    }
    return false;
  }
}

// Main test function
async function runTests() {
  try {
    const healthCheck = await testHealth();
    
    if (healthCheck) {
      await testAnalyzeText();
    }
    
    console.log('\n=== Test Summary ===');
    console.log('If all tests passed, the subscription worker should be able to communicate with the BOE parser service.');
    console.log('If any tests failed, check your network configuration and the BOE parser service status.');
    console.log('\nRecommended actions if tests failed:');
    console.log('1. Verify the BOE parser service is running at the correct URL');
    console.log('2. Check for any network/firewall issues');
    console.log('3. Verify API keys if authentication is required');
  } catch (error) {
    console.error('\nUnexpected error during testing:', error.message);
  }
}

// Run the tests
runTests().catch(console.error); 