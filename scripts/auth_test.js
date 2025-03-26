const https = require('https');
const fs = require('fs');

// Authentication details
const authData = JSON.stringify({
  email: "ratonxi@gmail.com",
  password: "nifyaCorp12!"
});

// Define request options
const options = {
  hostname: 'authentication-service-415554190254.us-central1.run.app',
  port: 443,
  path: '/api/auth/login',  // Based on grep results
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': authData.length
  }
};

console.log('Sending authentication request to:', options.hostname + options.path);

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
    fs.writeFileSync('auth_response_raw.json', data);
    console.log('Raw response saved to auth_response_raw.json');
    
    try {
      // Parse the JSON response
      const parsedData = JSON.parse(data);
      
      // Extract and save the token if present
      if (parsedData.token) {
        fs.writeFileSync('auth_token.txt', parsedData.token);
        console.log('Authentication successful! Token saved to auth_token.txt');
        
        // Add results to TEST_DETAILS.txt
        const detailsEntry = `
AUTH TEST RESULTS (${new Date().toISOString()})
==========================================
Status: SUCCESS
Token: ${parsedData.token.substring(0, 10)}...
User ID: ${parsedData.user?.id || 'Not provided'}
User Email: ${parsedData.user?.email || 'Not provided'}
Response Status Code: ${res.statusCode}
`;
        fs.appendFileSync('TEST_DETAILS.txt', detailsEntry);
        console.log('Test results appended to TEST_DETAILS.txt');
      } else {
        console.log('Authentication failed: No token in response');
        fs.appendFileSync('TEST_DETAILS.txt', `
AUTH TEST RESULTS (${new Date().toISOString()})
==========================================
Status: FAILED
Reason: No token in response
Response Status Code: ${res.statusCode}
Response: ${JSON.stringify(parsedData, null, 2)}
`);
      }
      
      // Save formatted JSON for easier reading
      fs.writeFileSync('auth_response.json', JSON.stringify(parsedData, null, 2));
      console.log('Formatted response saved to auth_response.json');
      
    } catch (error) {
      console.error('Error parsing response:', error.message);
      fs.appendFileSync('TEST_DETAILS.txt', `
AUTH TEST RESULTS (${new Date().toISOString()})
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
AUTH TEST RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Request failed
Error: ${error.message}
`);
});

// Send the authentication data
req.write(authData);
req.end();

console.log('Authentication request sent, waiting for response...');