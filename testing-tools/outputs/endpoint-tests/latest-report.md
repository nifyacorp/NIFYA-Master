# NIFYA API Endpoint Test Results

Test run completed at: 2025-04-03T07:19:32.043Z

## Summary

- Total Endpoints: 16
- Passed: 4
- Failed: 12
- Errors: 0
- Skipped: 0
- Success Rate: 25%

## Results by Category

### Infrastructure

- Endpoints: 1
- Passed: 1
- Failed: 0
- Errors: 0
- Skipped: 0
- Success Rate: 100%

### Diagnostics

- Endpoints: 3
- Passed: 3
- Failed: 0
- Errors: 0
- Skipped: 0
- Success Rate: 100%

### Authentication

- Endpoints: 1
- Passed: 0
- Failed: 1
- Errors: 0
- Skipped: 0
- Success Rate: 0%

### Notifications

- Endpoints: 5
- Passed: 0
- Failed: 5
- Errors: 0
- Skipped: 0
- Success Rate: 0%

### Subscriptions

- Endpoints: 3
- Passed: 0
- Failed: 3
- Errors: 0
- Skipped: 0
- Success Rate: 0%

### Templates

- Endpoints: 1
- Passed: 0
- Failed: 1
- Errors: 0
- Skipped: 0
- Success Rate: 0%

### User

- Endpoints: 2
- Passed: 0
- Failed: 2
- Errors: 0
- Skipped: 0
- Success Rate: 0%

## Detailed Endpoint Results

### Infrastructure Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /health | GET | ✅ PASSED | 200 | 205ms |

### Diagnostics Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/diagnostics | GET | ✅ PASSED | 200 | 136ms |
| /api/diagnostics/db-status | GET | ✅ PASSED | 200 | 174ms |
| /api/diagnostics/db-tables | GET | ✅ PASSED | 200 | 150ms |

### Authentication Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/auth/login/test | POST | ❌ FAILED | 404 | 129ms |

### Notifications Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/notifications | GET | ❌ FAILED | 401 | 132ms |
| /api/v1/notifications/activity | GET | ❌ FAILED | 401 | 131ms |
| /api/v1/notifications/stats | GET | ❌ FAILED | 401 | 131ms |
| /api/v1/notifications/read-all | POST | ❌ FAILED | 401 | 141ms |
| /api/v1/notifications/create-test | POST | ❌ FAILED | 404 | 128ms |

### Subscriptions Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/subscriptions | GET | ❌ FAILED | 401 | 128ms |
| /api/v1/subscriptions | POST | ❌ FAILED | 400 | 127ms |
| /api/v1/subscriptions/types | GET | ❌ FAILED | 401 | 129ms |

### Templates Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/templates | GET | ❌ FAILED | 500 | 132ms |

### User Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/me | GET | ❌ FAILED | 404 | 129ms |
| /api/v1/me/email-preferences | GET | ❌ FAILED | 404 | 128ms |

