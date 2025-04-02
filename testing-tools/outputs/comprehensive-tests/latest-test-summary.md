# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-02T09:07:21.499Z

## Summary

- Total Tests: 8
- Passed: 3
- Failed: 5
- Success Rate: 38%

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
[36m[2025-04-02T09:07:21.548Z] [INFO] Starting test login...[0m
[32m[2025-04-02T09:07:21.913Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-02T09:07:21.917Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T09:07:21.962Z] [INFO] Starting health check test[0m
[32m[2025-04-02T09:07:22.318Z] [SUCCESS] Health check successful:
[32m[2025-04-02T09:07:22.324Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-02T09:07:22.335Z] [INFO] Health check test completed successfully[0m
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
[36m[2025-04-02T09:07:22.949Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-02T09:07:22.953Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-02T09:07:23.244Z] [ERROR] Subscription creation failed with status code 500
[31m[2025-04-02T09:07:23.248Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-02T09:07:23.250Z] [SUCCESS] Subscription creation with user_id test completed[0m
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
[36m[2025-04-02T09:08:10.406Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-02T09:08:10.410Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-02T09:08:10.704Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-02T09:08:10.706Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-02T09:08:10.709Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T09:08:10.750Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-02T09:08:10.754Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-02T09:08:10.963Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-02T09:08:10.973Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-02T09:08:11.118Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-02T09:08:11.122Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[31m[2025-04-02T09:08:11.274Z] [ERROR] Endpoint /api/diagnostics/db-status failed with status 500: {
[36m[2025-04-02T09:08:11.275Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-02T09:08:11.418Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-02T09:08:11.419Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

