# NIFYA Notification Pipeline Fix Plan

Based on the test results, we've identified that the Backend API has implemented API versioning with a `/v1/` prefix. The authentication part of the system is working correctly, but the API path changes cause the notification pipeline tests to fail. This document outlines the necessary fixes.

## Key Findings

1. **Confirmed API Versioning**:
   - `/api/subscriptions` now redirects to `/api/v1/subscriptions` (301)
   - `/api/subscriptions/{id}/process` redirects to `/api/v1/subscriptions/{id}/process` (308)
   - Health endpoint is still at `/health` without versioning (200)

2. **New API Requirements**:
   - The v1 API endpoints require a `user_id` header in addition to the Authorization token
   - Without this header, endpoints return a 401 error with details about missing headers

## Required Script Updates

### 1. Update Core API URL Patterns

The following scripts need to be updated to use the v1 API endpoints:

1. **list-subscriptions.js**:
   - Change URL from `/api/subscriptions` to `/api/v1/subscriptions`
   - Add `x-user-id` header with the user ID from the JWT token

2. **create-subscription.js**:
   - Change URL from `/api/subscriptions` to `/api/v1/subscriptions`
   - Add `x-user-id` header

3. **process-subscription.js**:
   - Change URL from `/api/subscriptions/{id}/process` to `/api/v1/subscriptions/{id}/process`
   - Add `x-user-id` header

4. **poll-notifications.js**:
   - Change URL from `/api/notifications` to `/api/v1/notifications`
   - Add `x-user-id` header

### 2. Extract User ID from JWT Token

All scripts need to extract the user ID from the JWT token to add it as a header. Add a helper function to do this:

```javascript
function getUserIdFromToken(token) {
  try {
    // JWT tokens are in the format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Extract user ID - adjust property name if needed
    return payload.sub || payload.user_id || payload.id;
  } catch (error) {
    console.error('Failed to extract user ID from token:', error.message);
    return null;
  }
}
```

### 3. Update Header Creation

Modify the header creation in all scripts:

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'x-user-id': getUserIdFromToken(token)
};
```

### 4. Fix User Journey Test

Update `user-journey-test.js` to handle the API version changes:

- Modify all backend API paths to include the `/v1/` prefix
- Add user ID extraction and header creation
- Update the error handling to check for specific API versioning errors

### 5. Create Helper Module

To maintain consistency, create a shared helper module (`api-client.js`) with the common functions:

```javascript
// api-client.js
const https = require('https');

// Extract user ID from JWT token
function getUserIdFromToken(token) {
  // Implementation as above
}

// Make an API request with proper headers
function makeApiRequest(options, token, body = null) {
  // Set user ID header if token is provided
  if (token) {
    const userId = getUserIdFromToken(token);
    if (userId) {
      options.headers = options.headers || {};
      options.headers['x-user-id'] = userId;
    }
  }
  
  // Implementation of request function
}

module.exports = {
  getUserIdFromToken,
  makeApiRequest
};
```

## Testing Plan

After implementing these changes, we'll verify the fixes with the following tests:

1. **API Path Verification**:
   - Run the updated scripts to confirm they use the correct API paths
   - Verify that API responses come back with 2xx status codes

2. **Header Verification**:
   - Monitor requests to confirm the `x-user-id` header is being sent
   - Ensure the extracted user ID matches the expected format

3. **Full User Journey Test**:
   - Run the updated user journey test to verify end-to-end functionality
   - Check that all steps complete successfully

4. **Notification Pipeline Test**:
   - Create a subscription using the updated scripts
   - Process the subscription and verify notifications are generated
   - Poll for notifications to confirm they're delivered correctly

## Implementation Timeline

1. **Day 1**: Update core API scripts and create helper module
2. **Day 2**: Update user journey test and comprehensive test suite
3. **Day 3**: Test all changes and document results

## Expected Outcomes

After implementing these fixes, we expect:

1. All scripts to successfully communicate with the backend API
2. The notification pipeline to work correctly end-to-end
3. No 301/308 redirects or 401 errors due to missing headers

The updated scripts will provide a reliable way to test the NIFYA notification pipeline and verify its functionality.