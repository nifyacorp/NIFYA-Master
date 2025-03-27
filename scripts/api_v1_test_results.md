# NIFYA API v1 Endpoint Test Results

Test run: 2025-03-27T09:41:06.724Z

## GET /api/subscriptions

**Description:** Original subscriptions endpoint

**Status Code:** 301

**Redirect Location:** /api/v1/subscriptions

**Response:**
```json
{
  "raw": ""
}
```

---

## GET /api/notifications

**Description:** Original notifications endpoint

**Status Code:** 404

**Response:**
```json
{
  "message": "Route GET:/api/notifications not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## GET /api/v1/subscriptions

**Description:** v1 subscriptions endpoint

**Status Code:** 401

**Response:**
```json
{
  "error": "MISSING_HEADERS",
  "message": "Missing required headers",
  "status": 401,
  "details": {
    "missingToken": false,
    "missingUserId": true
  },
  "timestamp": "2025-03-27T09:42:16.998Z"
}
```

---

## GET /api/v1/notifications

**Description:** v1 notifications endpoint

**Status Code:** 401

**Response:**
```json
{
  "error": "MISSING_HEADERS",
  "message": "Missing required headers",
  "status": 401,
  "details": {
    "missingToken": false,
    "missingUserId": true
  },
  "timestamp": "2025-03-27T09:42:17.167Z"
}
```

---

## GET /v1/api/subscriptions

**Description:** Alternative v1 path

**Status Code:** 404

**Response:**
```json
{
  "message": "Route GET:/v1/api/subscriptions not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## GET /v1/subscriptions

**Description:** Alternative v1 path without /api

**Status Code:** 404

**Response:**
```json
{
  "message": "Route GET:/v1/subscriptions not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## POST /api/subscriptions/bbcde7bb-bc04-4a0b-8c47-01682a31cc15/process

**Description:** Original subscription process endpoint

**Status Code:** 308

**Redirect Location:** /api/v1/subscriptions/bbcde7bb-bc04-4a0b-8c47-01682a31cc15/process

**Response:**
```json
{
  "raw": ""
}
```

---

## POST /api/v1/subscriptions/bbcde7bb-bc04-4a0b-8c47-01682a31cc15/process

**Description:** v1 subscription process endpoint

**Status Code:** 401

**Response:**
```json
{
  "error": "MISSING_HEADERS",
  "message": "Missing required headers",
  "status": 401,
  "details": {
    "missingToken": false,
    "missingUserId": true
  },
  "timestamp": "2025-03-27T09:42:17.760Z"
}
```

---

## GET /health

**Description:** Health check endpoint

**Status Code:** 200

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-03-27T09:42:17.906Z",
  "uptime": 439.980116449,
  "version": {
    "package": "1.0.0",
    "buildTimestamp": "$(date",
    "commitSha": "unknown",
    "environment": "production"
  },
  "memory": {
    "rss": 149049344,
    "heapTotal": 38318080,
    "heapUsed": 35934656,
    "external": 3687780,
    "arrayBuffers": 126064
  },
  "services": {
    "database": "connected"
  }
}
```

---

## GET /api/health

**Description:** API health check endpoint

**Status Code:** 404

**Response:**
```json
{
  "message": "Route GET:/api/health not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## Summary

Based on the test results above, the following observations can be made:

1. The backend API appears to have implemented API versioning with a `/v1/` prefix
2. Original paths without the version prefix return redirects or 404 errors
3. The correct paths for the API endpoints need to be updated in test scripts

