# NIFYA Backend Testing Guide

This guide provides detailed instructions on how to test the NIFYA backend services independently of the frontend. The scripts included in this repository enable comprehensive API testing for authentication, subscriptions, and notifications.

## Script Overview

These Node.js scripts test the entire notification pipeline from authentication to notification delivery:

| Script | Purpose | API Endpoints |
|--------|---------|--------------|
| `auth-login.js` | Authentication | `/api/auth/login` |
| `get-profile.js` | User profile | `/api/auth/me` |
| `list-subscriptions.js` | List subscriptions | `/api/subscriptions` |
| `create-subscription.js` | Create subscription | `/api/subscriptions` |
| `process-subscription.js` | Process subscription | `/api/subscriptions/{id}/process` |
| `poll-notifications.js` | Poll for notifications | `/api/notifications` |
| `test-all-auth-endpoints.js` | Test all auth endpoints | All under `/api/auth/*` |
| `run-all-tests.js` | Run comprehensive test | All endpoints |

## Getting Started

1. Clone the repository and navigate to the scripts directory:
   ```bash
   cd /mnt/c/Users/34994419B/Documents/GitHub/NIFYA-Master/scripts
   ```

2. Install dependencies (if needed):
   ```bash
   npm install https
   ```

3. Run a single test:
   ```bash
   node auth-login.js
   ```

4. Or run the full test suite:
   ```bash
   node run-all-tests.js
   ```

## Key Findings from Testing

### 1. Authentication Service

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/auth/login` | ✅ | Works as expected |
| `/api/auth/me` | ✅ | Successfully retrieves user profile |
| `/api/auth/revoke-all-sessions` | ✅ | Successfully revokes sessions |
| `/api/auth/google/login` | ✅ | Successfully provides OAuth URL |

The auth service also provides excellent error messages with:
- Required parameters
- Documentation URLs
- Related endpoints
- Request IDs for debugging

### 2. Backend Service

This service is responsible for:
- Managing subscriptions
- Processing notifications
- Providing user-specific content

Testing is ongoing for these endpoints.

## Error Handling

The authentication service demonstrated excellent error handling with clear, consistent error messages that provide:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "34218cbf-8700-4d3d-a349-9be16cbcd4c9",
    "timestamp": "2025-03-26T11:59:39.016Z",
    "details": {
      "currentPassword": "Missing required body parameter: currentPassword",
      "newPassword": "Missing required body parameter: newPassword"
    },
    "help": {
      "endpoint_info": { ... },
      "related_endpoints": [ ... ],
      "documentation_url": "...",
      "required_parameters": [ ... ]
    }
  }
}
```

This approach should be extended to all backend services.

## Test Script Output

Each script produces:

1. **Console Output**: Real-time progress and results
2. **JSON Files**: Raw and formatted API responses
3. **TEST_DETAILS.txt**: Cumulative test results

### Example Output Files:

- `auth_token.txt` - JWT authentication token
- `auth_response.json` - Authentication response
- `profile_response.json` - User profile
- `subscriptions_response.json` - Subscription listing
- `latest_subscription_id.txt` - Created subscription ID
- `latest_notifications.json` - Found notifications
- `auth_endpoints_results.md` - Auth API test results

## Authentication Flow

The authentication flow involves:

1. **Login**: Get JWT token via `/api/auth/login`
2. **Token Use**: Include token in `Authorization: Bearer TOKEN` header
3. **Token Management**: Refresh via `/api/auth/refresh` when needed
4. **Logout**: Invalidate token via `/api/auth/logout`

## Subscription Flow

The subscription creation and notification flow:

1. **Create**: Create subscription via `/api/subscriptions`
2. **Process**: Trigger processing via `/api/subscriptions/{id}/process`
3. **Poll**: Check for notifications via `/api/notifications`
4. **Verify**: Validate notification content and relevance

## Advanced Testing

For more advanced testing:

1. Test token expiration and refresh
2. Validate notification filtering
3. Test rate limiting
4. Check error handling for edge cases

## Issues and Improvements

Based on our testing, key improvement areas include:

1. **Endpoint Path Consistency**: 
   - Ensure consistent base paths across services
   - Document API structure clearly

2. **Error Response Format**:
   - Maintain JSON format even for system errors
   - Include helpful debugging information

3. **Service Documentation**:
   - Expand API explorer to cover all services
   - Add test cases to documentation

## Running the Tests in Pipeline

These tests can be integrated into CI/CD pipelines:

```yaml
test-backend:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '16'
    - run: |
        cd scripts
        node run-all-tests.js
    - uses: actions/upload-artifact@v2
      with:
        name: test-results
        path: scripts/TEST_DETAILS.txt
```

## Conclusion

These scripts provide a robust way to verify the backend services independently of the frontend. They're particularly useful for:

- API regression testing
- Debugging notification issues
- Verifying authentication flows
- Confirming message schema changes