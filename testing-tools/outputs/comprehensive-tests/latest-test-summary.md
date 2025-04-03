# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-03T06:56:08.467Z

## Summary

- Total Tests: 9
- Passed: 6
- Failed: 3
- Success Rate: 67%

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
[36m[2025-04-03T06:56:08.509Z] [INFO] Starting test login...[0m
[32m[2025-04-03T06:56:09.018Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-03T06:56:09.022Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T06:56:09.066Z] [INFO] Starting health check test[0m
[32m[2025-04-03T06:56:09.274Z] [SUCCESS] Health check successful:
[32m[2025-04-03T06:56:09.279Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-03T06:56:09.284Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T06:56:09.332Z] [INFO] Starting list subscriptions test[0m
[36m[2025-04-03T06:56:09.335Z] [INFO] Fetching subscriptions: backend-415554190254.us-central1.run.app/api/v1/subscriptions[0m
[32m[2025-04-03T06:56:09.589Z] [SUCCESS] Retrieved 0 subscriptions[0m
[32m[2025-04-03T06:56:09.591Z] [SUCCESS] Test list-subscriptions: PASSED
[32m[2025-04-03T06:56:09.597Z] [SUCCESS] Subscription listing test completed successfully[0m
[36m[2025-04-03T06:56:09.601Z] [INFO] Retrieved 0 subscriptions[0m
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
[36m[2025-04-03T06:56:09.983Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-03T06:56:09.987Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-03T06:56:10.224Z] [ERROR] Subscription creation failed with status code 500
[31m[2025-04-03T06:56:10.226Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-03T06:56:10.227Z] [SUCCESS] Subscription creation with user_id test completed[0m
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
[36m[2025-04-03T06:56:57.544Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-03T06:56:57.549Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-03T06:56:57.776Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-03T06:56:57.777Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-03T06:56:57.779Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Notifications: Activity

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T06:56:57.819Z] [INFO] Starting notification activity test[0m
[36m[2025-04-03T06:56:57.823Z] [INFO] Fetching notification activity: backend-415554190254.us-central1.run.app/api/v1/notifications/activity[0m
[32m[2025-04-03T06:56:58.057Z] [SUCCESS] Retrieved notification activity successfully[0m
[32m[2025-04-03T06:56:58.059Z] [SUCCESS] Test notification-activity: PASSED[0m
[32m[2025-04-03T06:56:58.061Z] [SUCCESS] Notification activity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-03T06:56:58.112Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-03T06:56:58.116Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-03T06:56:58.325Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-03T06:56:58.327Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-03T06:56:58.474Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-03T06:56:58.476Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-03T06:56:58.633Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-03T06:56:58.635Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-03T06:56:58.780Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-03T06:56:58.782Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

