/**
 * Test script to check if notifications exist and if RLS is working correctly
 */

const https = require('https');
const fs = require('fs');

// Get auth token from file
const token = fs.readFileSync('auth_token.txt', 'utf8').trim();
const userId = fs.readFileSync('user_id.txt', 'utf8').trim();

console.log(`Testing notifications with user ID: ${userId}`);

// First, test the v1 endpoint with proper authorization
function testV1Endpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'backend-415554190254.us-central1.run.app',
      port: 443,
      path: '/api/v1/notifications',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-ID': userId
      }
    };

    console.log('Testing v1 endpoint:', options.path);
    
    const req = https.request(options, (res) => {
      console.log('Status Code:', res.statusCode);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          fs.writeFileSync('v1_notifications_response.json', JSON.stringify(parsedData, null, 2));
          console.log(`V1 endpoint response saved to v1_notifications_response.json`);
          console.log(`Found ${parsedData.notifications?.length || 0} notifications.`);
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing v1 response:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error testing v1 endpoint:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Next, use the diagnostics endpoint to bypass RLS and check if notifications exist in the DB
function testDiagnosticsEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'backend-415554190254.us-central1.run.app',
      port: 443,
      path: `/api/v1/diagnostics/user/${userId}/notifications`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-ID': userId
      }
    };

    console.log('Testing diagnostics endpoint:', options.path);
    
    const req = https.request(options, (res) => {
      console.log('Status Code:', res.statusCode);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          fs.writeFileSync('diagnostics_notifications_response.json', JSON.stringify(parsedData, null, 2));
          console.log(`Diagnostics endpoint response saved to diagnostics_notifications_response.json`);
          console.log(`Found ${parsedData.notifications?.length || 0} notifications in diagnostics.`);
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing diagnostics response:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error testing diagnostics endpoint:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    console.log('=== Starting Notification API Tests ===');
    
    // Extract user ID if not already present
    if (!userId) {
      const profileData = fs.readFileSync('profile_response.json', 'utf8');
      const profile = JSON.parse(profileData);
      fs.writeFileSync('user_id.txt', profile.id || '');
      console.log(`Extracted user ID: ${profile.id}`);
    }
    
    // Test v1 endpoint
    const v1Result = await testV1Endpoint();
    
    // Test diagnostics endpoint
    const diagnosticsResult = await testDiagnosticsEndpoint();
    
    // Compare results
    console.log('\n=== Test Results ===');
    console.log(`V1 API returned ${v1Result.notifications?.length || 0} notifications`);
    console.log(`Diagnostics API returned ${diagnosticsResult.notifications?.length || 0} notifications`);
    
    if (v1Result.notifications?.length === 0 && diagnosticsResult.notifications?.length > 0) {
      console.log('\n⚠️ POSSIBLE RLS ISSUE DETECTED: Notifications exist but are not visible through the API.');
      console.log('This suggests Row-Level Security policies are incorrectly filtering out notifications.');
    } else if (v1Result.notifications?.length === 0 && diagnosticsResult.notifications?.length === 0) {
      console.log('\n⚠️ NO NOTIFICATIONS FOUND: No notifications exist for this user in the database.');
    } else {
      console.log('\n✅ API WORKING CORRECTLY: Notifications are properly returned through the API.');
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();