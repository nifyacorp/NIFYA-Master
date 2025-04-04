# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-04T12:45:06.719Z

## Summary

- Total Tests: 9
- Passed: 7
- Failed: 2
- Success Rate: 78%

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

- Tests: 3
- Passed: 2
- Failed: 1
- Success Rate: 67%

### Notifications

- Tests: 3
- Passed: 2
- Failed: 1
- Success Rate: 67%

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
[36m[2025-04-04T12:45:06.777Z] [INFO] Starting test login...[0m
[32m[2025-04-04T12:45:07.295Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-04T12:45:07.297Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:45:07.360Z] [INFO] Starting health check test[0m
[32m[2025-04-04T12:45:07.675Z] [SUCCESS] Health check successful:
[32m[2025-04-04T12:45:07.678Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-04T12:45:07.681Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:45:07.743Z] [INFO] Starting list subscriptions test[0m
[36m[2025-04-04T12:45:07.747Z] [INFO] Fetching subscriptions: backend-415554190254.us-central1.run.app/api/v1/subscriptions[0m
[32m[2025-04-04T12:45:08.086Z] [SUCCESS] Retrieved 0 subscriptions[0m
[32m[2025-04-04T12:45:08.088Z] [SUCCESS] Test list-subscriptions: PASSED
[32m[2025-04-04T12:45:08.092Z] [SUCCESS] Subscription listing test completed successfully[0m
[36m[2025-04-04T12:45:08.094Z] [INFO] Retrieved 0 subscriptions[0m
```

</details>

### Subscriptions: Create

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:45:08.158Z] [INFO] Starting minimal subscription creation test[0m
[36m[2025-04-04T12:45:08.162Z] [INFO] Creating minimal subscription: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[32m[2025-04-04T12:45:08.458Z] [SUCCESS] Minimal subscription created with ID: e9f9d3a1-99e9-4d28-b4fd-a77a4e42ba9b[0m
[32m[2025-04-04T12:45:08.460Z] [SUCCESS] Test minimal-create-subscription: PASSED
[32m[2025-04-04T12:45:08.464Z] [SUCCESS] Minimal subscription creation test completed successfully[0m
[36m[2025-04-04T12:45:08.466Z] [INFO] Created subscription ID: e9f9d3a1-99e9-4d28-b4fd-a77a4e42ba9b[0m
```

</details>

### Subscriptions: Create with User ID

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:45:08.530Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-04T12:45:08.535Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-04T12:45:08.776Z] [ERROR] Subscription creation failed with status code 400
[31m[2025-04-04T12:45:08.778Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-04T12:45:08.780Z] [SUCCESS] Subscription creation with user_id test completed[0m
```

</details>

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
[36m[2025-04-04T12:45:56.291Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-04T12:45:56.296Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-04T12:45:56.593Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-04T12:45:56.596Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-04T12:45:56.598Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Notifications: Activity

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:45:56.659Z] [INFO] Starting notification activity test[0m
[36m[2025-04-04T12:45:56.664Z] [INFO] Fetching notification activity: backend-415554190254.us-central1.run.app/api/v1/notifications/activity[0m
[32m[2025-04-04T12:45:56.904Z] [SUCCESS] Retrieved notification activity successfully[0m
[32m[2025-04-04T12:45:56.906Z] [SUCCESS] Test notification-activity: PASSED[0m
[32m[2025-04-04T12:45:56.908Z] [SUCCESS] Notification activity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:45:56.973Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-04T12:45:56.978Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-04T12:45:57.256Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-04T12:45:57.259Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-04T12:45:57.421Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-04T12:45:57.423Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-04T12:45:57.576Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-04T12:45:57.578Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-04T12:45:57.735Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-04T12:45:57.737Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

