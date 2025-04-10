# NIFYA API Endpoint Test Results

Test run completed at: 2025-04-03T10:33:11.798Z

## Summary

- Total Endpoints: 16
- Passed: 12
- Failed: 4
- Errors: 0
- Skipped: 0
- Success Rate: 75%

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
- Passed: 4
- Failed: 1
- Errors: 0
- Skipped: 0
- Success Rate: 80%

### Subscriptions

- Endpoints: 3
- Passed: 1
- Failed: 2
- Errors: 0
- Skipped: 0
- Success Rate: 33%

### Templates

- Endpoints: 1
- Passed: 1
- Failed: 0
- Errors: 0
- Skipped: 0
- Success Rate: 100%

### User

- Endpoints: 2
- Passed: 2
- Failed: 0
- Errors: 0
- Skipped: 0
- Success Rate: 100%

## Detailed Endpoint Results

### Infrastructure Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /health | GET | ✅ PASSED | 200 | 206ms |

### Diagnostics Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/diagnostics | GET | ✅ PASSED | 200 | 131ms |
| /api/diagnostics/db-status | GET | ✅ PASSED | 200 | 150ms |
| /api/diagnostics/db-tables | GET | ✅ PASSED | 200 | 134ms |

### Authentication Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/auth/login/test | POST | ❌ FAILED | 404 | 125ms |

### Notifications Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/notifications | GET | ✅ PASSED | 200 | 148ms |
| /api/v1/notifications/activity | GET | ✅ PASSED | 200 | 141ms |
| /api/v1/notifications/stats | GET | ✅ PASSED | 200 | 150ms |
| /api/v1/notifications/read-all | POST | ✅ PASSED | 200 | 139ms |
| /api/v1/notifications/create-test | POST | ❌ FAILED | 404 | 130ms |

### Subscriptions Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/subscriptions | GET | ✅ PASSED | 200 | 142ms |
| /api/v1/subscriptions | POST | ❌ FAILED | 400 | 125ms |
| /api/v1/subscriptions/types | GET | ❌ FAILED | 500 | 143ms |

### Templates Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/templates | GET | ✅ PASSED | 200 | 131ms |

### User Endpoints

| Endpoint | Method | Status | Response Code | Response Time |
|----------|--------|--------|---------------|---------------|
| /api/v1/me | GET | ✅ PASSED | 200 | 135ms |
| /api/v1/me/email-preferences | GET | ✅ PASSED | 200 | 138ms |

