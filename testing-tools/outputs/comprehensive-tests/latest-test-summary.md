# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-02T08:55:31.263Z

## Summary

- Total Tests: 8
- Passed: 2
- Failed: 6
- Success Rate: 25%

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
- Passed: 0
- Failed: 3
- Success Rate: 0%

### Notifications

- Tests: 2
- Passed: 0
- Failed: 2
- Success Rate: 0%

### Diagnostics

- Tests: 1
- Passed: 0
- Failed: 1
- Success Rate: 0%

## Detailed Test Results

### Authentication: Login

- Category: authentication
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T08:55:31.305Z] [INFO] Starting test login...[0m
[32m[2025-04-02T08:55:31.800Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-02T08:55:31.805Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T08:55:31.857Z] [INFO] Starting health check test[0m
[32m[2025-04-02T08:55:32.189Z] [SUCCESS] Health check successful:
[32m[2025-04-02T08:55:32.193Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-02T08:55:32.202Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ❌ FAILED
- Critical: Yes

**Error:** Command failed: node tests/subscriptions/list.js

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
[36m[2025-04-02T08:55:32.806Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-02T08:55:32.810Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-02T08:55:33.027Z] [ERROR] Subscription creation failed with status code 401
[31m[2025-04-02T08:55:33.036Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-02T08:55:33.038Z] [SUCCESS] Subscription creation with user_id test completed[0m
```

</details>

### Notifications: List

- Category: notifications
- Status: ❌ FAILED
- Critical: Yes

**Error:** Command failed: node tests/notifications/poll.js

### Notifications: By Entity Type

- Category: notifications
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T08:56:20.252Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-02T08:56:20.256Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[31m[2025-04-02T08:56:20.472Z] [ERROR] Notifications by entity test failed with status code 401
[31m[2025-04-02T08:56:20.474Z] [ERROR] Test notifications-by-entity: FAILED
[32m[2025-04-02T08:56:20.476Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T08:56:20.523Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-02T08:56:20.528Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-02T08:56:20.746Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-02T08:56:20.755Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-02T08:56:20.889Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-02T08:56:20.890Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[31m[2025-04-02T08:56:21.035Z] [ERROR] Endpoint /api/diagnostics/db-status failed with status 404: {
[36m[2025-04-02T08:56:21.037Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[31m[2025-04-02T08:56:21.174Z] [ERROR] Endpoint /api/diagnostics/db-tables failed with status 404: {
[32m[2025-04-02T08:56:21.176Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

