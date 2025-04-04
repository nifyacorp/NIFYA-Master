# Subscription Management API Test Results

**Test Time:** 2025-04-04T15:32:09.732Z
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
| Get Subscription Details | ❌ FAILED | {"status":"error","code":"SUBSCRIPTION_NOT_FOUND","message":"Subscription not found"} |
| Update Subscription | ❌ FAILED | {"message":"Route PUT:/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa not found","error":"Not Found","statusCode":404} |
| Toggle Subscription | ❌ FAILED | {"message":"Route POST:/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa/toggle not found","error":"Not Found","statusCode":404} |
| Get Subscription Status | ❌ FAILED | {"statusCode":500,"error":"Internal Server Error","message":"Cannot read properties of undefined (reading 'match')"} |
| Process Subscription | ✅ PASSED | Request successful with status 202 |
| Share Subscription | ❌ FAILED | {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"body must have required property 'email'"} |
| Remove Subscription Sharing | ❌ FAILED | {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"querystring must have required property 'email'"} |
| Delete Subscription 5287efcd-9ff1-455c-8150-b6b63ed644aa | ✅ PASSED | Request successful with status 200 |
| Delete Subscription b5da2529-5eeb-4d08-b7aa-496e4be0b963 | ✅ PASSED | Request successful with status 200 |
| Subscription Cleanup | ✅ PASSED | Deleted 2 test subscriptions |

## Detailed Results


### authentication
- **Status:** ✅ PASSED
- **Endpoint:** `https://authentication-service-415554190254.us-central1.run.app/api/auth/login`
- **Method:** `POST`

- **Details:** Successfully authenticated user
- **Duration:** 594ms


### List Subscriptions
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 368ms


### Get Subscription Types
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/types`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 167ms


### Create BOE Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `POST`

- **Details:** Request successful with status 201
- **Duration:** 171ms


### Create Real Estate Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions`
- **Method:** `POST`

- **Details:** Request successful with status 201
- **Duration:** 213ms


### Get Subscription Details
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa`
- **Method:** `GET`
- **Error:** Request failed with status 404
- **Details:** {"status":"error","code":"SUBSCRIPTION_NOT_FOUND","message":"Subscription not found"}
- **Duration:** 156ms


### Update Subscription
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa`
- **Method:** `PUT`
- **Error:** Request failed with status 404
- **Details:** {"message":"Route PUT:/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa not found","error":"Not Found","statusCode":404}
- **Duration:** 178ms


### Toggle Subscription
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa/toggle`
- **Method:** `POST`
- **Error:** Request failed with status 404
- **Details:** {"message":"Route POST:/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa/toggle not found","error":"Not Found","statusCode":404}
- **Duration:** 138ms


### Get Subscription Status
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa/status`
- **Method:** `GET`
- **Error:** Request failed with status 500
- **Details:** {"statusCode":500,"error":"Internal Server Error","message":"Cannot read properties of undefined (reading 'match')"}
- **Duration:** 151ms


### Process Subscription
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa/process`
- **Method:** `POST`

- **Details:** Request successful with status 202
- **Duration:** 150ms


### Share Subscription
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa/share`
- **Method:** `POST`
- **Error:** Request failed with status 400
- **Details:** {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"body must have required property 'email'"}
- **Duration:** 146ms


### Remove Subscription Sharing
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa/share`
- **Method:** `DELETE`
- **Error:** Request failed with status 400
- **Details:** {"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"querystring must have required property 'email'"}
- **Duration:** 134ms


### Delete Subscription 5287efcd-9ff1-455c-8150-b6b63ed644aa
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/5287efcd-9ff1-455c-8150-b6b63ed644aa`
- **Method:** `DELETE`

- **Details:** Request successful with status 200
- **Duration:** 141ms


### Delete Subscription b5da2529-5eeb-4d08-b7aa-496e4be0b963
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/subscriptions/b5da2529-5eeb-4d08-b7aa-496e4be0b963`
- **Method:** `DELETE`

- **Details:** Request successful with status 200
- **Duration:** 143ms


### Subscription Cleanup
- **Status:** ✅ PASSED
- **Endpoint:** `Multiple DELETE endpoints`
- **Method:** `DELETE`

- **Details:** Deleted 2 test subscriptions



## Test Environment

- **Backend URL:** backend-415554190254.us-central1.run.app
- **Authentication URL:** authentication-service-415554190254.us-central1.run.app
- **Test Date:** 2025-04-04T15:32:09.732Z

## Next Steps
- Investigate and fix failing endpoints
- Ensure subscription processing is operational
- Check database connections for subscription operations

---
Generated 2025-04-04T15:32:09.732Z
