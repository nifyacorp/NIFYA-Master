# User Profile Management API Test Results

**Test Time:** 2025-04-03T12:52:26.865Z
**Overall Status:** ❌ FAILED
**Success Rate:** 75.00%

## Test Summary

| Test | Status | Details |
|------|--------|---------|
| authentication | ✅ PASSED | Successfully authenticated user |
| Get User Profile | ✅ PASSED | Request successful with status 200 |
| Update User Profile | ✅ PASSED | Request successful with status 200 |
| Verify Profile Updates | ❌ FAILED | Profile does not contain the updated information |
| Update Notification Settings | ✅ PASSED | Request successful with status 200 |
| Get Email Preferences | ✅ PASSED | Request successful with status 200 |
| Update Email Preferences | ✅ PASSED | Request successful with status 200 |
| Verify Email Preferences Update | ❌ FAILED | Email preferences do not contain the updated information |
| Send Test Email | ✅ PASSED | Request successful with status 200 |

## Detailed Results


### authentication
- **Status:** ✅ PASSED
- **Endpoint:** `https://authentication-service-415554190254.us-central1.run.app/api/auth/login`
- **Method:** `POST`

- **Details:** Successfully authenticated user
- **Duration:** 377ms



### Get User Profile
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 223ms
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
    "lastLogin": "2025-04-03T12:51:11.245Z",
    "emailVerified": true,
    "subscriptionCount": "15",
    "notificationCount": "0",
    "lastNotification": null
  }
}
```


### Update User Profile
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me`
- **Method:** `PATCH`

- **Details:** Request successful with status 200
- **Duration:** 177ms



### Verify Profile Updates
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/me`
- **Method:** `GET`
- **Error:** Profile update verification failed
- **Details:** Profile does not contain the updated information
- **Duration:** 160ms



### Update Notification Settings
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me/notification-settings`
- **Method:** `PATCH`

- **Details:** Request successful with status 200
- **Duration:** 170ms



### Get Email Preferences
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me/email-preferences`
- **Method:** `GET`

- **Details:** Request successful with status 200
- **Duration:** 154ms
- **Response Data:**
```json
{
  "email_notifications": true,
  "notification_email": null,
  "digest_time": "08:00:00"
}
```


### Update Email Preferences
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me/email-preferences`
- **Method:** `PATCH`

- **Details:** Request successful with status 200
- **Duration:** 240ms



### Verify Email Preferences Update
- **Status:** ❌ FAILED
- **Endpoint:** `/api/v1/me/email-preferences`
- **Method:** `GET`
- **Error:** Email preferences update verification failed
- **Details:** Email preferences do not contain the updated information
- **Duration:** 150ms



### Send Test Email
- **Status:** ✅ PASSED
- **Endpoint:** `/api/v1/me/test-email`
- **Method:** `POST`

- **Details:** Request successful with status 200
- **Duration:** 206ms



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
  "email_notifications": "boolean",
  "notification_email": null,
  "digest_time": "string"
}
```


## Test Environment

- **Backend URL:** backend-415554190254.us-central1.run.app
- **Authentication URL:** authentication-service-415554190254.us-central1.run.app
- **Test Date:** 2025-04-03T12:52:26.865Z

## Next Steps
- Investigate and fix failing endpoints
- Ensure proper error handling for user profile operations
- Verify data consistency across profile update operations

---
Generated 2025-04-03T12:52:26.865Z
