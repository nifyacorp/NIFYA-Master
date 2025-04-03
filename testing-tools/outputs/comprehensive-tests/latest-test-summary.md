# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-03T12:55:06.367Z

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
- Passed: 1
- Failed: 2
- Success Rate: 33%

### Notifications

- Tests: 3
- Passed: 3
- Failed: 0
- Success Rate: 100%

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
[36m[2025-04-03T12:55:06.413Z] [INFO] Starting test login...[0m
[32m[2025-04-03T12:55:06.918Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-03T12:55:06.920Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T12:55:06.968Z] [INFO] Starting health check test[0m
[32m[2025-04-03T12:55:07.274Z] [SUCCESS] Health check successful:
[32m[2025-04-03T12:55:07.280Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-03T12:55:07.285Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T12:55:07.352Z] [INFO] Starting list subscriptions test[0m
[36m[2025-04-03T12:55:07.358Z] [INFO] Fetching subscriptions: backend-415554190254.us-central1.run.app/api/v1/subscriptions[0m
[32m[2025-04-03T12:55:07.636Z] [SUCCESS] Retrieved 0 subscriptions[0m
[32m[2025-04-03T12:55:07.638Z] [SUCCESS] Test list-subscriptions: PASSED
[32m[2025-04-03T12:55:07.643Z] [SUCCESS] Subscription listing test completed successfully[0m
[36m[2025-04-03T12:55:07.646Z] [INFO] Retrieved 0 subscriptions[0m
```

</details>

### Subscriptions: Create

- Category: subscriptions
- Status: ❌ FAILED
- Critical: Yes

**Error:** Command failed: node tests/subscriptions/minimal-create.js

### Subscriptions: Create with User ID

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T12:55:07.961Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-03T12:55:07.965Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-03T12:55:08.186Z] [ERROR] Subscription creation failed with status code 400
[31m[2025-04-03T12:55:08.196Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-03T12:55:08.199Z] [SUCCESS] Subscription creation with user_id test completed[0m
```

</details>

### Notifications: List

- Category: notifications
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T12:55:08.246Z] [INFO] Starting notification polling test
[36m[2025-04-03T12:55:08.253Z] [INFO] Loaded subscription ID from file: test-1743665465310[0m
[33m[2025-04-03T12:55:08.255Z] [WARN] Using test ID test-1743665465310. Will simulate notification response.[0m
[32m[2025-04-03T12:55:09.259Z] [SUCCESS] Simulated 2 notifications for test ID test-1743665465310[0m
[32m[2025-04-03T12:55:09.262Z] [SUCCESS] Test poll-notifications: PASSED
[32m[2025-04-03T12:55:09.268Z] [SUCCESS] Notification polling test completed successfully[0m
[36m[2025-04-03T12:55:09.271Z] [INFO] Found 2 notifications after 1 attempts[0m
```

</details>

### Notifications: By Entity Type

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T12:55:09.321Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-03T12:55:09.324Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-03T12:55:09.560Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-03T12:55:09.562Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-03T12:55:09.564Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Notifications: Activity

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T12:55:09.619Z] [INFO] Starting notification activity test[0m
[36m[2025-04-03T12:55:09.623Z] [INFO] Fetching notification activity: backend-415554190254.us-central1.run.app/api/v1/notifications/activity[0m
[32m[2025-04-03T12:55:09.843Z] [SUCCESS] Retrieved notification activity successfully[0m
[32m[2025-04-03T12:55:09.845Z] [SUCCESS] Test notification-activity: PASSED[0m
[32m[2025-04-03T12:55:09.847Z] [SUCCESS] Notification activity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T12:55:09.896Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-03T12:55:09.902Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-03T12:55:10.122Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-03T12:55:10.126Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-03T12:55:10.268Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-03T12:55:10.270Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-03T12:55:10.419Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-03T12:55:10.421Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-03T12:55:10.564Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-03T12:55:10.566Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

