# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-04T12:28:20.113Z

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
[36m[2025-04-04T12:28:20.177Z] [INFO] Starting test login...[0m
[32m[2025-04-04T12:28:20.579Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-04T12:28:20.581Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:28:20.642Z] [INFO] Starting health check test[0m
[32m[2025-04-04T12:28:20.877Z] [SUCCESS] Health check successful:
[32m[2025-04-04T12:28:20.881Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-04T12:28:20.883Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:28:20.947Z] [INFO] Starting list subscriptions test[0m
[36m[2025-04-04T12:28:20.952Z] [INFO] Fetching subscriptions: backend-415554190254.us-central1.run.app/api/v1/subscriptions[0m
[32m[2025-04-04T12:28:21.217Z] [SUCCESS] Retrieved 0 subscriptions[0m
[32m[2025-04-04T12:28:21.219Z] [SUCCESS] Test list-subscriptions: PASSED
[32m[2025-04-04T12:28:21.222Z] [SUCCESS] Subscription listing test completed successfully[0m
[36m[2025-04-04T12:28:21.224Z] [INFO] Retrieved 0 subscriptions[0m
```

</details>

### Subscriptions: Create

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:28:21.287Z] [INFO] Starting minimal subscription creation test[0m
[36m[2025-04-04T12:28:21.291Z] [INFO] Creating minimal subscription: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[32m[2025-04-04T12:28:21.540Z] [SUCCESS] Minimal subscription created with ID: 5fe24106-35c4-4d7f-b8e2-7421b6b9b078[0m
[32m[2025-04-04T12:28:21.543Z] [SUCCESS] Test minimal-create-subscription: PASSED
[32m[2025-04-04T12:28:21.547Z] [SUCCESS] Minimal subscription creation test completed successfully[0m
[36m[2025-04-04T12:28:21.549Z] [INFO] Created subscription ID: 5fe24106-35c4-4d7f-b8e2-7421b6b9b078[0m
```

</details>

### Subscriptions: Create with User ID

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:28:21.613Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-04T12:28:21.617Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-04T12:28:21.832Z] [ERROR] Subscription creation failed with status code 400
[31m[2025-04-04T12:28:21.834Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-04T12:28:21.836Z] [SUCCESS] Subscription creation with user_id test completed[0m
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
[36m[2025-04-04T12:29:09.610Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-04T12:29:09.615Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-04T12:29:09.887Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-04T12:29:09.889Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-04T12:29:09.891Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Notifications: Activity

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:29:09.959Z] [INFO] Starting notification activity test[0m
[36m[2025-04-04T12:29:09.964Z] [INFO] Fetching notification activity: backend-415554190254.us-central1.run.app/api/v1/notifications/activity[0m
[32m[2025-04-04T12:29:10.233Z] [SUCCESS] Retrieved notification activity successfully[0m
[32m[2025-04-04T12:29:10.235Z] [SUCCESS] Test notification-activity: PASSED[0m
[32m[2025-04-04T12:29:10.237Z] [SUCCESS] Notification activity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T12:29:10.311Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-04T12:29:10.317Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-04T12:29:10.537Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-04T12:29:10.539Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-04T12:29:10.702Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-04T12:29:10.705Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-04T12:29:10.848Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-04T12:29:10.851Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-04T12:29:10.990Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-04T12:29:10.992Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

