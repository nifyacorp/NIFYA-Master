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

// Check for subscription ID
let subscriptionId = null;
if (fs.existsSync('latest_subscription_id.txt')) {
  subscriptionId = fs.readFileSync('latest_subscription_id.txt', 'utf8').trim();
  console.log('Using subscription ID:', subscriptionId);
} else {
  console.error('No subscription ID found. Please create a subscription first.');
  process.exit(1);
}

// Define request options for processing a subscription
const options = {
  hostname: 'backend-415554190254.us-central1.run.app',
  port: 443,
  path: `/api/subscriptions/${subscriptionId}/process`,  // Based on subscriptions.js routes
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('Manually processing subscription...');
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
    fs.writeFileSync('process_subscription_response_raw.json', data);
    console.log('Raw response saved to process_subscription_response_raw.json');
    
    try {
      // Parse the JSON response
      const parsedData = JSON.parse(data);
      
      // Save formatted JSON for easier reading
      fs.writeFileSync('process_subscription_response.json', JSON.stringify(parsedData, null, 2));
      console.log('Formatted response saved to process_subscription_response.json');
      
      // Check if processing was successful
      if (parsedData.status === 'success' || res.statusCode >= 200 && res.statusCode < 300) {
        console.log('\nSubscription processed successfully:');
        console.log('- ID:', subscriptionId);
        console.log('- Status:', parsedData.subscription?.status || 'Processing');
        
        // Add results to TEST_DETAILS.txt
        const detailsEntry = `
PROCESS SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
==========================================
Status: SUCCESS
Subscription ID: ${subscriptionId}
Processing Status: ${parsedData.subscription?.status || 'Processing'}
Response Status Code: ${res.statusCode}
`;
        fs.appendFileSync('TEST_DETAILS.txt', detailsEntry);
        console.log('Test results appended to TEST_DETAILS.txt');
      } else {
        console.log('Subscription processing failed:');
        console.log('- Error:', parsedData.error || 'Unknown error');
        
        fs.appendFileSync('TEST_DETAILS.txt', `
PROCESS SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
==========================================
Status: FAILED
Reason: ${parsedData.error || 'Unknown error'}
Subscription ID: ${subscriptionId}
Response Status Code: ${res.statusCode}
Response: ${JSON.stringify(parsedData, null, 2)}
`);
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      fs.appendFileSync('TEST_DETAILS.txt', `
PROCESS SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Failed to parse response
Error: ${error.message}
Subscription ID: ${subscriptionId}
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
PROCESS SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Request failed
Error: ${error.message}
Subscription ID: ${subscriptionId}
`);
});

// Send the request (empty body for processing)
req.end();

console.log('Process subscription request sent, waiting for response...');