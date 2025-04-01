/**
 * Test script to verify the improved subscription deletion process
 * 
 * Usage: node test-subscription-deletion.js <subscriptionId> [--force]
 * 
 * This script tests the deletion of a subscription using the improved backend code.
 * It can test both regular deletion and force deletion.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Read stored auth token if available
let storedToken;
try {
  const tokenFile = path.join(process.cwd(), '.auth-token');
  if (fs.existsSync(tokenFile)) {
    storedToken = fs.readFileSync(tokenFile, 'utf-8').trim();
    console.log('Using stored authentication token');
  }
} catch (error) {
  console.log('No stored token found, will login');
}

// Helper for login
async function login() {
  if (storedToken) {
    try {
      // Verify token is still valid
      const profileResponse = await fetch('https://backend-415554190254.us-central1.run.app/api/v1/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      if (profileResponse.ok) {
        console.log('Stored token is valid');
        return { token: storedToken };
      } else {
        console.log('Stored token expired, getting new token');
      }
    } catch (error) {
      console.log('Error verifying token, getting new token');
    }
  }
  
  console.log('Logging in to get authentication token...');
  
  const loginResponse = await fetch('https://authentication-service-415554190254.us-central1.run.app/api/auth/login/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Login failed with status ${loginResponse.status}`);
  }
  
  const loginData = await loginResponse.json();
  
  if (!loginData.data?.token) {
    throw new Error(`Login succeeded but no token returned: ${JSON.stringify(loginData)}`);
  }
  
  console.log('Login successful');
  
  // Store token for future use
  try {
    fs.writeFileSync(path.join(process.cwd(), '.auth-token'), loginData.data.token);
  } catch (error) {
    console.log('Failed to store token:', error.message);
  }
  
  return { token: loginData.data.token };
}

// Get a subscription's details
async function getSubscription(id, auth) {
  console.log(`Fetching subscription ${id}...`);
  
  try {
    const response = await fetch(`https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      }
    });
    
    if (!response.ok) {
      console.log(`Subscription fetch failed with status ${response.status}`);
      return { exists: false, status: response.status };
    }
    
    const data = await response.json();
    console.log('Subscription data:', JSON.stringify(data, null, 2));
    return { exists: true, data };
  } catch (error) {
    console.error('Error fetching subscription:', error.message);
    return { exists: false, error: error.message };
  }
}

// Delete a subscription
async function deleteSubscription(id, auth, force = false) {
  console.log(`Deleting subscription ${id}${force ? ' with force=true' : ''}...`);
  
  const url = force 
    ? `https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}?force=true`
    : `https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`Deletion failed with status ${response.status}`);
      console.log('Error response:', JSON.stringify(data, null, 2));
      return { success: false, status: response.status, data };
    }
    
    console.log(`Deletion returned status ${response.status}`);
    console.log('Deletion response:', JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error('Error during deletion:', error.message);
    return { success: false, error: error.message };
  }
}

// Verify subscription was deleted
async function verifyDeletion(id, auth) {
  console.log(`Verifying subscription ${id} was deleted...`);
  
  try {
    const response = await fetch(`https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      }
    });
    
    if (response.status === 404) {
      console.log('Verification successful: Subscription not found (404)');
      return { deleted: true };
    }
    
    if (!response.ok) {
      console.log(`Verification returned unexpected status ${response.status}`);
      return { deleted: false, status: response.status };
    }
    
    // If we got a successful response, the subscription still exists
    const data = await response.json();
    console.log('Subscription still exists:', JSON.stringify(data, null, 2));
    return { deleted: false, data };
  } catch (error) {
    console.error('Error verifying deletion:', error.message);
    return { error: error.message };
  }
}

// Main function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const subscriptionId = args[0];
  const useForce = args.includes('--force');
  
  if (!subscriptionId) {
    console.error('Please provide a subscription ID as an argument');
    console.error('Usage: node test-subscription-deletion.js <subscriptionId> [--force]');
    process.exit(1);
  }
  
  try {
    // Step 1: Login to get auth token
    console.log('\n===== STEP 1: AUTHENTICATION =====');
    const auth = await login();
    
    // Step 2: Check if the subscription exists
    console.log('\n===== STEP 2: CHECK SUBSCRIPTION EXISTS =====');
    const checkResult = await getSubscription(subscriptionId, auth);
    
    if (!checkResult.exists) {
      console.log(`\nSubscription ${subscriptionId} does not exist or you don't have access to it.`);
      console.log('Proceeding with deletion anyway to test error handling...');
    }
    
    // Step 3: Delete the subscription
    console.log('\n===== STEP 3: DELETE SUBSCRIPTION =====');
    const deleteResult = await deleteSubscription(subscriptionId, auth, useForce);
    
    if (!deleteResult.success) {
      console.log(`\nFailed to delete subscription ${subscriptionId}.`);
      if (useForce) {
        console.log('This failed even with force=true, which indicates a server-side issue.');
      } else {
        console.log('Try again with --force flag to bypass permission checks.');
      }
      process.exit(1);
    }
    
    // Step 4: Verify the subscription was deleted
    console.log('\n===== STEP 4: VERIFY DELETION =====');
    const verifyResult = await verifyDeletion(subscriptionId, auth);
    
    if (verifyResult.deleted) {
      console.log(`\nSuccess! Subscription ${subscriptionId} was deleted successfully.`);
    } else if (verifyResult.error) {
      console.log(`\nUnclear result: Error during verification: ${verifyResult.error}`);
    } else {
      console.log(`\nWarning: Subscription ${subscriptionId} appears to still exist after deletion!`);
      console.log('This indicates the deletion may have failed despite reporting success.');
    }
    
    // Step 5: Test frontend API response
    console.log('\n===== STEP 5: FRONTEND COMPATIBILITY TEST =====');
    console.log('Testing if the API response is compatible with frontend expectations:');
    
    if (deleteResult.data?.status === 'success') {
      console.log('✅ Response has status: "success"');
    } else {
      console.log('❌ Response missing status: "success"');
    }
    
    if (deleteResult.data?.message && typeof deleteResult.data.message === 'string') {
      console.log('✅ Response has message string');
    } else {
      console.log('❌ Response missing message string');
    }
    
    if (deleteResult.data?.details?.id === subscriptionId) {
      console.log('✅ Response details includes correct subscription ID');
    } else {
      console.log('❌ Response details missing subscription ID');
    }
    
    if (deleteResult.data?.details?.hasOwnProperty('alreadyRemoved')) {
      console.log('✅ Response includes alreadyRemoved flag');
    } else {
      console.log('❌ Response missing alreadyRemoved flag');
    }
    
    console.log('\n===== TEST COMPLETE =====');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();