# NIFYA Backend Endpoints Reference

This document provides a comprehensive list of all backend endpoints and how to test them.

## Authentication Service Endpoints

| Endpoint | Method | Description | Required Headers | Request Body | Test Command |
|----------|--------|-------------|-----------------|--------------|--------------|
| `/api/auth/login` | POST | User login | `Content-Type: application/json` | `{"email": "user@email.com", "password": "password"}` | `node tests/auth/login.js` |
| `/api/auth/signup` | POST | User registration | `Content-Type: application/json` | `{"email": "user@email.com", "password": "password", "name": "User Name"}` | N/A |
| `/api/auth/me` | GET | Get current user info | `Authorization: Bearer <token>` | N/A | `node tests/auth/me.js` |
| `/api/auth/refresh` | POST | Refresh auth token | `Authorization: Bearer <token>` | `{"refreshToken": "<refresh_token>"}` | N/A |
| `/api/auth/logout` | POST | User logout | `Authorization: Bearer <token>` | N/A | N/A |
| `/api/auth/verify-email` | POST | Verify email address | `Content-Type: application/json` | `{"token": "<verification_token>"}` | N/A |
| `/api/auth/request-password-reset` | POST | Request password reset | `Content-Type: application/json` | `{"email": "user@email.com"}` | N/A |
| `/api/auth/reset-password` | POST | Reset password | `Content-Type: application/json` | `{"token": "<reset_token>", "newPassword": "newpass"}` | N/A |

## Backend Service Endpoints

### Core Endpoints

| Endpoint | Method | Description | Required Headers | Request Body | Test Command |
|----------|--------|-------------|-----------------|--------------|--------------|
| `/health` | GET | Health check | None | N/A | `node tests/health/health.js` |
| `/api/v1/subscriptions` | GET | List subscriptions | `Authorization`, `x-user-id` | N/A | `node tests/subscriptions/list.js` |
| `/api/v1/subscriptions` | POST | Create subscription | `Authorization`, `x-user-id` | See format below | `node tests/subscriptions/create.js` |
| `/api/v1/subscriptions/:id` | GET | Get subscription by ID | `Authorization`, `x-user-id` | N/A | `node tests/subscriptions/get.js` |
| `/api/v1/subscriptions/:id` | PUT | Update subscription | `Authorization`, `x-user-id` | See format below | N/A |
| `/api/v1/subscriptions/:id` | DELETE | Delete subscription | `Authorization`, `x-user-id` | N/A | N/A |
| `/api/v1/subscriptions/:id/process` | POST | Process subscription | `Authorization`, `x-user-id` | N/A | `node tests/subscriptions/process.js` |
| `/api/v1/subscriptions/:id/status` | GET | Get processing status | `Authorization`, `x-user-id` | N/A | `node tests/subscriptions/status.js` |
| `/api/v1/notifications` | GET | List notifications | `Authorization`, `x-user-id` | N/A | `node tests/notifications/poll.js` |
| `/api/v1/notifications/:id` | GET | Get notification by ID | `Authorization`, `x-user-id` | N/A | N/A |
| `/api/v1/notifications/:id` | PUT | Update notification (e.g. mark as read) | `Authorization`, `x-user-id` | `{"read": true}` | N/A |
| `/api/v1/subscription-types` | GET | List subscription types | `Authorization`, `x-user-id` | N/A | N/A |
| `/api/v1/templates` | GET | List subscription templates | `Authorization`, `x-user-id` | N/A | N/A |

### Diagnostics Endpoints

| Endpoint | Method | Description | Required Headers | Request Body | Test Command |
|----------|--------|-------------|-----------------|--------------|--------------|
| `/api/diagnostics` | GET | Diagnostics API info | `Authorization`, `x-user-id` | N/A | `node tests/admin/diagnose-database.js` |
| `/api/diagnostics/user` | GET | Check user exists | `Authorization`, `x-user-id` | N/A | `node tests/admin/diagnose-database.js` |
| `/api/diagnostics/create-user` | POST | Create test user | `Authorization`, `x-user-id` | `{"userId": "<user_id>", "email": "test@example.com", "name": "Test User"}` | N/A |
| `/api/diagnostics/db-info` | GET | Database information | `Authorization`, `x-user-id` | N/A | `node tests/admin/diagnose-database.js` |

## Email Notification Endpoints

| Endpoint | Method | Description | Required Headers | Request Body | Test Command |
|----------|--------|-------------|-----------------|--------------|--------------|
| `/api/v1/email-preferences` | GET | Get email preferences | `Authorization`, `x-user-id` | N/A | N/A |
| `/api/v1/email-preferences` | PUT | Update email preferences | `Authorization`, `x-user-id` | `{"immediate": boolean, "daily": boolean, "weekly": boolean}` | N/A |

## Request/Response Format Examples

### Subscription Creation Request

```json
{
  "name": "Test BOE Subscription",
  "type": "boe",
  "prompts": [
    "Ayuntamiento Barcelona licitaciones"
  ],
  "frequency": "daily",
  "configuration": "{}"
}
```

### Subscription Update Request

```json
{
  "name": "Updated Subscription Name",
  "prompts": [
    "New prompt value"
  ],
  "frequency": "weekly"
}
```

### Subscription Response Format

```json
{
  "id": "uuid-string",
  "user_id": "user-uuid-string",
  "name": "Subscription Name",
  "type": "boe",
  "prompts": ["Prompt text"],
  "frequency": "daily",
  "configuration": "{}",
  "active": true,
  "created_at": "2025-04-01T12:00:00Z",
  "updated_at": "2025-04-01T12:00:00Z"
}
```

### Notifications Response Format

```json
{
  "notifications": [
    {
      "id": "uuid-string",
      "user_id": "user-uuid-string",
      "subscription_id": "subscription-uuid-string",
      "title": "Notification Title",
      "content": "Notification content text",
      "source_url": "https://example.com/source",
      "read": false,
      "read_at": null,
      "entity_type": "notification:boe",
      "data": {},
      "metadata": {},
      "created_at": "2025-04-01T12:00:00Z",
      "updated_at": "2025-04-01T12:00:00Z"
    }
  ],
  "total": 1,
  "unread": 1,
  "page": 1,
  "limit": 10
}
```

## Testing Notes

1. **Authentication Token**: All secure endpoints require a valid JWT token obtained from the authentication service.

2. **User ID Header**: The `x-user-id` header is required for most endpoints and should match the user ID in the JWT token.

3. **Testing Order**: For a complete test sequence, follow this order:
   - Authentication login
   - Check health endpoint
   - List subscription types
   - Create subscription
   - List subscriptions
   - Process subscription
   - Check subscription status
   - Poll notifications

4. **Error Status Codes**:
   - `400` - Bad request (validation error)
   - `401` - Unauthorized (missing or invalid token)
   - `403` - Forbidden (insufficient permissions)
   - `404` - Not found
   - `500` - Server error

5. **Content Type**: All requests and responses use `application/json` content type.

## Testing All Endpoints

To run tests for all endpoints, use the following command:

```bash
cd /path/to/testing-tools
node run-all-tests.js
```

This will execute tests for all available endpoints and generate a comprehensive report.