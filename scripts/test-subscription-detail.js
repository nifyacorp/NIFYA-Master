/**
 * Test script to check subscription detail endpoint
 * Usage: node test-subscription-detail.js <subscriptionId>
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Read user ID from file if available
let userId;
try {
  userId = fs.readFileSync(path.join(process.cwd(), 'scripts', 'user_id.txt'), 'utf-8').trim();
  console.log(`Using user ID from file: ${userId}`);
} catch (error) {
  console.log('No user ID file found, will login to get a new one');
}

// Helper for login
async function login() {
  console.log('Logging in to get authentication token...');
  
  const loginResponse = await fetch('https://authentication-service-415554190254.us-central1.run.app/api/auth/login/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginResponse.json();
  
  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  
  console.log('Login successful');
  userId = loginData.data.user.id;
  
  // Save user ID to file for future use
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'user_id.txt'), userId);
  
  return {
    token: loginData.data.token,
    userId
  };
}

// Get subscription details
async function getSubscriptionDetail(id, auth) {
  console.log(`Fetching subscription detail for ID: ${id}`);
  
  const response = await fetch(`https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// List all subscriptions
async function listSubscriptions(auth) {
  console.log('Fetching all subscriptions');
  
  const response = await fetch('https://backend-415554190254.us-central1.run.app/api/v1/subscriptions', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Get subscription with force parameter
async function getSubscriptionWithForce(id, auth) {
  console.log(`Fetching subscription detail for ID: ${id} with force=true`);
  
  const response = await fetch(`https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}?force=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Main function
async function main() {
  const subscriptionId = process.argv[2];
  
  if (!subscriptionId) {
    console.error('Please provide a subscription ID as an argument');
    process.exit(1);
  }
  
  try {
    // Login to get token
    const auth = await login();
    
    // First, get all subscriptions to verify if the ID exists in the backend
    const listResult = await listSubscriptions(auth);
    console.log('All subscriptions:', JSON.stringify(listResult.data, null, 2));
    
    // Find if the requested subscription ID exists in the list
    let subscriptionExists = false;
    if (listResult.data.subscriptions) {
      subscriptionExists = listResult.data.subscriptions.some(sub => sub.id === subscriptionId);
    }
    
    console.log(`Subscription ${subscriptionId} exists in backend list: ${subscriptionExists}`);
    
    // Try to get the subscription detail
    const detailResult = await getSubscriptionDetail(subscriptionId, auth);
    console.log(`Subscription detail (status ${detailResult.status}):`, JSON.stringify(detailResult.data, null, 2));
    
    // If we get a 404, try with force=true
    if (detailResult.status === 404) {
      console.log('Got 404, trying with force=true parameter');
      const forceResult = await getSubscriptionWithForce(subscriptionId, auth);
      console.log(`Subscription detail with force=true (status ${forceResult.status}):`, JSON.stringify(forceResult.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();