# Subscription Journey Test Suite

This document provides a comprehensive set of tests to validate the end-to-end subscription processing journey across all microservices in the NIFYA platform.

## Prerequisites

- Valid user credentials with appropriate permissions
- Access to all microservices and endpoints
- API client (like Postman, cURL, or the provided test scripts)
- Authentication tokens
- Test environment or isolated testing data

## Authentication Setup

Before running any tests, ensure proper authentication:

```javascript
// Sample authentication setup
const userCredentials = {
  email: "test-user@example.com",
  password: "securePassword123"
};

// Get authentication token
const authResponse = await fetch("https://authentication-service-415554190254.us-central1.run.app/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(userCredentials)
});

const { token, user } = await authResponse.json();
const userId = user.id;

// Headers for authenticated requests
const authHeaders = {
  "Authorization": `Bearer ${token}`,
  "x-user-id": userId,
  "Content-Type": "application/json"
};
```

## Test Suite Structure

The test suite follows the subscription journey through different phases:

1. **Subscription Management Tests**
2. **Subscription Processing Tests**
3. **Notification Generation Tests**
4. **End-to-End Flow Tests**
5. **Error Handling Tests**

## 1. Subscription Management Tests

### 1.1 Create Subscription Test

Verifies that a new subscription can be created successfully.

```javascript
// Test creating a BOE subscription
async function testCreateSubscription() {
  const subscriptionData = {
    type_id: "boe", // BOE subscription type
    name: "Test BOE Subscription",
    description: "Test subscription for BOE notifications",
    prompts: {
      keywords: ["test", "notification"],
      sections: ["general"],
      categories: ["announcements"]
    },
    frequency: "daily"
  };

  const response = await fetch("https://backend-415554190254.us-central1.run.app/v1/subscriptions", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(subscriptionData)
  });

  const result = await response.json();
  
  // Validation
  assert(response.status === 201, "Expected status 201 Created");
  assert(result.data && result.data.id, "Expected subscription ID in response");
  
  return result.data.id; // Return ID for subsequent tests
}
```

### 1.2 List Subscriptions Test

Ensures that created subscriptions are properly returned in the listing endpoint.

```javascript
async function testListSubscriptions(expectedId) {
  const response = await fetch("https://backend-415554190254.us-central1.run.app/v1/subscriptions", {
    method: "GET",
    headers: authHeaders
  });

  const result = await response.json();
  
  // Validation
  assert(response.status === 200, "Expected status 200 OK");
  assert(Array.isArray(result.data), "Expected array of subscriptions");
  assert(result.data.some(sub => sub.id === expectedId), "Expected to find created subscription");
}
```

### 1.3 Get Subscription Details Test

Verifies that a single subscription can be retrieved with its details.

