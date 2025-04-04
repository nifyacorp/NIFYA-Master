# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-04T16:15:28.369Z

## Summary

- Total Tests: 18
- Passed: 10
- Failed: 8
- Success Rate: 56%

## Results by Category

### Authentication

- Tests: 1
- Passed: 1
- Failed: 0
- Success Rate: 100%

### Infrastructure

- Tests: 1
- Passed: 1
- Failed: 0
- Success Rate: 100%

### Subscriptions

- Tests: 6
- Passed: 2
- Failed: 4
- Success Rate: 33%

### Templates

- Tests: 4
- Passed: 2
- Failed: 2
- Success Rate: 50%

### Notifications

- Tests: 4
- Passed: 3
- Failed: 1
- Success Rate: 75%

### Documentation

- Tests: 1
- Passed: 0
- Failed: 1
- Success Rate: 0%

### Diagnostics

- Tests: 1
- Passed: 1
- Failed: 0
- Success Rate: 100%

## Detailed Test Results

### Authentication: Login

- Category: authentication
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:15:28.426Z] [INFO] Starting test login...[0m
[32m[2025-04-04T16:15:29.138Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-04T16:15:29.140Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:15:29.196Z] [INFO] Starting health check test[0m
[32m[2025-04-04T16:15:29.529Z] [SUCCESS] Health check successful:
[32m[2025-04-04T16:15:29.531Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-04T16:15:29.533Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:15:29.595Z] [INFO] Starting list subscriptions test[0m
[36m[2025-04-04T16:15:29.600Z] [INFO] Fetching subscriptions: backend-415554190254.us-central1.run.app/api/v1/subscriptions[0m
[32m[2025-04-04T16:15:29.911Z] [SUCCESS] Retrieved 0 subscriptions[0m
[32m[2025-04-04T16:15:29.913Z] [SUCCESS] Test list-subscriptions: PASSED
[32m[2025-04-04T16:15:29.917Z] [SUCCESS] Subscription listing test completed successfully[0m
[36m[2025-04-04T16:15:29.919Z] [INFO] Retrieved 0 subscriptions[0m
```

</details>

### Subscriptions: Create

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:15:29.979Z] [INFO] Starting minimal subscription creation test[0m
[36m[2025-04-04T16:15:29.984Z] [INFO] Creating minimal subscription: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[32m[2025-04-04T16:15:30.290Z] [SUCCESS] Minimal subscription created with ID: 8c950462-2c99-453b-a8df-6809dc5603da[0m
[32m[2025-04-04T16:15:30.292Z] [SUCCESS] Test minimal-create-subscription: PASSED
[32m[2025-04-04T16:15:30.296Z] [SUCCESS] Minimal subscription creation test completed successfully[0m
[36m[2025-04-04T16:15:30.298Z] [INFO] Created subscription ID: 8c950462-2c99-453b-a8df-6809dc5603da[0m
```

</details>

### Subscriptions: Create with User ID

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:15:30.358Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-04T16:15:30.363Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-04T16:15:30.723Z] [ERROR] Subscription creation failed with status code 400
[31m[2025-04-04T16:15:30.725Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-04T16:15:30.727Z] [SUCCESS] Subscription creation with user_id test completed[0m
```

</details>

### Subscriptions: Debug Filter

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

**Error:** Command failed: node tests/subscriptions/debug-filter.js

### Subscriptions: Extended Debug Filter

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

**Error:** Command failed: node tests/subscriptions/debug-filter-extended.js

### Subscriptions: Create Type

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

**Error:** Command failed: node tests/subscriptions/create-subscription-type.js

### Templates: List

- Category: templates
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:15:35.208Z] [INFO] Starting subscription templates test[0m
[36m[2025-04-04T16:15:35.213Z] [INFO] Fetching subscription templates: backend-415554190254.us-central1.run.app/api/v1/templates[0m
[32m[2025-04-04T16:15:35.568Z] [SUCCESS] Retrieved 3 templates[0m
[32m[2025-04-04T16:15:35.569Z] [SUCCESS] Test list-templates: PASSED
[32m[2025-04-04T16:15:35.573Z] [SUCCESS] Template listing test completed successfully[0m
[36m[2025-04-04T16:15:35.576Z] [INFO] Retrieved 3 templates[0m
```

</details>

### Templates: Details

- Category: templates
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:15:35.648Z] [INFO] Starting template details test[0m
[36m[2025-04-04T16:15:35.651Z] [INFO] Authenticating user...[0m
[36m[2025-04-04T16:15:35.652Z] [INFO] Starting authentication test[0m
[36m[2025-04-04T16:15:35.654Z] [INFO] Sending authentication request to: authentication-service-415554190254.us-central1.run.app/api/auth/login[0m
[32m[2025-04-04T16:15:36.023Z] [SUCCESS] Authentication successful! Access token saved
[36m[2025-04-04T16:15:36.026Z] [INFO] Refresh token saved
[36m[2025-04-04T16:15:36.030Z] [INFO] User ID saved: 65c6074d-dbc4-4091-8e45-b6aecffd9ab9[0m
[32m[2025-04-04T16:15:36.032Z] [SUCCESS] Test auth-login: PASSED
[36m[2025-04-04T16:15:36.036Z] [INFO] Getting template list...[0m
[36m[2025-04-04T16:15:36.256Z] [INFO] Testing with template ID: boe-general[0m
[36m[2025-04-04T16:15:36.258Z] [INFO] Getting template details...[0m
[32m[2025-04-04T16:15:36.447Z] [SUCCESS] Template details test passed[0m
[32m[2025-04-04T16:15:36.448Z] [SUCCESS] Template details test completed successfully[0m
```

</details>

### Templates: Create

- Category: templates
- Status: ❌ FAILED
- Critical: No

**Error:** Command failed: node tests/templates/create-template.js

### Templates: Subscribe

- Category: templates
- Status: ❌ FAILED
- Critical: No

**Error:** Command failed: node tests/templates/subscribe-from-template.js

### Notifications: List

- Category: notifications
- Status: ❌ FAILED
- Critical: Yes

**Error:** Command failed: node tests/notifications/poll.js

### Notifications: By Entity Type

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:16:27.032Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-04T16:16:27.038Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-04T16:16:27.308Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-04T16:16:27.310Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-04T16:16:27.312Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Notifications: Activity

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:16:27.374Z] [INFO] Starting notification activity test[0m
[36m[2025-04-04T16:16:27.379Z] [INFO] Fetching notification activity: backend-415554190254.us-central1.run.app/api/v1/notifications/activity[0m
[32m[2025-04-04T16:16:27.644Z] [SUCCESS] Retrieved notification activity successfully[0m
[32m[2025-04-04T16:16:27.646Z] [SUCCESS] Test notification-activity: PASSED[0m
[32m[2025-04-04T16:16:27.647Z] [SUCCESS] Notification activity test completed[0m
```

</details>

### Notifications: Delete All

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:16:27.727Z] [INFO] Starting delete all notifications test[0m
[36m[2025-04-04T16:16:27.731Z] [INFO] Authenticating user...[0m
[36m[2025-04-04T16:16:27.732Z] [INFO] Starting authentication test[0m
[36m[2025-04-04T16:16:27.734Z] [INFO] Sending authentication request to: authentication-service-415554190254.us-central1.run.app/api/auth/login[0m
[32m[2025-04-04T16:16:28.174Z] [SUCCESS] Authentication successful! Access token saved
[36m[2025-04-04T16:16:28.177Z] [INFO] Refresh token saved
[36m[2025-04-04T16:16:28.181Z] [INFO] User ID saved: 65c6074d-dbc4-4091-8e45-b6aecffd9ab9[0m
[32m[2025-04-04T16:16:28.183Z] [SUCCESS] Test auth-login: PASSED
[36m[2025-04-04T16:16:28.187Z] [INFO] Getting initial notification count...[0m
[36m[2025-04-04T16:16:28.489Z] [INFO] Initial notification count: 0[0m
[36m[2025-04-04T16:16:28.491Z] [INFO] Deleting all notifications...[0m
[32m[2025-04-04T16:16:28.650Z] [SUCCESS] Successfully deleted all notifications[0m
[36m[2025-04-04T16:16:28.652Z] [INFO] Verifying notifications were deleted...[0m
[36m[2025-04-04T16:16:28.822Z] [INFO] Final notification count: 0[0m
[32m[2025-04-04T16:16:28.824Z] [SUCCESS] Delete all notifications test passed[0m
[32m[2025-04-04T16:16:28.826Z] [SUCCESS] Delete all notifications test completed successfully[0m
```

</details>

### Explorer: API Documentation

- Category: documentation
- Status: ❌ FAILED
- Critical: No

**Error:** Command failed: node tests/explorer/api-explorer.js

### Diagnostics: API Info

- Category: diagnostics
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T16:16:29.273Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-04T16:16:29.278Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-04T16:16:29.499Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-04T16:16:29.501Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-04T16:16:29.641Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-04T16:16:29.643Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-04T16:16:29.797Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-04T16:16:29.799Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-04T16:16:29.944Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-04T16:16:29.945Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

