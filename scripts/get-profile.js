const https = require('https');
const fs = require('fs');

// Check if auth_token.txt exists
if (!fs.existsSync('auth_token.txt')) {
  console.error('Auth token not found. Please run auth-login.js first.');
  process.exit(1);
}

// Read the token from file
const token = fs.readFileSync('auth_token.txt', 'utf8').trim();

if (!token) {
  console.error('Auth token is empty. Please authenticate first.');
  process.exit(1);
}

// Define request options for user profile
const options = {
  hostname: 'authentication-service-415554190254.us-central1.run.app',
  port: 443,
  path: '/api/auth/me',  // Route from API explorer
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('Fetching user profile...');
console.log('Request URL:', `https://${options.hostname}${options.path}`);

// Create the request
const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  
  // Collect data as it comes in
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process the complete response
  res.on('end', () => {
    console.log('Response received');
    
    // Save raw response to file
    fs.writeFileSync('profile_response_raw.json', data);
    console.log('Raw response saved to profile_response_raw.json');
    
    try {
      // Parse the JSON response
      const parsedData = JSON.parse(data);
      
      // Save formatted JSON for easier reading
      fs.writeFileSync('profile_response.json', JSON.stringify(parsedData, null, 2));
      console.log('Formatted response saved to profile_response.json');
      
      // Extract and log user info if present
      if (parsedData.user) {
        console.log('User Profile Retrieved:');
        console.log('- ID:', parsedData.user.id);
        console.log('- Email:', parsedData.user.email);
        console.log('- Name:', parsedData.user.name || 'Not set');
        
        // Add results to TEST_DETAILS.txt
        const detailsEntry = `
PROFILE TEST RESULTS (${new Date().toISOString()})
==========================================
Status: SUCCESS
User ID: ${parsedData.user.id || 'Not provided'}
User Email: ${parsedData.user.email || 'Not provided'}
User Name: ${parsedData.user.name || 'Not provided'}
Response Status Code: ${res.statusCode}
`;
        fs.appendFileSync('TEST_DETAILS.txt', detailsEntry);
        console.log('Test results appended to TEST_DETAILS.txt');
      } else {
        console.log('Profile retrieval failed: No user data in response');
        fs.appendFileSync('TEST_DETAILS.txt', `
PROFILE TEST RESULTS (${new Date().toISOString()})
==========================================
Status: FAILED
Reason: No user data in response
Response Status Code: ${res.statusCode}
Response: ${JSON.stringify(parsedData, null, 2)}
`);
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      fs.appendFileSync('TEST_DETAILS.txt', `
PROFILE TEST RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Failed to parse response
Error: ${error.message}
Response Status Code: ${res.statusCode}
Raw Response: ${data}
`);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Request error:', error.message);
  fs.appendFileSync('TEST_DETAILS.txt', `
PROFILE TEST RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Request failed
Error: ${error.message}
`);
});

// Send the request
req.end();

console.log('Profile request sent, waiting for response...');