# User Profile Management API Test Results

**Test Time:** 2025-04-03T10:58:07.817Z
**Overall Status:** ❌ FAILED
**Success Rate:** 37.50%

## Test Summary

| Test | Status | Details |
|------|--------|---------|
| authentication | ✅ PASSED | Successfully authenticated user |
| Get User Profile | ✅ PASSED | Request successful with status 200 |
| Update User Profile | ❌ FAILED | {"message":"Route PATCH:/api/v1/me not found","error":"Not Found","statusCode":404} |
| Verify Profile Updates | ❌ FAILED | Profile does not contain the updated information |
| Update Notification Settings | ❌ FAILED | {"message":"Route PATCH:/api/v1/me/notification-settings not found","error":"Not Found","statusCode":404} |
| Get Email Preferences | ✅ PASSED | Request successful with status 200 |
| Update Email Preferences | ✅ PASSED | Request successful with status 200 |
| Verify Email Preferences Update | ❌ FAILED | Email preferences do not contain the updated information |
| Send Test Email | ❌ FAILED | {"statusCode":500,"code":"SERVER_ERROR","error":"Internal Server Error","message":"Failed to send test email"} |

## Detailed Results


### authentication
- **Status:** ✅ PASSED
- **Endpoint:** `https://authentication-service-415554190254.us-central1.run.app/api/auth/login`
- **Method:** `POST`

- **Details:** Successfully authenticated user
- **Duration:** 478ms



### Get User Profile
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 358ms
- **Response Data:**
```json
{
  "profile": {
    "id": "65c6074d-dbc4-4091-8e45-b6aecffd9ab9",
    "email": "ratonxi@gmail.com",
    "name": "Test",
    "avatar": null,
    "bio": null,
    "theme": null,
    "language": null,
    "emailNotifications": true,
    "notificationEmail": "ratonxi@gmail.com",
    "emailFrequency": "immediate",
    "instantNotifications": true,
    "lastLogin": "2025-04-03T07:07:24.288Z",
    "emailVerified": true,
    "subscriptionCount": "11",
    "notificationCount": "0",
    "lastNotification": null
  }
}
```


### Update User Profile
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/me`
- **Method:** `PATCH`
- **Error:** Request failed with status 404
- **Details:** {"message":"Route PATCH:/api/v1/me not found","error":"Not Found","statusCode":404}
- **Duration:** 138ms



### Verify Profile Updates
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/me`
- **Method:** `GET`
- **Error:** Profile update verification failed
- **Details:** Profile does not contain the updated information
- **Duration:** 145ms



### Update Notification Settings
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/me/notification-settings`
- **Method:** `PATCH`
- **Error:** Request failed with status 404
- **Details:** {"message":"Route PATCH:/api/v1/me/notification-settings not found","error":"Not Found","statusCode":404}
- **Duration:** 138ms



### Get Email Preferences
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me/email-preferences`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 149ms
- **Response Data:**
```json
{
  "email_notifications": "true",
  "notification_email": "ratonxi@gmail.com",
  "digest_time": null
}
```


### Update Email Preferences
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me/email-preferences`
- **Method:** `PATCH`

- **Details:** Request successful with status 200
- **Duration:** 139ms



### Verify Email Preferences Update
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/me/email-preferences`
- **Method:** `GET`
- **Error:** Email preferences update verification failed
- **Details:** Email preferences do not contain the updated information
- **Duration:** 142ms



### Send Test Email
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/me/test-email`
- **Method:** `POST`
- **Error:** Request failed with status 500
- **Details:** {"statusCode":500,"code":"SERVER_ERROR","error":"Internal Server Error","message":"Failed to send test email"}
- **Duration:** 511ms



## User Profile Schema


```json
{
  "profile": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatar": null,
    "bio": null,
    "theme": null,
    "language": null,
    "emailNotifications": "boolean",
    "notificationEmail": "string",
    "emailFrequency": "string",
    "instantNotifications": "boolean",
    "lastLogin": "string",
    "emailVerified": "boolean",
    "subscriptionCount": "string",
    "notificationCount": "string",
    "lastNotification": null
  }
}
```


## Email Preferences Schema


```json
{
  "email_notifications": "string",
  "notification_email": "string",
  "digest_time": null
}
```


## Test Environment

- **Backend URL:** backend-415554190254.us-central1.run.app
- **Authentication URL:** authentication-service-415554190254.us-central1.run.app
- **Test Date:** 2025-04-03T10:58:07.817Z

## Next Steps
- Investigate and fix failing endpoints
- Ensure proper error handling for user profile operations
- Verify data consistency across profile update operations

---
Generated 2025-04-03T10:58:07.817Z
