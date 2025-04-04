# Subscription Management API Test Results

**Test Time:** 2025-04-04T12:30:45.176Z
**Overall Status:** ❌ FAILED
**Success Rate:** 57.14%

## Test Summary

| Test | Status | Details |
|------|--------|---------|
| authentication | ✅ PASSED | Successfully authenticated user |
| List Subscriptions | ✅ PASSED | Request successful with status 200 |
| Get Subscription Types | ✅ PASSED | Request successful with status 200 |
| Create BOE Subscription | ✅ PASSED | Request successful with status 201 |
| Create Real Estate Subscription | ✅ PASSED | Request successful with status 201 |
| Get Subscription Details | ❌ FAILED | {"status":"error","code":"DATABASE_ERROR","message":"Database operation failed: column s.logo does not exist"} |
| Update Subscription | ❌ FAILED | {"message":"Route PUT:/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288 not found","error":"Not Found","statusCode":404} |
| Toggle Subscription | ❌ FAILED | {"message":"Route POST:/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288/toggle not found","error":"Not Found","statusCode":404} |
| Get Subscription Status | ❌ FAILED | {"statusCode":500,"error":"Internal Server Error","message":"Cannot read properties of undefined (reading 'match')"} |
| Process Subscription | ✅ PASSED | Request successful with status 202 |
| Share Subscription | ❌ FAILED | {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"body must have required property 'email'"} |
| Remove Subscription Sharing | ❌ FAILED | {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"querystring must have required property 'email'"} |
| Delete Subscription 4e452f99-ee6d-4037-a1b2-0d91f242a288 | ✅ PASSED | Request successful with status 200 |
| Delete Subscription 15cfefc3-bf8a-4099-8317-339eaa99e791 | ✅ PASSED | Request successful with status 200 |
| Subscription Cleanup | ✅ PASSED | Deleted 2 test subscriptions |

## Detailed Results


### authentication
- **Status:** ✅ PASSED
- **Endpoint:** `https://authentication-service-415554190254.us-central1.run.app/api/auth/login`
- **Method:** `POST`

- **Details:** Successfully authenticated user
- **Duration:** 411ms


### List Subscriptions
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 288ms


### Get Subscription Types
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/types`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 218ms


### Create BOE Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `POST`

- **Details:** Request successful with status 201
- **Duration:** 196ms


### Create Real Estate Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `POST`

- **Details:** Request successful with status 201
- **Duration:** 175ms


### Get Subscription Details
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288`
- **Method:** `GET`
- **Error:** Request failed with status 500
- **Details:** {"status":"error","code":"DATABASE_ERROR","message":"Database operation failed: column s.logo does not exist"}
- **Duration:** 174ms


### Update Subscription
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288`
- **Method:** `PUT`
- **Error:** Request failed with status 404
- **Details:** {"message":"Route PUT:/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288 not found","error":"Not Found","statusCode":404}
- **Duration:** 229ms


### Toggle Subscription
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288/toggle`
- **Method:** `POST`
- **Error:** Request failed with status 404
- **Details:** {"message":"Route POST:/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288/toggle not found","error":"Not Found","statusCode":404}
- **Duration:** 137ms


### Get Subscription Status
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288/status`
- **Method:** `GET`
- **Error:** Request failed with status 500
- **Details:** {"statusCode":500,"error":"Internal Server Error","message":"Cannot read properties of undefined (reading 'match')"}
- **Duration:** 165ms


### Process Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288/process`
- **Method:** `POST`

- **Details:** Request successful with status 202
- **Duration:** 179ms


### Share Subscription
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288/share`
- **Method:** `POST`
- **Error:** Request failed with status 400
- **Details:** {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"body must have required property 'email'"}
- **Duration:** 157ms


### Remove Subscription Sharing
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288/share`
- **Method:** `DELETE`
- **Error:** Request failed with status 400
- **Details:** {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"querystring must have required property 'email'"}
- **Duration:** 151ms


### Delete Subscription 4e452f99-ee6d-4037-a1b2-0d91f242a288
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/4e452f99-ee6d-4037-a1b2-0d91f242a288`
- **Method:** `DELETE`

- **Details:** Request successful with status 200
- **Duration:** 154ms


### Delete Subscription 15cfefc3-bf8a-4099-8317-339eaa99e791
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/15cfefc3-bf8a-4099-8317-339eaa99e791`
- **Method:** `DELETE`

- **Details:** Request successful with status 200
- **Duration:** 168ms


### Subscription Cleanup
- **Status:** ✅ PASSED
- **Endpoint:** `Multiple DELETE endpoints`
- **Method:** `DELETE`

- **Details:** Deleted 2 test subscriptions



## Test Environment

- **Backend URL:** backend-415554190254.us-central1.run.app
- **Authentication URL:** authentication-service-415554190254.us-central1.run.app
- **Test Date:** 2025-04-04T12:30:45.176Z

## Next Steps
- Investigate and fix failing endpoints
- Ensure subscription processing is operational
- Check database connections for subscription operations

---
Generated 2025-04-04T12:30:45.176Z
