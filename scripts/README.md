# NIFYA Backend Testing Scripts

This directory contains scripts for testing, analyzing, and troubleshooting the NIFYA backend services. These scripts allow you to verify and diagnose the entire platform from authentication to notification delivery.

## Prerequisites

- Node.js 14+ installed
- Network access to NIFYA backend services
- Basic understanding of NIFYA's architecture

## Core Testing Scripts

| Script | Description | Dependencies |
|--------|-------------|--------------|
| `auth-login.js` | Authenticates with the auth service | None |
| `get-profile.js` | Retrieves user profile information | Requires auth token |
| `list-subscriptions.js` | Lists all user subscriptions | Requires auth token |
| `create-subscription.js` | Creates a new BOE subscription | Requires auth token |
| `process-subscription.js` | Manually processes a subscription | Requires auth token and subscription ID |
| `poll-notifications.js` | Polls for notifications | Requires auth token |
| `run-all-tests.js` | Runs all basic tests in sequence | None (manages dependencies) |

## Advanced Analysis Scripts

| Script | Description | Output |
|--------|-------------|--------|
| `analyze-notification-pipeline.js` | Analyzes the notification pipeline from BOE Parser to Notification Worker | `notification_pipeline_analysis.md` |
| `map-all-endpoints.js` | Creates a map of all backend endpoints and compares with frontend usage | `backend_endpoints_map.md`, `frontend_endpoints_used.md` |
| `test-all-auth-endpoints.js` | Tests all available auth service endpoints | `auth_endpoints_results.md` |
| `user-journey-test.js` | Simulates complete user journey from login to notification | `user_journey_log.md`, `user_journey_state.json` |

## Shell Scripts

| Script | Description | Dependencies |
|--------|-------------|--------------|
| `create_boe_subscription.sh` | Creates a BOE subscription using cURL | Requires `auth_token.txt` |
| `poll_notifications.sh` | Polls for notifications in a loop | Requires `auth_token.txt` |
| `run_all_tests.sh` | Runs all shell-based tests in sequence | None (manages dependencies) |
| `test_auth.sh` | Tests authentication and saves token | None |
| `test_profile.sh` | Tests profile retrieval | Requires `auth_token.txt` |
| `test_subscriptions.sh` | Tests subscription listing | Requires `auth_token.txt` |

## Documentation Files

| File | Description |
|------|-------------|
| `NIFYA-TESTING-GUIDE.md` | Comprehensive guide to backend testing methodology |
| `TESTING-CONCLUSIONS.md` | Summary of findings from the test suite |
| `NOTIFICATION-PIPELINE-CONCLUSIONS.md` | Analysis of notification pipeline issues |
| `backend-testing-guide.md` | Detailed guide for backend API testing |
| `auth-service-issues.md` | Analysis of authentication service issues |

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

4. For shell-based testing:
   ```bash
   chmod +x run_all_tests.sh
   ./run_all_tests.sh
   ```

5. For advanced analysis:
   ```bash
   node analyze-notification-pipeline.js
   node map-all-endpoints.js
   node user-journey-test.js
   ```

## Understanding the Output

Each script:
1. Logs its progress to the console
2. Saves raw API responses to JSON files
3. Often produces additional detailed reports in markdown format

Key output files:
- `auth_token.txt` - Contains the authentication token
- `latest_subscription_id.txt` - Contains ID of created subscription
- `*_response.json` - API responses from various endpoints
- `TEST_DETAILS.txt` - Comprehensive test report
- `user_journey_log.md` - Detailed user journey test results
- `notification_pipeline_analysis.md` - In-depth analysis of notification system
- `backend_endpoints_map.md` - Map of all backend endpoints

## API Endpoints

The scripts interact with the following services:

### Authentication Service
- **Base URL**: `https://authentication-service-415554190254.us-central1.run.app`
- **Endpoints**:
  - `/api/auth/login` - Authentication
  - `/api/auth/me` - User profile
  - `/api/auth/revoke-all-sessions` - Session management
  - And more (see `auth_endpoints_results.md` for full list)

### Backend Service
- **Base URL**: `https://backend-415554190254.us-central1.run.app`
- **Endpoints**:
  - `/api/subscriptions` - List/create subscriptions
  - `/api/subscriptions/:id/process` - Process subscription
  - `/api/notifications` - Get notifications

## Complete Testing Workflow

The scripts simulate the following data flow:

1. **Authentication**: Get a token from auth service
2. **Profile**: Verify user identity
3. **Subscriptions**: List existing subscriptions
4. **Creation**: Create a new subscription
5. **Processing**: Trigger subscription processing
6. **Notifications**: Poll for new notifications
7. **Analysis**: Analyze system performance and issues

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

5. **Redirects (301/308)**:
   - Check for trailing slashes in URLs
   - Verify correct endpoint paths

## Customization

You can modify these scripts to test specific scenarios:

- Edit `create-subscription.js` to change subscription parameters
- Adjust polling intervals in `poll-notifications.js`
- Modify schema analysis in `analyze-notification-pipeline.js`
- Add new API endpoints to test in `map-all-endpoints.js`

## Security Notes

- These scripts store auth tokens in plain text files
- For production testing, implement proper credential management
- Avoid committing `auth_token.txt` to version control