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
  console.log('No subscription ID found. Will poll for all notifications.');
}

// Polling function
async function pollForNotifications(attempt, maxAttempts, intervalSeconds) {
  console.log(`Polling attempt ${attempt} of ${maxAttempts}...`);
  
  return new Promise((resolve, reject) => {
    // Create notification URL with optional subscription filter
    let path = '/api/notifications';
    if (subscriptionId) {
      path += `?subscriptionId=${subscriptionId}`;
    }
    
    // Define request options for getting notifications
    const options = {
      hostname: 'backend-415554190254.us-central1.run.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Request URL:', `https://${options.hostname}${options.path}`);
    
    // Create the request
    const req = https.request(options, (res) => {
      console.log('Status Code:', res.statusCode);
      
      let data = '';
      
      // Collect data as it comes in
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process the complete response
      res.on('end', () => {
        // Save raw response to file
        const filename = `notifications_attempt_${attempt}.json`;
        fs.writeFileSync(filename, data);
        console.log(`Raw response saved to ${filename}`);
        
        try {
          // Parse the JSON response
          const parsedData = JSON.parse(data);
          
          // Extract notifications
          const notifications = parsedData.data?.notifications || parsedData.notifications || [];
          
          console.log(`Found ${notifications.length} notifications.`);
          
          // If we found notifications, write details
          if (notifications.length > 0) {
            fs.writeFileSync('latest_notifications.json', JSON.stringify(parsedData, null, 2));
            console.log('Latest notifications saved to latest_notifications.json');
            
            // Add results to TEST_DETAILS.txt
            const detailsEntry = `
NOTIFICATION POLLING RESULTS (${new Date().toISOString()})
==========================================
Status: SUCCESS
Notifications Found: ${notifications.length}
Attempt: ${attempt}/${maxAttempts}
Subscription ID: ${subscriptionId || 'All subscriptions'}
Response Status Code: ${res.statusCode}
`;
            fs.appendFileSync('TEST_DETAILS.txt', detailsEntry);
          }
          
          resolve({
            success: true,
            count: notifications.length,
            notifications
          });
        } catch (error) {
          console.error('Error parsing response:', error.message);
          fs.appendFileSync('TEST_DETAILS.txt', `
NOTIFICATION POLLING RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Failed to parse response
Error: ${error.message}
Attempt: ${attempt}/${maxAttempts}
Response Status Code: ${res.statusCode}
`);
          resolve({
            success: false,
            error: error.message,
            count: 0
          });
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      console.error('Request error:', error.message);
      fs.appendFileSync('TEST_DETAILS.txt', `
NOTIFICATION POLLING RESULTS (${new Date().toISOString()})
==========================================
Status: ERROR
Reason: Request failed
Error: ${error.message}
Attempt: ${attempt}/${maxAttempts}
`);
      resolve({
        success: false,
        error: error.message,
        count: 0
      });
    });
    
    // Send the request
    req.end();
  });
}

// Main polling logic
async function runPolling() {
  const MAX_ATTEMPTS = 10;
  const POLL_INTERVAL_SECONDS = 5;
  let foundNotifications = false;
  
  console.log(`Will poll for notifications ${MAX_ATTEMPTS} times with ${POLL_INTERVAL_SECONDS} second intervals`);
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await pollForNotifications(attempt, MAX_ATTEMPTS, POLL_INTERVAL_SECONDS);
    
    if (result.success && result.count > 0) {
      console.log(`Success! Found ${result.count} notifications on attempt ${attempt}`);
      
      // Log details of notifications
      result.notifications.forEach((notification, i) => {
        console.log(`\nNotification ${i + 1}:`);
        console.log('- ID:', notification.id);
        console.log('- Title:', notification.title);
        console.log('- Created:', notification.created_at);
        console.log('- Read:', notification.read ? 'Yes' : 'No');
      });
      
      foundNotifications = true;
      break;
    }
    
    if (attempt < MAX_ATTEMPTS) {
      console.log(`No notifications found. Waiting ${POLL_INTERVAL_SECONDS} seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_SECONDS * 1000));
    }
  }
  
  if (!foundNotifications) {
    console.log('Max polling attempts reached without finding notifications.');
    fs.appendFileSync('TEST_DETAILS.txt', `
NOTIFICATION POLLING FINAL RESULTS (${new Date().toISOString()})
==========================================
Status: NO_NOTIFICATIONS
Reason: Max polling attempts reached without finding notifications
Max Attempts: ${MAX_ATTEMPTS}
Subscription ID: ${subscriptionId || 'All subscriptions'}
`);
  }
}

// Run the polling
runPolling().catch(error => {
  console.error('Polling error:', error);
});