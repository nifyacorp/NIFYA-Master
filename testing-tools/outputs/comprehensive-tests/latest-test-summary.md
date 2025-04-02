# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-02T11:09:38.046Z

## Summary

- Total Tests: 8
- Passed: 5
- Failed: 3
- Success Rate: 63%

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
[36m[2025-04-02T11:09:38.086Z] [INFO] Starting test login...[0m
[32m[2025-04-02T11:09:38.647Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-02T11:09:38.650Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T11:09:38.700Z] [INFO] Starting health check test[0m
[32m[2025-04-02T11:09:39.054Z] [SUCCESS] Health check successful:
[32m[2025-04-02T11:09:39.059Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-02T11:09:39.070Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T11:09:39.123Z] [INFO] Starting list subscriptions test[0m
[36m[2025-04-02T11:09:39.126Z] [INFO] Fetching subscriptions: backend-415554190254.us-central1.run.app/api/v1/subscriptions[0m
[32m[2025-04-02T11:09:39.378Z] [SUCCESS] Retrieved 0 subscriptions[0m
[32m[2025-04-02T11:09:39.380Z] [SUCCESS] Test list-subscriptions: PASSED
[32m[2025-04-02T11:09:39.386Z] [SUCCESS] Subscription listing test completed successfully[0m
[36m[2025-04-02T11:09:39.389Z] [INFO] Retrieved 0 subscriptions[0m
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
[36m[2025-04-02T11:09:39.773Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-02T11:09:39.777Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-02T11:09:40.071Z] [ERROR] Subscription creation failed with status code 500
[31m[2025-04-02T11:09:40.080Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-02T11:09:40.083Z] [SUCCESS] Subscription creation with user_id test completed[0m
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
[36m[2025-04-02T11:10:27.371Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-02T11:10:27.375Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-02T11:10:27.607Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-02T11:10:27.608Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-02T11:10:27.610Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Diagnostics: API Info

- Category: diagnostics
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-02T11:10:27.658Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-02T11:10:27.670Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-02T11:10:27.883Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-02T11:10:27.890Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-02T11:10:28.031Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-02T11:10:28.033Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-02T11:10:28.188Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-02T11:10:28.190Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-02T11:10:28.330Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-02T11:10:28.332Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

