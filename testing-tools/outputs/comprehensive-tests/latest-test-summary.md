# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-02T10:32:56.720Z

## Summary

- Total Tests: 8
- Passed: 4
- Failed: 4
- Success Rate: 50%

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
- Passed: 1
- Failed: 1
- Success Rate: 50%

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
[36m[2025-04-02T10:32:56.763Z] [INFO] Starting test login...[0m
[32m[2025-04-02T10:33:00.982Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-02T10:33:00.986Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T10:33:01.034Z] [INFO] Starting health check test[0m
[32m[2025-04-02T10:33:01.393Z] [SUCCESS] Health check successful:
[32m[2025-04-02T10:33:01.397Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-02T10:33:01.406Z] [INFO] Health check test completed successfully[0m
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
[36m[2025-04-02T10:33:02.053Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-02T10:33:02.056Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-02T10:33:02.347Z] [ERROR] Subscription creation failed with status code 500
[31m[2025-04-02T10:33:02.350Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-02T10:33:02.352Z] [SUCCESS] Subscription creation with user_id test completed[0m
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
[36m[2025-04-02T10:33:49.539Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-02T10:33:49.543Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-02T10:33:49.822Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-02T10:33:49.824Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-02T10:33:49.826Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T10:33:49.871Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-02T10:33:49.875Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-02T10:33:50.098Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-02T10:33:50.107Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-02T10:33:50.249Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-02T10:33:50.251Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-02T10:33:50.409Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-02T10:33:50.411Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-02T10:33:50.556Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-02T10:33:50.557Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

