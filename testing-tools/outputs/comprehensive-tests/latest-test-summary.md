# NIFYA Comprehensive Test Results

Test run completed at: 2025-04-04T21:53:05.751Z

## Summary

- Total Tests: 18
- Passed: 12
- Failed: 6
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

- Tests: 6
- Passed: 4
- Failed: 2
- Success Rate: 67%

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
[36m[2025-04-04T21:53:05.814Z] [INFO] Starting test login...[0m
[32m[2025-04-04T21:53:06.232Z] [SUCCESS] Authentication successful! Token saved (first 10 chars): eyJhbGciOi...[0m
[36m[2025-04-04T21:53:06.234Z] [INFO] Test login completed successfully[0m
```

</details>

### Infrastructure: Health Check

- Category: infrastructure
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:53:06.291Z] [INFO] Starting health check test[0m
[32m[2025-04-04T21:53:06.518Z] [SUCCESS] Health check successful:
[32m[2025-04-04T21:53:06.520Z] [SUCCESS] Database connection verified[0m
[36m[2025-04-04T21:53:06.522Z] [INFO] Health check test completed successfully[0m
```

</details>

### Subscriptions: List

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:53:06.579Z] [INFO] Starting list subscriptions test[0m
[36m[2025-04-04T21:53:06.583Z] [INFO] Fetching subscriptions: backend-415554190254.us-central1.run.app/api/v1/subscriptions[0m
[32m[2025-04-04T21:53:06.882Z] [SUCCESS] Retrieved 0 subscriptions[0m
[32m[2025-04-04T21:53:06.884Z] [SUCCESS] Test list-subscriptions: PASSED
[32m[2025-04-04T21:53:06.887Z] [SUCCESS] Subscription listing test completed successfully[0m
[36m[2025-04-04T21:53:06.890Z] [INFO] Retrieved 0 subscriptions[0m
```

</details>

### Subscriptions: Create

- Category: subscriptions
- Status: ✅ PASSED
- Critical: Yes

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:53:06.949Z] [INFO] Starting minimal subscription creation test[0m
[36m[2025-04-04T21:53:06.953Z] [INFO] Creating minimal subscription: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[32m[2025-04-04T21:53:07.322Z] [SUCCESS] Minimal subscription created with ID: 9811564b-99af-4749-8d68-1f050efb8753[0m
[32m[2025-04-04T21:53:07.324Z] [SUCCESS] Test minimal-create-subscription: PASSED
[32m[2025-04-04T21:53:07.329Z] [SUCCESS] Minimal subscription creation test completed successfully[0m
[36m[2025-04-04T21:53:07.331Z] [INFO] Created subscription ID: 9811564b-99af-4749-8d68-1f050efb8753[0m
```

</details>

### Subscriptions: Create with User ID

- Category: subscriptions
- Status: ❌ FAILED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:53:07.400Z] [INFO] Starting subscription creation with explicit user_id test[0m
[36m[2025-04-04T21:53:07.405Z] [INFO] Creating subscription with user_id: backend-415554190254.us-central1.run.app/api/v1/subscriptions
[31m[2025-04-04T21:53:07.692Z] [ERROR] Subscription creation failed with status code 400
[31m[2025-04-04T21:53:07.694Z] [ERROR] Test user-id-create-subscription: FAILED
[32m[2025-04-04T21:53:07.696Z] [SUCCESS] Subscription creation with user_id test completed[0m
```

</details>

### Subscriptions: Debug Filter

- Category: subscriptions
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:53:07.758Z] [INFO] Starting subscription debug-filter test[0m
[36m[2025-04-04T21:53:07.762Z] [INFO] Testing debug-filter with params: {}[0m
[32m[2025-04-04T21:53:07.995Z] [SUCCESS] Debug filter response for 'basic' obtained successfully[0m
[36m[2025-04-04T21:53:07.997Z] [INFO] Testing debug-filter with params: {"type":"boe"}[0m
[32m[2025-04-04T21:53:08.134Z] [SUCCESS] Debug filter response for 'type-filter' obtained successfully[0m
[36m[2025-04-04T21:53:08.136Z] [INFO] Testing debug-filter with params: {"status":"active"}[0m
[32m[2025-04-04T21:53:08.272Z] [SUCCESS] Debug filter response for 'status-filter' obtained successfully[0m
[36m[2025-04-04T21:53:08.274Z] [INFO] Testing debug-filter with params: {"createdAfter":"2025-01-01"}[0m
[32m[2025-04-04T21:53:08.421Z] [SUCCESS] Debug filter response for 'date-filter' obtained successfully[0m
[36m[2025-04-04T21:53:08.423Z] [INFO] Testing debug-filter with params: {"type":"boe","status":"active","limit":10}[0m
[32m[2025-04-04T21:53:08.628Z] [SUCCESS] Debug filter response for 'combined-filters' obtained successfully[0m
[32m[2025-04-04T21:53:08.630Z] [SUCCESS] All debug filter tests passed (5/5)[0m
[32m[2025-04-04T21:53:08.632Z] [SUCCESS] Test subscription-debug-filter: PASSED
[32m[2025-04-04T21:53:08.636Z] [SUCCESS] Subscription debug-filter test completed successfully[0m
[36m[2025-04-04T21:53:08.638Z] [INFO] basic: Successful test[0m
[36m[2025-04-04T21:53:08.640Z] [INFO] type-filter: Successful test[0m
[36m[2025-04-04T21:53:08.641Z] [INFO] status-filter: Successful test[0m
[36m[2025-04-04T21:53:08.643Z] [INFO] date-filter: Successful test[0m
[36m[2025-04-04T21:53:08.644Z] [INFO] combined-filters: Successful test[0m
```

</details>

### Subscriptions: Extended Debug Filter

- Category: subscriptions
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:53:08.703Z] [INFO] Starting extended subscription debug-filter test[0m
[36m[2025-04-04T21:53:08.707Z] [INFO] Testing with params: {}[0m
[36m[2025-04-04T21:53:08.708Z] [INFO] Testing debug-filter endpoint with params: {}[0m
[36m[2025-04-04T21:53:08.924Z] [INFO] Testing list endpoint with params: {}[0m
[36m[2025-04-04T21:53:09.109Z] [INFO] Testing with params: {"type":"boe"}[0m
[36m[2025-04-04T21:53:09.110Z] [INFO] Testing debug-filter endpoint with params: {"type":"boe"}[0m
[36m[2025-04-04T21:53:09.251Z] [INFO] Testing list endpoint with params: {"type":"boe"}[0m
[36m[2025-04-04T21:53:09.409Z] [INFO] Testing with params: {"status":"active"}[0m
[36m[2025-04-04T21:53:09.411Z] [INFO] Testing debug-filter endpoint with params: {"status":"active"}[0m
[36m[2025-04-04T21:53:09.617Z] [INFO] Testing list endpoint with params: {"status":"active"}[0m
[36m[2025-04-04T21:53:09.785Z] [INFO] Testing with params: {"createdAfter":"2025-01-01"}[0m
[36m[2025-04-04T21:53:09.787Z] [INFO] Testing debug-filter endpoint with params: {"createdAfter":"2025-01-01"}[0m
[36m[2025-04-04T21:53:09.921Z] [INFO] Testing list endpoint with params: {"createdAfter":"2025-01-01"}[0m
[36m[2025-04-04T21:53:10.066Z] [INFO] Testing with params: {"type":"boe","status":"active","limit":10}[0m
[36m[2025-04-04T21:53:10.068Z] [INFO] Testing debug-filter endpoint with params: {"type":"boe","status":"active","limit":10}[0m
[36m[2025-04-04T21:53:10.200Z] [INFO] Testing list endpoint with params: {"type":"boe","status":"active","limit":10}[0m
[36m[2025-04-04T21:53:10.386Z] [INFO] Testing with params: {"search":"test"}[0m
[36m[2025-04-04T21:53:10.388Z] [INFO] Testing debug-filter endpoint with params: {"search":"test"}[0m
[36m[2025-04-04T21:53:10.523Z] [INFO] Testing list endpoint with params: {"search":"test"}[0m
[36m[2025-04-04T21:53:10.667Z] [INFO] Testing with params: {"sortBy":"createdAt","sortOrder":"desc"}[0m
[36m[2025-04-04T21:53:10.669Z] [INFO] Testing debug-filter endpoint with params: {"sortBy":"createdAt","sortOrder":"desc"}[0m
[36m[2025-04-04T21:53:10.802Z] [INFO] Testing list endpoint with params: {"sortBy":"createdAt","sortOrder":"desc"}[0m
[36m[2025-04-04T21:53:10.942Z] [INFO] Testing with params: {"page":1,"limit":5}[0m
[36m[2025-04-04T21:53:10.944Z] [INFO] Testing debug-filter endpoint with params: {"page":1,"limit":5}[0m
[36m[2025-04-04T21:53:11.075Z] [INFO] Testing list endpoint with params: {"page":1,"limit":5}[0m
[36m[2025-04-04T21:53:11.221Z] [INFO] Diagnostic report saved to /mnt/c/Users/Andres/Documents/Github/NIFYA-Master/testing-tools/outputs/reports/subscription-filter-diagnostic-2025-04-04T21-53-11-217Z.md[0m
[32m[2025-04-04T21:53:11.222Z] [SUCCESS] All filter tests passed[0m
[32m[2025-04-04T21:53:11.224Z] [SUCCESS] Test subscription-debug-filter-extended: PASSED
[32m[2025-04-04T21:53:11.228Z] [SUCCESS] Extended subscription debug-filter test completed successfully[0m
[36m[2025-04-04T21:53:11.230Z] [INFO] Diagnostic report available at: /mnt/c/Users/Andres/Documents/Github/NIFYA-Master/testing-tools/outputs/reports/subscription-filter-diagnostic-2025-04-04T21-53-11-217Z.md[0m
```

</details>

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
[36m[2025-04-04T21:53:11.917Z] [INFO] Starting subscription templates test[0m
[36m[2025-04-04T21:53:11.921Z] [INFO] Fetching subscription templates: backend-415554190254.us-central1.run.app/api/v1/templates[0m
[32m[2025-04-04T21:53:12.138Z] [SUCCESS] Retrieved 3 templates[0m
[32m[2025-04-04T21:53:12.140Z] [SUCCESS] Test list-templates: PASSED
[32m[2025-04-04T21:53:12.144Z] [SUCCESS] Template listing test completed successfully[0m
[36m[2025-04-04T21:53:12.146Z] [INFO] Retrieved 3 templates[0m
```

</details>

### Templates: Details

- Category: templates
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:53:12.219Z] [INFO] Starting template details test[0m
[36m[2025-04-04T21:53:12.222Z] [INFO] Authenticating user...[0m
[36m[2025-04-04T21:53:12.224Z] [INFO] Starting authentication test[0m
[36m[2025-04-04T21:53:12.226Z] [INFO] Sending authentication request to: authentication-service-415554190254.us-central1.run.app/api/auth/login[0m
[32m[2025-04-04T21:53:12.544Z] [SUCCESS] Authentication successful! Access token saved
[36m[2025-04-04T21:53:12.547Z] [INFO] Refresh token saved
[36m[2025-04-04T21:53:12.551Z] [INFO] User ID saved: 65c6074d-dbc4-4091-8e45-b6aecffd9ab9[0m
[32m[2025-04-04T21:53:12.553Z] [SUCCESS] Test auth-login: PASSED
[36m[2025-04-04T21:53:12.556Z] [INFO] Getting template list...[0m
[36m[2025-04-04T21:53:12.761Z] [INFO] Testing with template ID: boe-general[0m
[36m[2025-04-04T21:53:12.763Z] [INFO] Getting template details...[0m
[32m[2025-04-04T21:53:12.918Z] [SUCCESS] Template details test passed[0m
[32m[2025-04-04T21:53:12.920Z] [SUCCESS] Template details test completed successfully[0m
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
[36m[2025-04-04T21:54:03.462Z] [INFO] Starting notifications by entity test[0m
[36m[2025-04-04T21:54:03.466Z] [INFO] Testing notifications for entity type: subscription, with entityId param[0m
[33m[2025-04-04T21:54:03.774Z] [WARN] Received 200 status but data is not in expected format[0m
[32m[2025-04-04T21:54:03.777Z] [SUCCESS] Test notifications-by-entity: PASSED but with unexpected format
[32m[2025-04-04T21:54:03.779Z] [SUCCESS] Notifications by entity test completed[0m
```

</details>

### Notifications: Activity

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:54:03.836Z] [INFO] Starting notification activity test[0m
[36m[2025-04-04T21:54:03.840Z] [INFO] Fetching notification activity: backend-415554190254.us-central1.run.app/api/v1/notifications/activity[0m
[32m[2025-04-04T21:54:04.072Z] [SUCCESS] Retrieved notification activity successfully[0m
[32m[2025-04-04T21:54:04.074Z] [SUCCESS] Test notification-activity: PASSED[0m
[32m[2025-04-04T21:54:04.076Z] [SUCCESS] Notification activity test completed[0m
```

</details>

### Notifications: Delete All

- Category: notifications
- Status: ✅ PASSED
- Critical: No

<details><summary>Output Log (Click to expand)</summary>

```
[36m[2025-04-04T21:54:04.151Z] [INFO] Starting delete all notifications test[0m
[36m[2025-04-04T21:54:04.154Z] [INFO] Authenticating user...[0m
[36m[2025-04-04T21:54:04.156Z] [INFO] Starting authentication test[0m
[36m[2025-04-04T21:54:04.158Z] [INFO] Sending authentication request to: authentication-service-415554190254.us-central1.run.app/api/auth/login[0m
[32m[2025-04-04T21:54:04.524Z] [SUCCESS] Authentication successful! Access token saved
[36m[2025-04-04T21:54:04.527Z] [INFO] Refresh token saved
[36m[2025-04-04T21:54:04.530Z] [INFO] User ID saved: 65c6074d-dbc4-4091-8e45-b6aecffd9ab9[0m
[32m[2025-04-04T21:54:04.532Z] [SUCCESS] Test auth-login: PASSED
[36m[2025-04-04T21:54:04.535Z] [INFO] Getting initial notification count...[0m
[36m[2025-04-04T21:54:04.823Z] [INFO] Initial notification count: 0[0m
[36m[2025-04-04T21:54:04.825Z] [INFO] Deleting all notifications...[0m
[32m[2025-04-04T21:54:04.973Z] [SUCCESS] Successfully deleted all notifications[0m
[36m[2025-04-04T21:54:04.976Z] [INFO] Verifying notifications were deleted...[0m
[36m[2025-04-04T21:54:05.163Z] [INFO] Final notification count: 0[0m
[32m[2025-04-04T21:54:05.165Z] [SUCCESS] Delete all notifications test passed[0m
[32m[2025-04-04T21:54:05.167Z] [SUCCESS] Delete all notifications test completed successfully[0m
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
[36m[2025-04-04T21:54:05.504Z] [INFO] Starting database diagnostic test[0m
[36m[2025-04-04T21:54:05.508Z] [INFO] Testing endpoint: /health[0m
[32m[2025-04-04T21:54:05.764Z] [SUCCESS] Endpoint /health returned success: {
[36m[2025-04-04T21:54:05.767Z] [INFO] Testing endpoint: /api/diagnostics[0m
[32m[2025-04-04T21:54:05.904Z] [SUCCESS] Endpoint /api/diagnostics returned success: {
[36m[2025-04-04T21:54:05.906Z] [INFO] Testing endpoint: /api/diagnostics/db-status[0m
[32m[2025-04-04T21:54:06.056Z] [SUCCESS] Endpoint /api/diagnostics/db-status returned success: {
[36m[2025-04-04T21:54:06.058Z] [INFO] Testing endpoint: /api/diagnostics/db-tables[0m
[32m[2025-04-04T21:54:06.222Z] [SUCCESS] Endpoint /api/diagnostics/db-tables returned success: {
[32m[2025-04-04T21:54:06.224Z] [SUCCESS] Database diagnostic test completed[0m
```

</details>

