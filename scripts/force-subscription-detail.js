/**
 * Script to test forcing a subscription detail when it's in the deletion blacklist
 * 
 * Usage: node force-subscription-detail.js <subscriptionId>
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

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
  
  return {
    token: loginData.data.token,
    userId: loginData.data.user.id
  };
}

// Get a list of all subscriptions
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

// Get subscription detail with both normal and forced mode
async function testSubscriptionDetail(id, auth) {
  // First try normal request
  console.log(`\n==== Testing regular fetch for subscription ID: ${id} ====`);
  
  try {
    const normalResponse = await fetch(`https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      }
    });
    
    const normalData = await normalResponse.json();
    console.log(`Regular request status: ${normalResponse.status}`);
    
    if (normalResponse.status === 200) {
      console.log('Subscription exists in backend ✅');
      console.log('Subscription data:', JSON.stringify(normalData, null, 2));
    } else {
      console.log('Subscription does not exist in backend ❌');
      console.log('Error response:', JSON.stringify(normalData, null, 2));
    }
  } catch (error) {
    console.error('Error fetching without force:', error.message);
  }
  
  // Now try with force=true
  console.log(`\n==== Testing forced fetch for subscription ID: ${id} ====`);
  
  try {
    const forceResponse = await fetch(`https://backend-415554190254.us-central1.run.app/api/v1/subscriptions/${id}?force=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      }
    });
    
    const forceData = await forceResponse.json();
    console.log(`Force request status: ${forceResponse.status}`);
    
    if (forceResponse.status === 200) {
      console.log('Subscription exists with force parameter ✅');
      console.log('Subscription data:', JSON.stringify(forceData, null, 2));
    } else {
      console.log('Subscription does not exist even with force parameter ❌');
      console.log('Error response:', JSON.stringify(forceData, null, 2));
    }
  } catch (error) {
    console.error('Error fetching with force:', error.message);
  }
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
    
    // Test subscription detail with and without force parameter
    await testSubscriptionDetail(subscriptionId, auth);
    
    // List all subscriptions to see if the ID exists in the list
    console.log('\n==== Checking if subscription exists in complete list ====');
    const listResult = await listSubscriptions(auth);
    
    // Find if the requested subscription ID exists in the list
    let subscriptionExists = false;
    let subscriptionData = null;
    
    if (listResult.data) {
      let subscriptions = [];
      
      // Handle different response formats
      if (Array.isArray(listResult.data.subscriptions)) {
        subscriptions = listResult.data.subscriptions;
      } else if (Array.isArray(listResult.data.data?.subscriptions)) {
        subscriptions = listResult.data.data.subscriptions;
      } else if (Array.isArray(listResult.data.data)) {
        subscriptions = listResult.data.data;
      }
      
      if (subscriptions.length > 0) {
        const foundSubscription = subscriptions.find(sub => sub.id === subscriptionId);
        if (foundSubscription) {
          subscriptionExists = true;
          subscriptionData = foundSubscription;
        }
      }
    }
    
    if (subscriptionExists) {
      console.log(`✅ Subscription ${subscriptionId} exists in the subscription list`);
      console.log('Subscription data from list:', JSON.stringify(subscriptionData, null, 2));
    } else {
      console.log(`❌ Subscription ${subscriptionId} does NOT exist in the subscription list`);
    }
    
    console.log('\n==== Recommendation ====');
    if (subscriptionExists) {
      console.log(`This subscription exists in the backend but appears to be in your frontend deletion blacklist.`);
      console.log(`To fix this issue, try one of the following:`);
      console.log(`1. Access /subscriptions/${subscriptionId}?force=true in your browser`);
      console.log(`2. Open browser developer tools and run:`);
      console.log(`   const deletedIds = JSON.parse(localStorage.getItem('deletedSubscriptionIds') || '[]');`);
      console.log(`   const newDeletedIds = deletedIds.filter(id => id !== '${subscriptionId}');`);
      console.log(`   localStorage.setItem('deletedSubscriptionIds', JSON.stringify(newDeletedIds));`);
    } else {
      console.log(`This subscription doesn't exist in the backend. If you see it in the UI but get errors`);
      console.log(`when accessing it, your UI might be out of sync with the backend.`);
      console.log(`Try a hard refresh (Ctrl+F5) to reload the application.`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();