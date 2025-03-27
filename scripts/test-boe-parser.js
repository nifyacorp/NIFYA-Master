/**
 * NIFYA BOE Parser Test Script
 * 
 * This script tests the BOE parser service by sending requests to analyze text
 * and checking the responses. It also tests the notification pipeline integration.
 */

const https = require('https');
const fs = require('fs');
const { makeApiRequest, loadAuthToken } = require('./api-client');

// Configuration
const config = {
  boeParser: {
    baseUrl: 'boe-parser-415554190254.us-central1.run.app'
  },
  outputDir: './',
  defaultPrompts: [
    "dime todas las disposiciones de personal",
    "convocatorias de oposiciones",
    "subvenciones para empresas tecnológicas"
  ],
  testDetailsFile: './TEST_DETAILS.txt'
};

// Helper to append to test details
function appendTestDetails(testName, success, details) {
  const detailsEntry = `
BOE PARSER TEST: ${testName} (${new Date().toISOString()})
==========================================
Status: ${success ? 'SUCCESS' : 'FAILED'}
Details: ${details}
`;
  fs.appendFileSync(config.testDetailsFile, detailsEntry);
}

// Helper for making HTTP requests to BOE Parser
function makeBOERequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        try {
          // Try to parse JSON response
          let parsedData = null;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = { raw: data.substring(0, 200) + (data.length > 200 ? '...' : '') };
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: data
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    
    req.end();
  });
}

