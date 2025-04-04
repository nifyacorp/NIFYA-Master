# API Client Fixes

This document summarizes the fixes implemented to address the issues identified in `test-results-summary.md`.

## Issues Identified

1. **Token Handling Issues**:
   - API client was not properly detecting status codes from responses
   - Tokens were expiring but the testing tools had no mechanism to refresh them
   - No token expiration detection or refresh mechanism

2. **Status Code Handling**:
   - Many API calls reported "status code undefined" despite receiving valid responses
   - Inconsistent use of `response.status` vs `response.statusCode`

3. **Authentication Workflow**:
   - No storage of refresh tokens for subsequent use
   - No automatic token refresh before making authenticated requests

4. **Subscription Format Issues**:
   - Subscription API requires a new format for the `prompts` field
   - Backend API validation fails with the old format
   - Some subscription endpoints return 500 errors

## Implemented Fixes

### 1. Token Status Code Handling

In `makeApiRequest` function in `api-client.js`, we added an explicit statusCode property to the response object:

```javascript
resolve({
  statusCode: res.statusCode, // Add explicit statusCode property
  status: res.statusCode,     // Keep existing property for backward compatibility
  headers: res.headers,
  data: parsedData,
  raw: data
});
```

This ensures consistent access to status codes via either `response.status` or `response.statusCode`.

### 2. Token Refresh Mechanism

Added the following new functions in `api-client.js`:

- `loadRefreshToken()`: Loads refresh token from file
- `isTokenExpired()`: Checks if a token is expired or about to expire
- `refreshTokenIfNeeded()`: Refreshes the authentication token if needed

Also updated `login.js` to save the refresh token:

```javascript
// Save refresh token if available
if (refreshToken) {
  fs.writeFileSync(REFRESH_TOKEN_FILE, refreshToken);
  logger.info('Refresh token saved', { tokenPreview: refreshToken.substring(0, 10) + '...' }, testName);
} else {
  logger.warn('No refresh token found in response', null, testName);
}
```

### 3. Authenticated Request Helper

Added a new helper function `makeAuthenticatedRequest()` that automatically refreshes the token if needed:

```javascript
async function makeAuthenticatedRequest(options) {
  // First try to refresh the token if needed
  const token = await refreshTokenIfNeeded();
  if (!token) {
    console.error('Could not get a valid token for authenticated request');
    return { statusCode: 401, data: { error: 'Authentication required' } };
  }
  
  // Make the request with the refreshed token
  return makeApiRequest(options, token, null, false);
}
```

### 4. Comprehensive Test Improvements

Updated `comprehensive-endpoint-test.js` to:

- Use the token refresh mechanism before starting tests
- Properly handle status codes consistently
- Log the correct status code when reporting results

```javascript
// Get the auth token for tests that need it and refresh if needed
let token = await refreshTokenIfNeeded();
if (!token) {
  logger.error('Failed to get valid authentication token. Run auth/test-login.js first.');
  process.exit(1);
}
logger.info('Authentication token validated and refreshed if needed');
```

## How to Test the Fixes

1. Run the authentication test to generate fresh tokens:
   ```
   node testing-tools/tests/auth/login.js
   ```

2. Run the comprehensive endpoint test to check if the changes fixed the issues:
   ```
   node testing-tools/tests/comprehensive-endpoint-test.js
   ```

The system should now:
- Properly detect status codes
- Automatically refresh tokens when they expire
- Store and use refresh tokens
- Consistently handle authentication across all tests

## Subscription API Format Requirements

During testing of the subscription API endpoints, we discovered that the format of the `prompts` field has changed in the backend API:

### Previous Format
```json
{
  "name": "Test BOE Subscription",
  "type": "boe",
  "templateId": "boe-default",
  "prompts": ["Ayuntamiento Barcelona licitaciones"],
  "frequency": "daily",
  "configuration": {},
  "logo": null
}
```

### New Required Format
```json
{
  "name": "Test BOE Subscription",
  "type": "boe",
  "templateId": "boe-default",
  "prompts": { "value": "Ayuntamiento Barcelona licitaciones" },
  "frequency": "daily",
  "configuration": {},
  "logo": null
}
```

This change affects the following endpoints:
- POST `/api/v1/subscriptions` (Create subscription)
- PATCH/PUT `/api/v1/subscriptions/:id` (Update subscription)

## Current API Status

### Working Endpoints
- Authentication (login, refresh token)
- List subscriptions
- Create subscription (with updated format)
- Process subscription

### Endpoints with Issues
- Get subscription details (returns 500 error)
- Update subscription (format issue)
- Toggle subscription (returns 500 error)
- Get subscription status (returns 500 error)
- Share/unshare subscription (returns 500 error)

## Fixed Tests
The following test files have been updated to use the new format:
- `tests/subscriptions/minimal-create.js`
- `tests/subscriptions/full-flow-test.js`
- `tests/subscriptions/subscription-manager-tests.js`
- `config/endpoints.js` (test data)

## Response Format
The API returns subscription objects with a standard format:

```json
{
  "status": "success",
  "data": {
    "subscription": {
      "id": "89baa42b-8dc9-4044-8559-820559adf858",
      "name": "Test BOE Subscription",
      "type": "boe",
      "description": "",
      "prompts": [
        "Ayuntamiento Barcelona licitaciones"
      ],
      "frequency": "daily",
      "active": true
    }
  }
}
```

Note that even though the API requires the prompts to be sent as an object with a `value` property, it returns the prompts as an array of strings. This suggests that the backend is transforming the format internally.

## Ongoing Considerations

1. If the authentication service changes its response format, we may need to update the token extraction logic
2. We should consider adding more robust error handling for network issues
3. For production environments, token refresh should be implemented with proper retry logic and circuit breakers
4. Backend API endpoint issues (500 errors) need to be investigated by the backend team