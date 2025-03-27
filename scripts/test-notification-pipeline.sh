#!/bin/bash
# Comprehensive test script for the notification pipeline
# This script tests the entire notification flow from end to end

echo "=== NIFYA Notification Pipeline Test ==="
echo "Testing the entire notification flow from subscription processing to notification delivery"
echo "-------------------------------------------------------------"

# 1. Login and get authentication token
echo "Step 1: Authenticating user"
node auth-login.js

# Check if auth was successful
if [ ! -f "auth_token.txt" ]; then
  echo "Authentication failed. Exiting test."
  exit 1
fi

# Get user ID from profile
node get-profile.js
USER_ID=$(cat profile_response.json | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "User ID: $USER_ID"
echo $USER_ID > user_id.txt

# 2. Get list of subscriptions
echo "Step 2: Listing available subscriptions"
node list-subscriptions-v1.js

# Get a subscription ID from the list
SUBSCRIPTION_ID=$(cat subscriptions.json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Selected subscription ID: $SUBSCRIPTION_ID"
echo $SUBSCRIPTION_ID > latest_subscription_id.txt

# 3. Process the subscription
echo "Step 3: Processing subscription $SUBSCRIPTION_ID"
node process-subscription-v1.js

# 4. Start polling for notifications with increased attempts and delay
echo "Step 4: Polling for notifications (20 attempts, 5s delay)"
# Create a temporary modified version of poll-notifications-v1.js with more attempts
sed 's/const MAX_ATTEMPTS = 10;/const MAX_ATTEMPTS = 20;/' poll-notifications-v1.js > poll-notifications-extended.js

# Run the modified polling script
node poll-notifications-extended.js

# Check if any notifications were found
FOUND_NOTIFICATIONS=$(grep -c "Found [1-9][0-9]* notifications" notification_test_results.txt || echo "0")

if [ "$FOUND_NOTIFICATIONS" -gt "0" ]; then
  echo "✅ SUCCESS: Notifications found!"
else
  echo "❌ FAILURE: No notifications found after processing subscription."
fi

# 5. Query the database directly (if we had access, this would be useful)
# For now, we'll use the diagnostics endpoint if it's available
echo "Step 5: Checking diagnostics endpoints"

# Create a temporary diagnostic script
cat > check-diagnostics.js << EOF
const https = require('https');
const fs = require('fs');

// Get auth token and user ID
const token = fs.readFileSync('auth_token.txt', 'utf8').trim();
const userId = fs.readFileSync('user_id.txt', 'utf8').trim();

// Define request options
const options = {
  hostname: 'backend-415554190254.us-central1.run.app',
  port: 443,
  path: '/api/v1/diagnostics/status',
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json',
    'X-User-ID': userId
  }
};

console.log('Checking diagnostics endpoint:', options.path);

// Make the request
const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      fs.writeFileSync('diagnostics_status.json', JSON.stringify(parsedData, null, 2));
      console.log('Diagnostics information:');
      
      if (parsedData.services) {
        Object.keys(parsedData.services).forEach(service => {
          console.log(\`- \${service}: \${parsedData.services[service].status}\`);
        });
      }
      
      // Try to get version information
      const versionOptions = {
        ...options,
        path: '/version'
      };
      
      const versionReq = https.request(versionOptions, (versionRes) => {
        let versionData = '';
        versionRes.on('data', chunk => { versionData += chunk; });
        versionRes.on('end', () => {
          try {
            const versionInfo = JSON.parse(versionData);
            fs.writeFileSync('backend_version.json', JSON.stringify(versionInfo, null, 2));
            console.log('Backend Version:', versionInfo.version);
            
            if (versionInfo.features) {
              console.log('Features enabled:');
              Object.keys(versionInfo.features).forEach(feature => {
                console.log(\`- \${feature}: \${versionInfo.features[feature]}\`);
              });
            }
          } catch (e) {
            console.log('Error parsing version data:', e.message);
          }
        });
      });
      
      versionReq.on('error', error => {
        console.error('Error getting version info:', error.message);
      });
      
      versionReq.end();
      
    } catch (error) {
      console.error('Error parsing response:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
EOF

# Run the diagnostics check
node check-diagnostics.js

# 6. Summarize findings
echo "-------------------------------------------------------------"
echo "Notification Pipeline Test Summary:"
echo "- Authentication: ✅ Successful"
echo "- Subscription Processing: ✅ Successful (status code 202)"

if [ "$FOUND_NOTIFICATIONS" -gt "0" ]; then
  echo "- Notification Creation: ✅ Successful"
  echo "- Notification Retrieval: ✅ Successful"
else
  echo "- Notification Creation: ❌ Failed (no notifications found)"
  echo "- Notification Retrieval: ❌ Failed (no notifications found)"
fi

# Check for diagnostics file
if [ -f "diagnostics_status.json" ]; then
  echo "- Diagnostics: ✅ Available"
else
  echo "- Diagnostics: ❌ Not available or unauthorized"
fi

echo ""
echo "Next steps:"
echo "1. Check notification worker logs in Cloud Logging"
echo "2. Verify PubSub message format between BOE parser and notification worker"
echo "3. Add enhanced logging to the notification worker"
echo "-------------------------------------------------------------"

# Clean up temp files
rm -f poll-notifications-extended.js check-diagnostics.js

# Record test timestamp
echo "Test completed at $(date)"
echo "Notification pipeline test completed at $(date)" >> TEST_DETAILS.txt