```javascript
async function testGetSubscription(subscriptionId) {
  const response = await fetch(`https://backend-415554190254.us-central1.run.app/v1/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: authHeaders
  });

  const result = await response.json();
  
  // Validation
  assert(response.status === 200, "Expected status 200 OK");
  assert(result.data.id === subscriptionId, "Expected matching subscription ID");
  assert(result.data.prompts, "Expected prompts object in response");
}
```

## 2. Subscription Processing Tests

### 2.1 Initiate Processing Test

Tests that subscription processing can be initiated.

```javascript
async function testInitiateProcessing(subscriptionId) {
  const response = await fetch(`https://backend-415554190254.us-central1.run.app/v1/subscriptions/${subscriptionId}/process`, {
    method: "POST",
    headers: authHeaders
  });

  const result = await response.json();
  
  // Validation
  assert(response.status === 202, "Expected status 202 Accepted");
  assert(result.data && result.data.jobId, "Expected job ID in response");
  
  return result.data.jobId; // Return job ID for tracking
}
```

### 2.2 Check Processing Status Test

Verifies that processing status can be checked.

```javascript
async function testProcessingStatus(subscriptionId, jobId) {
  const response = await fetch(`https://backend-415554190254.us-central1.run.app/v1/subscriptions/${subscriptionId}/process/${jobId}`, {
    method: "GET",
    headers: authHeaders
  });

  const result = await response.json();
  
  // Validation
  assert(response.status === 200, "Expected status 200 OK");
  assert(result.data && result.data.status, "Expected status in response");
  
  // Status should be one of: "pending", "processing", "completed", "failed"
  assert(["pending", "processing", "completed", "failed"].includes(result.data.status), 
         "Expected valid status value");
         
  return result.data.status; // Return status for flow control
}
```

### 2.3 Subscription Worker Processing Test

Tests the subscription worker's processing capabilities directly.

```javascript
async function testSubscriptionWorkerProcessing(subscriptionId) {
  // Note: This is typically an internal API call, but useful for testing
  const response = await fetch("https://subscription-worker-415554190254.us-central1.run.app/process-subscription", {
    method: "POST",
    headers: {
      ...authHeaders,
      "x-api-key": "test-api-key" // Many internal services require API key
    },
    body: JSON.stringify({
      subscriptionId: subscriptionId,
      userId: authHeaders["x-user-id"],
      testMode: true // Flag to indicate test run
    })
  });

  const result = await response.json();
  
  // Validation
  assert(response.status === 200, "Expected status 200 OK");
  assert(result.success, "Expected success flag in response");
  assert(result.parserJob, "Expected parser job information");
}
```

## 3. Notification Generation Tests

### 3.1 Check for Generated Notifications

Verifies that notifications are generated after processing.

```javascript
async function testNotificationGeneration(subscriptionId) {
  // Polling function to check for notifications
  async function pollForNotifications(attempts = 10, delay = 2000) {
    for (let i = 0; i < attempts; i++) {
      const response = await fetch(`https://backend-415554190254.us-central1.run.app/v1/notifications?subscription_id=${subscriptionId}`, {
        method: "GET",
        headers: authHeaders
      });

      const result = await response.json();
      
      if (response.status === 200 && result.data && result.data.length > 0) {
        return result.data; // Found notifications
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error("No notifications generated after maximum attempts");
  }
  
  const notifications = await pollForNotifications();
  
  // Validation
  assert(Array.isArray(notifications), "Expected array of notifications");
  assert(notifications.length > 0, "Expected at least one notification");
  assert(notifications[0].subscription_id === subscriptionId, 
         "Expected notification to be linked to subscription");
         
  return notifications;
}
```

### 3.2 Notification Content Test

Checks that notifications have the expected content structure.

```javascript
async function testNotificationContent(notifications) {
  // Check first notification for expected fields
  const notification = notifications[0];
  
  // Validation
  assert(notification.id, "Expected notification ID");
  assert(notification.title, "Expected notification title");
  assert(notification.content, "Expected notification content");
  assert(notification.created_at, "Expected creation timestamp");
  assert(notification.subscription_id, "Expected subscription ID reference");
  assert(notification.entity_id, "Expected entity ID (e.g., BOE document ID)");
  assert(typeof notification.read === 'boolean', "Expected read status flag");
}
```

### 3.3 Mark Notification as Read Test

Tests that notifications can be marked as read.

```javascript
async function testMarkNotificationAsRead(notificationId) {
  const response = await fetch(`https://backend-415554190254.us-central1.run.app/v1/notifications/${notificationId}/read`, {
    method: "POST",
    headers: authHeaders
  });

  const result = await response.json();
  
  // Validation
  assert(response.status === 200, "Expected status 200 OK");
  assert(result.success, "Expected success response");
  
  // Verify notification is marked as read
  const checkResponse = await fetch(`https://backend-415554190254.us-central1.run.app/v1/notifications/${notificationId}`, {
    method: "GET",
    headers: authHeaders
  });
  
  const checkResult = await checkResponse.json();
  assert(checkResult.data.read === true, "Expected notification to be marked as read");
}
```

## 4. End-to-End Flow Tests

### 4.1 Complete Subscription Journey Test

Tests the entire subscription lifecycle from creation to notification.

```javascript
async function testCompleteSubscriptionJourney() {
  // Step 1: Create subscription
  const subscriptionId = await testCreateSubscription();
  console.log(`Created subscription: ${subscriptionId}`);
  
  // Step 2: Verify subscription details
  await testGetSubscription(subscriptionId);
  console.log("Verified subscription details");
  
  // Step 3: Initiate processing
  const jobId = await testInitiateProcessing(subscriptionId);
  console.log(`Initiated processing with job ID: ${jobId}`);
  
  // Step 4: Poll for processing completion
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between checks
    status = await testProcessingStatus(subscriptionId, jobId);
    console.log(`Current processing status: ${status}`);
  } while (status === "pending" || status === "processing");
  
  assert(status === "completed", "Expected processing to complete successfully");
  
  // Step 5: Check for notifications
  const notifications = await testNotificationGeneration(subscriptionId);
  console.log(`Generated ${notifications.length} notifications`);
  
  // Step 6: Test notification content
  await testNotificationContent(notifications);
  console.log("Verified notification content structure");
  
  // Step 7: Mark notification as read
  if (notifications.length > 0) {
    await testMarkNotificationAsRead(notifications[0].id);
    console.log("Verified notification can be marked as read");
  }
  
  return {
    success: true,
    subscriptionId,
    notificationsCount: notifications.length
  };
}
```

## 5. Error Handling Tests

### 5.1 Invalid Subscription Test

Tests error handling for invalid subscription data.

```javascript
async function testInvalidSubscription() {
  const invalidData = {
    // Missing required fields
    name: "Invalid Subscription"
    // No type_id, no prompts
  };

  const response = await fetch("https://backend-415554190254.us-central1.run.app/v1/subscriptions", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(invalidData)
  });
  
  // Validation
  assert(response.status === 400, "Expected status 400 Bad Request");
  
  const result = await response.json();
  assert(!result.success, "Expected failure response");
  assert(result.error, "Expected error message");
}
```

### 5.2 Processing Non-Existent Subscription Test

Tests error handling when trying to process a non-existent subscription.

```javascript
async function testProcessNonExistentSubscription() {
  const fakeId = "non-existent-subscription-id";
  
  const response = await fetch(`https://backend-415554190254.us-central1.run.app/v1/subscriptions/${fakeId}/process`, {
    method: "POST",
    headers: authHeaders
  });
  
  // Validation
  assert(response.status === 404, "Expected status 404 Not Found");
  
  const result = await response.json();
  assert(!result.success, "Expected failure response");
  assert(result.error, "Expected error message");
}
```

### 5.3 Rate Limiting Test

Tests that rate limiting is enforced for subscription processing.

```javascript
async function testRateLimiting(subscriptionId) {
  // Try to process the same subscription multiple times in quick succession
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(fetch(`https://backend-415554190254.us-central1.run.app/v1/subscriptions/${subscriptionId}/process`, {
      method: "POST",
      headers: authHeaders
    }));
  }
  
  const responses = await Promise.all(promises);
  
  // At least some of the later requests should be rate limited
  const rateLimited = responses.some(r => r.status === 429);
  assert(rateLimited, "Expected rate limiting to be enforced");
}
```

## Running the Test Suite

### Automated Test Script

Below is a sample script to run the entire test suite:

```javascript
async function runTestSuite() {
  console.log("SUBSCRIPTION JOURNEY TEST SUITE");
  console.log("===============================");
  
  try {
    // Setup
    console.log("Setting up authentication...");
    // Authentication setup code here
    
    // Subscription Management Tests
    console.log("\n🔍 RUNNING SUBSCRIPTION MANAGEMENT TESTS");
    const subscriptionId = await testCreateSubscription();
    await testListSubscriptions(subscriptionId);
    await testGetSubscription(subscriptionId);
    
    // Subscription Processing Tests
    console.log("\n🔍 RUNNING SUBSCRIPTION PROCESSING TESTS");
    const jobId = await testInitiateProcessing(subscriptionId);
    await testProcessingStatus(subscriptionId, jobId);
    await testSubscriptionWorkerProcessing(subscriptionId);
    
    // Notification Tests
    console.log("\n🔍 RUNNING NOTIFICATION TESTS");
    const notifications = await testNotificationGeneration(subscriptionId);
    await testNotificationContent(notifications);
    if (notifications.length > 0) {
      await testMarkNotificationAsRead(notifications[0].id);
    }
    
    // Error Handling Tests
    console.log("\n🔍 RUNNING ERROR HANDLING TESTS");
    await testInvalidSubscription();
    await testProcessNonExistentSubscription();
    await testRateLimiting(subscriptionId);
    
    // End-to-End Flow Test
    console.log("\n🔍 RUNNING END-TO-END FLOW TEST");
    const result = await testCompleteSubscriptionJourney();
    
    console.log("\n✅ TEST SUITE COMPLETED SUCCESSFULLY");
    console.log(result);
    
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED");
    console.error(error);
  }
}

