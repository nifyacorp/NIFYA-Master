const https = require('https');
const fs = require('fs');

// Create or clear the results file
fs.writeFileSync('auth_endpoints_results.md', '# Authentication Service Endpoint Tests\n\n');

// Function to append to the results file
function appendToResults(text) {
  fs.appendFileSync('auth_endpoints_results.md', text + '\n');
}

// Function to make an HTTP request
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          // Try to parse as JSON
          let parsedData = null;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = { raw: data.substring(0, 200) + (data.length > 200 ? '...' : '') };
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Get API explorer data to find all endpoints
async function getEndpoints() {
  const options = {
    hostname: 'authentication-service-415554190254.us-central1.run.app',
    port: 443,
    path: '/api/explorer',
    method: 'GET'
  };
  
  console.log('Fetching API explorer data...');
  const response = await makeRequest(options);
  
  if (response.statusCode !== 200) {
    throw new Error(`Failed to get API explorer data: ${response.statusCode}`);
  }
  
  return response.data.endpoints;
}

// Test all endpoints
async function testAllEndpoints() {
  try {
    const endpoints = await getEndpoints();
    console.log(`Found ${endpoints.length} endpoints to test`);
    
    appendToResults(`## Endpoints Found (${endpoints.length})\n`);
    for (const endpoint of endpoints) {
      appendToResults(`- \`${endpoint.methods.join(', ')} ${endpoint.path}\`: ${endpoint.description}`);
    }
    appendToResults('\n## Test Results\n');
    
    // Get auth token if exists (for protected endpoints)
    let token = null;
    if (fs.existsSync('auth_token.txt')) {
      token = fs.readFileSync('auth_token.txt', 'utf8').trim();
      console.log('Using existing auth token for protected endpoints');
    }
    
    // Test each endpoint
    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint.methods[0]} ${endpoint.path}...`);
      appendToResults(`### ${endpoint.methods[0]} ${endpoint.path}\n`);
      appendToResults(`**Description:** ${endpoint.description}\n`);
      
      let response = null;
      let error = null;
      const options = {
        hostname: 'authentication-service-415554190254.us-central1.run.app',
        port: 443,
        path: endpoint.path,
        method: endpoint.methods[0],
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Add auth token for endpoints that likely need it
      if (token && endpoint.path !== '/api/auth/login' && endpoint.path !== '/api/auth/signup') {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add body data for endpoints that need it
      let body = null;
      if (endpoint.path === '/api/auth/login') {
        body = JSON.stringify({
          email: "ratonxi@gmail.com",
          password: "nifyaCorp12!"
        });
        options.headers['Content-Length'] = body.length;
      }
      
      try {
        response = await makeRequest(options, body);
      } catch (err) {
        error = err;
      }
      
      if (error) {
        appendToResults(`**Result:** ❌ ERROR - ${error.message}\n`);
      } else {
        const statusIcon = response.statusCode >= 200 && response.statusCode < 300 ? '✅' : '❌';
        appendToResults(`**Status:** ${statusIcon} ${response.statusCode}\n`);
        appendToResults(`**Response:**\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\`\n`);
      }
      
      // Add a bit of delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('All endpoint tests completed!');
    console.log('Results saved to auth_endpoints_results.md');
  } catch (error) {
    console.error('Error testing endpoints:', error);
    appendToResults(`## Error\n\n${error.message}\n`);
  }
}

// Run the tests
testAllEndpoints();