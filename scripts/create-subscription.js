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

// Subscription data to create
const subscriptionData = JSON.stringify({
  type: "boe",
  name: "Test BOE Subscription",
  prompts: ["quiero ser funcionario", "oposiciones administrativo"],
  active: true
});

// Define request options for creating a subscription
const options = {
  hostname: 'backend-415554190254.us-central1.run.app',
  port: 443,
  path: '/api/subscriptions',  // Based on backend structure
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': subscriptionData.length
  }
};

console.log('Creating a new BOE subscription...');
console.log('Request URL:', `https://${options.hostname}${options.path}`);
console.log('Request payload:', subscriptionData);

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
    fs.writeFileSync('create_subscription_response_raw.json', data);
    console.log('Raw response saved to create_subscription_response_raw.json');
    
    try {
      // Parse the JSON response
      const parsedData = JSON.parse(data);
      
      // Save formatted JSON for easier reading
      fs.writeFileSync('create_subscription_response.json', JSON.stringify(parsedData, null, 2));
      console.log('Formatted response saved to create_subscription_response.json');
      
      // Extract the subscription info
      const subscription = parsedData.data?.subscription || parsedData.subscription;
      
      if (subscription && subscription.id) {
        console.log('\nSubscription created successfully:');
        console.log('- ID:', subscription.id);
        console.log('- Type:', subscription.type);
        console.log('- Status:', subscription.status || 'Unknown');
        
        // Save subscription ID for other scripts
        fs.writeFileSync('latest_subscription_id.txt', subscription.id);
        console.log('Subscription ID saved to latest_subscription_id.txt');
        
        // Add results to TEST_DETAILS.txt
        const detailsEntry = `
CREATE SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
==========================================
Status: SUCCESS
Subscription ID: ${subscription.id}
Subscription Type: ${subscription.type}
Subscription Status: ${subscription.status || 'Unknown'}
Response Status Code: ${res.statusCode}
`;
        fs.appendFileSync('TEST_DETAILS.txt', detailsEntry);
        console.log('Test results appended to TEST_DETAILS.txt');
      } else {
        console.log('Subscription creation failed: No subscription data in response');
        fs.appendFileSync('TEST_DETAILS.txt', `
CREATE SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
==========================================
Status: FAILED
Reason: No subscription data in response
Response Status Code: ${res.statusCode}
Response: ${JSON.stringify(parsedData, null, 2)}
`);
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      fs.appendFileSync('TEST_DETAILS.txt', `
CREATE SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
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
CREATE SUBSCRIPTION TEST RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Request failed
Error: ${error.message}
`);
});

// Send the subscription data
req.write(subscriptionData);
req.end();

console.log('Create subscription request sent, waiting for response...');