// Run the test suite
runTestSuite();
```

### Manual Test Steps

For manual testing, follow these steps:

1. **Setup**: Authenticate and get user tokens
2. **Create Subscription**: Use the backend API to create a test subscription
3. **Verify Listing**: Confirm the subscription appears in the listing
4. **Process Subscription**: Initiate processing via API
5. **Monitor Progress**: Check job status until complete
6. **Verify Notifications**: Check for notifications related to the subscription
7. **Test Notification Actions**: Mark notifications as read/unread
8. **Cleanup**: Delete test subscription if needed

## Integration with CI/CD

To integrate these tests into a CI/CD pipeline:

1. Create a Node.js test script with the functions above
2. Add test environment credentials via secure environment variables
3. Run tests as part of the deployment pipeline
4. Fail deployment if any tests do not pass

## Troubleshooting

If tests fail, check the following:

1. **Authentication Issues**: Verify tokens are valid and properly formatted
2. **Service Status**: Check if all microservices are running
3. **Network Connectivity**: Ensure services can communicate with each other
4. **Rate Limiting**: Check if you've hit API rate limits
5. **Database State**: Verify database is accessible and has proper schema
6. **Logs**: Check service logs for detailed error messages

## Service URLs for Testing

| Service | URL |
|---------|-----|
| Authentication Service | https://authentication-service-415554190254.us-central1.run.app |
| Backend | https://backend-415554190254.us-central1.run.app |
| Subscription Worker | https://subscription-worker-415554190254.us-central1.run.app |
| BOE Parser | https://boe-parser-415554190254.us-central1.run.app |
| Notification Worker | https://notification-worker-415554190254.us-central1.run.app |