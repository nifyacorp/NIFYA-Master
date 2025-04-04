# Subscription Management API Test Results

**Test Time:** 2025-04-04T12:29:54.875Z
**Overall Status:** ❌ FAILED
**Success Rate:** 66.67%

## Test Summary

| Test | Status | Details |
|------|--------|---------|
| authentication | ✅ PASSED | Successfully authenticated user |
| List Subscriptions | ✅ PASSED | Request successful with status 200 |
| Get Subscription Types | ✅ PASSED | Request successful with status 200 |
| Create BOE Subscription | ❌ FAILED | {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"body/prompts must match exactly one schema in oneOf"} |

## Detailed Results


### authentication
- **Status:** ✅ PASSED
- **Endpoint:** `https://authentication-service-415554190254.us-central1.run.app/api/auth/login`
- **Method:** `POST`

- **Details:** Successfully authenticated user
- **Duration:** 459ms


### List Subscriptions
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 401ms


### Get Subscription Types
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/types`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 407ms


### Create BOE Subscription
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `POST`
- **Error:** Request failed with status 400
- **Details:** {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"body/prompts must match exactly one schema in oneOf"}
- **Duration:** 178ms


## Test Environment

- **Backend URL:** backend-415554190254.us-central1.run.app
- **Authentication URL:** authentication-service-415554190254.us-central1.run.app
- **Test Date:** 2025-04-04T12:29:54.875Z

## Next Steps
- Investigate and fix failing endpoints
- Ensure subscription processing is operational
- Check database connections for subscription operations

---
Generated 2025-04-04T12:29:54.875Z
