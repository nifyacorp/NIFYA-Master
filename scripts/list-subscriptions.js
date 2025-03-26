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

// Define request options for listing subscriptions
const options = {
  hostname: 'backend-415554190254.us-central1.run.app',
  port: 443,
  path: '/api/subscriptions',  // Based on backend structure
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('Fetching user subscriptions...');
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
    fs.writeFileSync('subscriptions_response_raw.json', data);
    console.log('Raw response saved to subscriptions_response_raw.json');
    
    try {
      // Parse the JSON response
      const parsedData = JSON.parse(data);
      
      // Save formatted JSON for easier reading
      fs.writeFileSync('subscriptions_response.json', JSON.stringify(parsedData, null, 2));
      console.log('Formatted response saved to subscriptions_response.json');
      
      // Extract and log subscriptions if present
      const subscriptions = parsedData.data?.subscriptions || parsedData.subscriptions || [];
      
      if (subscriptions.length > 0) {
        console.log(`Found ${subscriptions.length} subscriptions:`);
        subscriptions.forEach((sub, index) => {
          console.log(`\nSubscription ${index + 1}:`);
          console.log('- ID:', sub.id);
          console.log('- Type:', sub.type);
          console.log('- Status:', sub.status || 'Unknown');
          console.log('- Created:', sub.created_at || 'Unknown');
        });
        
        // Add results to TEST_DETAILS.txt
        const detailsEntry = `
SUBSCRIPTIONS TEST RESULTS (${new Date().toISOString()})
==========================================
Status: SUCCESS
Subscription Count: ${subscriptions.length}
Subscription IDs: ${subscriptions.map(s => s.id).join(', ')}
Response Status Code: ${res.statusCode}
`;
        fs.appendFileSync('TEST_DETAILS.txt', detailsEntry);
        console.log('Test results appended to TEST_DETAILS.txt');
      } else {
        console.log('No subscriptions found for this user.');
        fs.appendFileSync('TEST_DETAILS.txt', `
SUBSCRIPTIONS TEST RESULTS (${new Date().toISOString()})
==========================================
Status: SUCCESS (No Subscriptions)
Subscription Count: 0
Response Status Code: ${res.statusCode}
`);
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      fs.appendFileSync('TEST_DETAILS.txt', `
SUBSCRIPTIONS TEST RESULTS (${new Date().toISOString()})
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
SUBSCRIPTIONS TEST RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Request failed
Error: ${error.message}
`);
});

// Send the request
req.end();

console.log('Subscriptions request sent, waiting for response...');