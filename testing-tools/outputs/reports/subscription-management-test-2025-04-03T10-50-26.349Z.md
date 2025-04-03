# Subscription Management API Test Results

**Test Time:** 2025-04-03T10:50:26.349Z
**Overall Status:** ❌ FAILED
**Success Rate:** 75.00%

## Test Summary

| Test | Status | Details |
|------|--------|---------|
| authentication | ✅ PASSED | Successfully authenticated user |
| List Subscriptions | ✅ PASSED | Request successful with status 200 |
| Get Subscription Types | ❌ FAILED | {"status":"error","code":"TYPE_FETCH_ERROR","message":"Failed to fetch subscription types"} |
| Create BOE Subscription | ✅ PASSED | Request successful with status 201 |
| Create Real Estate Subscription | ✅ PASSED | Request successful with status 201 |

## Detailed Results


### authentication
- **Status:** ✅ PASSED
- **Endpoint:** `https://authentication-service-415554190254.us-central1.run.app/api/auth/login`
- **Method:** `POST`

- **Details:** Successfully authenticated user
- **Duration:** 4242ms


### List Subscriptions
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 365ms


### Get Subscription Types
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/types`
- **Method:** `GET`
- **Error:** Request failed with status 500
- **Details:** {"status":"error","code":"TYPE_FETCH_ERROR","message":"Failed to fetch subscription types"}
- **Duration:** 168ms


### Create BOE Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `POST`

- **Details:** Request successful with status 201
- **Duration:** 198ms


### Create Real Estate Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `POST`

- **Details:** Request successful with status 201
- **Duration:** 168ms


## Test Environment

- **Backend URL:** backend-415554190254.us-central1.run.app
- **Authentication URL:** authentication-service-415554190254.us-central1.run.app
- **Test Date:** 2025-04-03T10:50:26.349Z

## Next Steps
- Investigate and fix failing endpoints
- Ensure subscription processing is operational
- Check database connections for subscription operations

---
Generated 2025-04-03T10:50:26.349Z
