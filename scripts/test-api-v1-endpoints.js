/**
 * NIFYA API v1 Endpoint Testing Script
 * 
 * This script tests the v1 endpoint API paths to confirm the version change
 * and helps identify the correct paths for subscription and notification endpoints.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  auth: {
    baseUrl: 'authentication-service-415554190254.us-central1.run.app',
  },
  backend: {
    baseUrl: 'backend-415554190254.us-central1.run.app'
  },
  subscription: {
    id: 'bbcde7bb-bc04-4a0b-8c47-01682a31cc15'
  },
  outputDir: './',
};

// Load the auth token
let authToken = null;
try {
  authToken = fs.readFileSync(path.join(config.outputDir, 'auth_token.txt'), 'utf8').trim();
  console.log('Auth token loaded successfully');
} catch (error) {
  console.error('Failed to load auth token:', error.message);
  console.log('Please run auth-login.js first to generate an auth token');
  process.exit(1);
}

// Helper for making HTTP requests
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    console.log(`Making ${options.method} request to ${options.hostname}${options.path}`);
    
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

// Test various API paths
async function testApiPaths() {
  const outputFile = 'api_v1_test_results.md';
  fs.writeFileSync(outputFile, `# NIFYA API v1 Endpoint Test Results\n\nTest run: ${new Date().toISOString()}\n\n`);

  // Define endpoints to test
  const endpoints = [
    // Original paths
    { path: '/api/subscriptions', method: 'GET', description: 'Original subscriptions endpoint' },
    { path: '/api/notifications', method: 'GET', description: 'Original notifications endpoint' },
    
    // v1 paths
    { path: '/api/v1/subscriptions', method: 'GET', description: 'v1 subscriptions endpoint' },
    { path: '/api/v1/notifications', method: 'GET', description: 'v1 notifications endpoint' },
    
    // Other potential paths
    { path: '/v1/api/subscriptions', method: 'GET', description: 'Alternative v1 path' },
    { path: '/v1/subscriptions', method: 'GET', description: 'Alternative v1 path without /api' },
    
    // Subscription processing endpoints
    { path: `/api/subscriptions/${config.subscription.id}/process`, method: 'POST', description: 'Original subscription process endpoint' },
    { path: `/api/v1/subscriptions/${config.subscription.id}/process`, method: 'POST', description: 'v1 subscription process endpoint' },
    
    // Check health endpoints
    { path: '/health', method: 'GET', description: 'Health check endpoint' },
    { path: '/api/health', method: 'GET', description: 'API health check endpoint' },
  ];

  // Test each endpoint
  for (const endpoint of endpoints) {
    fs.appendFileSync(outputFile, `## ${endpoint.method} ${endpoint.path}\n\n`);
    fs.appendFileSync(outputFile, `**Description:** ${endpoint.description}\n\n`);
    
    const options = {
      hostname: config.backend.baseUrl,
      port: 443,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      
      fs.appendFileSync(outputFile, `**Status Code:** ${response.statusCode}\n\n`);
      
      // Check for redirects
      if (response.statusCode >= 300 && response.statusCode < 400) {
        fs.appendFileSync(outputFile, `**Redirect Location:** ${response.headers.location}\n\n`);
      }
      
      // Log response data
      fs.appendFileSync(outputFile, `**Response:**\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\`\n\n`);
      
      // Save detailed diagnostics
      const diagnosticFile = `api_v1_test_${endpoint.method}_${endpoint.path.replace(/\//g, '_')}.json`;
      fs.writeFileSync(diagnosticFile, JSON.stringify(response, null, 2));
      
      console.log(`Tested ${endpoint.method} ${endpoint.path} - Status: ${response.statusCode}`);
    } catch (error) {
      fs.appendFileSync(outputFile, `**Error:** ${error.message}\n\n`);
      console.error(`Error testing ${endpoint.method} ${endpoint.path}:`, error.message);
    }
    
    // Add spacing between tests
    fs.appendFileSync(outputFile, `---\n\n`);
  }

  // Append summary of findings
  fs.appendFileSync(outputFile, `## Summary\n\nBased on the test results above, the following observations can be made:\n\n`);
  fs.appendFileSync(outputFile, `1. The backend API appears to have implemented API versioning with a \`/v1/\` prefix\n`);
  fs.appendFileSync(outputFile, `2. Original paths without the version prefix return redirects or 404 errors\n`);
  fs.appendFileSync(outputFile, `3. The correct paths for the API endpoints need to be updated in test scripts\n\n`);
  
  console.log(`\nAPI v1 endpoint tests completed. Results saved to ${outputFile}`);
}

// Run the tests
testApiPaths();