// Test health endpoint
async function testHealthEndpoint() {
  console.log('Testing BOE Parser health endpoint...');
  
  try {
    const options = {
      hostname: config.boeParser.baseUrl,
      port: 443,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeBOERequest(options);
    
    console.log(`Status Code: ${response.statusCode}`);
    console.log('Response:', response.data);
    
    const success = response.statusCode === 200 && response.data.status === 'OK';
    
    appendTestDetails('Health Check', success, 
      `Status Code: ${response.statusCode}, Response: ${JSON.stringify(response.data)}`);
      
    return {
      success,
      response: response.data
    };
  } catch (error) {
    console.error('Health check failed:', error.message);
    appendTestDetails('Health Check', false, `Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test analyze endpoint with auth token
async function testAnalyzeEndpoint(prompts = config.defaultPrompts, publishToPubSub = false) {
  console.log('Testing BOE Parser analyze endpoint...');
  
  try {
    // Get auth token
    const token = loadAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please run auth-login.js first.');
    }
    
    const options = {
      hostname: config.boeParser.baseUrl,
      port: 443,
      path: '/analyze-text',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const body = {
      texts: prompts,
      metadata: {
        user_id: "65c6074d-dbc4-4091-8e45-b6aecffd9ab9",
        subscription_id: "bbcde7bb-bc04-4a0b-8c47-01682a31cc15"
      },
      limit: 5,
      date: new Date().toISOString().split('T')[0]
    };
    
    console.log('Request body:', body);
    
    const response = await makeBOERequest(options, body);
    
    console.log(`Status Code: ${response.statusCode}`);
    
    // Save the response to a file
    const outputFile = `boe_analyzer_response_${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
    console.log(`Response saved to ${outputFile}`);
    
    const success = response.statusCode === 200 && response.data.results;
    
    appendTestDetails('Analyze Text', success, 
      `Status Code: ${response.statusCode}, Prompts: ${prompts.length}, Output File: ${outputFile}`);
      
    return {
      success,
      response: response.data,
      outputFile
    };
  } catch (error) {
    console.error('Analyze endpoint test failed:', error.message);
    appendTestDetails('Analyze Text', false, `Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test the diagnostic endpoint
async function testDiagnosticEndpoint(prompts = config.defaultPrompts, publishToPubSub = false) {
  console.log('Testing BOE Parser diagnostic endpoint...');
  
  try {
    // Get auth token
    const token = loadAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please run auth-login.js first.');
    }
    
    const options = {
      hostname: config.boeParser.baseUrl,
      port: 443,
      path: '/test-analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const body = {
      texts: prompts,
      userId: "65c6074d-dbc4-4091-8e45-b6aecffd9ab9",
      subscriptionId: "bbcde7bb-bc04-4a0b-8c47-01682a31cc15",
      date: new Date().toISOString().split('T')[0],
      publishToPubSub
    };
    
    console.log('Request body:', body);
    
    const response = await makeBOERequest(options, body);
    
    console.log(`Status Code: ${response.statusCode}`);
    
    // Save the response to a file
    const outputFile = `boe_diagnostic_response_${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
    console.log(`Diagnostic response saved to ${outputFile}`);
    
    const success = response.statusCode === 200;
    
    // Check for Gemini failures
    if (success && response.data.errors_count > 0) {
      console.warn('⚠️ Gemini analysis errors detected:');
      response.data.errors.forEach((error, i) => {
        console.warn(`  Error ${i+1}:`, error.error);
      });
    }
    
    // Check if any matches were found
    if (success && response.data.results) {
      let totalMatches = 0;
      response.data.results.forEach(result => {
        if (result.matches && result.matches.length > 0) {
          totalMatches += result.matches.length;
        }
      });
      
      console.log(`Total matches found: ${totalMatches}`);
      
      if (totalMatches === 0) {
        console.warn('⚠️ No matches found in Gemini results. This could indicate that:');
        console.warn('  1. The BOE might not have any content matching the prompts');
        console.warn('  2. Gemini might not be recognizing relevant content');
      }
    }
    
    appendTestDetails('Diagnostic Test', success, 
      `Status Code: ${response.statusCode}, Prompts: ${prompts.length}, `+
      `PubSub: ${publishToPubSub ? 'Yes' : 'No'}, Output File: ${outputFile}`);
      
    return {
      success,
      response: response.data,
      outputFile
    };
  } catch (error) {
    console.error('Diagnostic endpoint test failed:', error.message);
    appendTestDetails('Diagnostic Test', false, `Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log('====== NIFYA BOE PARSER TESTS ======');
  console.log('Starting tests at:', new Date().toISOString());
  console.log('-------------------------------------');
  
  // Test 1: Health check
  console.log('\n1. Testing Health Endpoint:');
  const healthResult = await testHealthEndpoint();
  console.log('Health check result:', healthResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('-------------------------------------');
  
  // Test 2: Analyze endpoint
  console.log('\n2. Testing Analyze Endpoint:');
  const analyzeResult = await testAnalyzeEndpoint();
  console.log('Analyze test result:', analyzeResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('-------------------------------------');
  
  // Test 3: Diagnostic endpoint
  console.log('\n3. Testing Diagnostic Endpoint:');
  const diagnosticResult = await testDiagnosticEndpoint();
  console.log('Diagnostic test result:', diagnosticResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('-------------------------------------');
  
  // Test 4: End-to-end with PubSub
  console.log('\n4. Testing End-to-End with PubSub:');
  const e2eResult = await testDiagnosticEndpoint(['quiero ser funcionario'], true);
  console.log('End-to-End test result:', e2eResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('-------------------------------------');
  
  // Test summary
  console.log('\n====== TEST SUMMARY ======');
  console.log('Health Check:', healthResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Analyze Endpoint:', analyzeResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Diagnostic Endpoint:', diagnosticResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('End-to-End with PubSub:', e2eResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('------------------------');
  
  const allPassed = 
    healthResult.success && 
    analyzeResult.success && 
    diagnosticResult.success && 
    e2eResult.success;
    
  console.log('Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return allPassed;
}

// Run the script if not imported
if (require.main === module) {
  runAllTests()
    .then(success => {
      console.log('Tests completed.');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error during tests:', error);
      process.exit(1);
    });
}

module.exports = {
  testHealthEndpoint,
  testAnalyzeEndpoint,
  testDiagnosticEndpoint,
  runAllTests
};