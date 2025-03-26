# NIFYA Backend Testing Scripts

This directory contains Node.js scripts for testing the NIFYA backend services independently of the frontend. These scripts allow you to verify the entire notification pipeline from authentication to notification delivery.

## Prerequisites

- Node.js 14+ installed
- Network access to NIFYA backend services
- Basic understanding of NIFYA's architecture

## Available Scripts

| Script | Description | Dependencies |
|--------|-------------|--------------|
| `auth-login.js` | Authenticates with the service | None |
| `get-profile.js` | Retrieves user profile information | Requires auth token |
| `list-subscriptions.js` | Lists all user subscriptions | Requires auth token |
| `create-subscription.js` | Creates a new BOE subscription | Requires auth token |
| `process-subscription.js` | Manually processes a subscription | Requires auth token and subscription ID |
| `poll-notifications.js` | Polls for notifications | Requires auth token |
| `run-all-tests.js` | Runs all tests in sequence | None (manages dependencies) |

## Getting Started

1. Navigate to the scripts directory:
   ```bash
   cd scripts
   ```

2. Run the comprehensive test suite:
   ```bash
   node run-all-tests.js
   ```

3. Or run individual scripts as needed:
   ```bash
   node auth-login.js
   node list-subscriptions.js
   ```

## Understanding the Output

Each script:
1. Logs its progress to the console
2. Saves raw API responses to JSON files
3. Appends results to `TEST_DETAILS.txt` for analysis

## API Endpoints

The scripts interact with the following services:

### Authentication Service
- **Base URL**: `https://authentication-service-415554190254.us-central1.run.app`
- **Endpoints**:
  - `/login` - Authentication
  - `/me` - User profile

### Backend Service
- **Base URL**: `https://backend-415554190254.us-central1.run.app`
- **Endpoints**:
  - `/api/subscriptions` - List/create subscriptions
  - `/api/subscriptions/:id/process` - Process subscription
  - `/api/notifications` - Get notifications

## Data Flow

The scripts simulate the following data flow:

1. **Authentication**: Get a token from auth service
2. **Profile**: Verify user identity
3. **Subscriptions**: List existing subscriptions
4. **Creation**: Create a new subscription
5. **Processing**: Trigger subscription processing
6. **Notifications**: Poll for new notifications

## Troubleshooting

If you encounter issues:

1. **Authentication Failures**:
   - Check credentials in `auth-login.js`
   - Verify the auth endpoint path

2. **Empty Subscription Lists**:
   - This is normal for new users

3. **No Notifications**:
   - Processing takes time; increase polling attempts/interval
   - Check subscription ID is valid

4. **Connection Errors**:
   - Verify network connectivity
   - Check service URLs are correct

## Output Files

The scripts create several output files:

- `auth_token.txt` - Contains the authentication token
- `latest_subscription_id.txt` - Contains ID of created subscription
- `*_response_raw.json` - Raw API responses
- `*_response.json` - Formatted API responses
- `TEST_DETAILS.txt` - Comprehensive test report

## Customization

You can modify these scripts to test specific scenarios:

- Edit `create-subscription.js` to change subscription parameters
- Adjust polling intervals in `poll-notifications.js`
- Add new API endpoints as needed

## Core Functions

The scripts use these key Node.js patterns:

1. **HTTPS Requests**:
   ```javascript
   const req = https.request(options, (res) => {
     // Handle response
   });
   ```

2. **Authentication**:
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```

3. **Response Processing**:
   ```javascript
   res.on('data', (chunk) => { data += chunk; });
   res.on('end', () => { /* Process complete data */ });
   ```

4. **File I/O**:
   ```javascript
   fs.writeFileSync('output.json', JSON.stringify(data));
   ```

## Common Errors and Solutions

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| 401 Unauthorized | Invalid token | Re-authenticate with `auth-login.js` |
| 404 Not Found | Incorrect API path | Verify endpoint URL in script |
| 400 Bad Request | Invalid payload | Check JSON data format |
| ECONNREFUSED | Service unavailable | Confirm service is running |

## Security Notes

- These scripts store auth tokens in plain text files
- For production testing, implement proper credential management
- Avoid committing `auth_token.txt` to version control