# NIFYA Admin API Documentation

This document provides detailed information about the admin endpoints available in the NIFYA application backend.

## Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Dashboard](#dashboard)
  - [Get Dashboard Statistics](#get-dashboard-statistics)
  - [Get Recent Activity](#get-recent-activity)
- [User Management](#user-management)
  - [Get Users List](#get-users-list)
  - [Get User Details](#get-user-details)
  - [Set User Status](#set-user-status)
  - [Set User Role](#set-user-role)
  - [Reset User Password](#reset-user-password)
  - [Search Users](#search-users)
- [Subscription Types](#subscription-types)
  - [Get Subscription Types](#get-subscription-types)
  - [Get Subscription Type Details](#get-subscription-type-details)
  - [Create Subscription Type](#create-subscription-type)
  - [Update Subscription Type](#update-subscription-type)
  - [Delete Subscription Type](#delete-subscription-type)
- [Subscriptions](#subscriptions)
  - [Get Subscriptions List](#get-subscriptions-list)
  - [Get Subscription Details](#get-subscription-details)
  - [Set Subscription Status](#set-subscription-status)
  - [Delete Subscription](#delete-subscription)
  - [Generate Subscription Report](#generate-subscription-report)
- [Notifications](#notifications)
  - [Get Notifications List](#get-notifications-list)
  - [Get Notification Details](#get-notification-details)
  - [Resend Notification Email](#resend-notification-email)
  - [Delete Notification](#delete-notification)
  - [Send Test Notification](#send-test-notification)

## Authentication

All admin endpoints require authentication with admin privileges. This is enforced by two middleware layers:

1. `firebaseAuthenticate` middleware - Validates the Firebase authentication token
2. `adminAuthMiddleware` - Checks if the authenticated user has admin role in the database

To access admin endpoints, include a valid Firebase authentication token in the Authorization header:

```
Authorization: Bearer your-firebase-token
```

Only users with the `admin` role in the database can access these endpoints.

## Error Handling

All admin endpoints follow a consistent error handling pattern. Error responses include:

- `error`: Error type or name
- `message`: Human-readable error message
- `statusCode`: HTTP status code
- `instructions`: Helpful instructions for resolving the error
- `timestamp`: ISO timestamp when the error occurred
- `path`: The request URL path

Example error response:

```json
{
  "error": "FORBIDDEN",
  "message": "Admin access required",
  "statusCode": 403,
  "instructions": "You do not have permission to access this resource. Admin access is required.",
  "timestamp": "2023-04-01T12:34:56.789Z",
  "path": "/api/v1/admin/users"
}
```

## Dashboard

### Get Dashboard Statistics

Get statistics for the admin dashboard including user, subscription, and notification data.

**Endpoint:** `GET /api/v1/admin/dashboard/stats`

**Response:**

```json
{
  "users": {
    "total_users": 150,
    "regular_users": 145,
    "admin_users": 5,
    "new_users_last_7_days": 12,
    "new_users_last_30_days": 35
  },
  "subscriptions": {
    "total_subscriptions": 210,
    "active_subscriptions": 180,
    "inactive_subscriptions": 30,
    "subscription_type_counts": {
      "boe": 85,
      "doga": 45,
      "eu": 80
    }
  },
  "notifications": {
    "total_notifications": 1250,
    "unread_notifications": 450,
    "read_notifications": 800,
    "email_sent_notifications": 950,
    "notifications_last_7_days": 320
  },
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Get Recent Activity

Get recent system activity for the admin dashboard.

**Endpoint:** `GET /api/v1/admin/dashboard/activity`

**Query Parameters:**
- `limit` (integer, optional): Number of activities to return (default: 10, max: 100)
- `offset` (integer, optional): Offset for pagination (default: 0)

**Response:**

```json
{
  "activities": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "action": "User Login",
      "user_id": "user123",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "entity_type": "authentication",
      "entity_name": null,
      "created_at": "2023-04-01T12:34:56.789Z",
      "details": {
        "method": "email",
        "ip": "192.168.1.1"
      }
    },
    // More activities...
  ],
  "pagination": {
    "total": 1250,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

## User Management

### Get Users List

Get a paginated list of all users in the system.

**Endpoint:** `GET /api/v1/admin/users`

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Users per page (default: 20, max: 100)
- `sort_by` (string, optional): Field to sort by (default: "created_at", options: "display_name", "email", "created_at", "role")
- `sort_order` (string, optional): Sort direction (default: "desc", options: "asc", "desc")

**Response:**

```json
{
  "users": [
    {
      "id": "user123",
      "display_name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "avatar_url": "https://example.com/avatars/john.jpg",
      "created_at": "2023-03-15T10:30:00.000Z",
      "updated_at": "2023-03-15T10:30:00.000Z",
      "subscription_count": 3,
      "notification_count": 25
    },
    // More users...
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### Get User Details

Get detailed information for a specific user.

**Endpoint:** `GET /api/v1/admin/users/:id`

**Path Parameters:**
- `id` (string, required): User ID

**Response:**

```json
{
  "user": {
    "id": "user123",
    "display_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar_url": "https://example.com/avatars/john.jpg",
    "created_at": "2023-03-15T10:30:00.000Z",
    "updated_at": "2023-03-15T10:30:00.000Z",
    "profile": {
      "bio": "I'm interested in legal matters",
      "interests": ["taxation", "regulations", "legislation"]
    },
    "preferences": {
      "language": "es",
      "theme": "light"
    },
    "notifications": {
      "email": {
        "enabled": true,
        "useCustomEmail": false,
        "customEmail": null,
        "digestTime": "08:00"
      }
    },
    "subscriptions": [
      {
        "id": "sub456",
        "name": "BOE Tax Alerts",
        "type_id": "boe",
        "type_name": "Boletín Oficial del Estado",
        "active": true,
        "created_at": "2023-03-16T09:15:00.000Z"
      },
      // More subscriptions...
    ]
  }
}
```

### Set User Status

Activate or deactivate a user account.

**Endpoint:** `POST /api/v1/admin/users/:id/set-status`

**Path Parameters:**
- `id` (string, required): User ID

**Request Body:**
```json
{
  "status": "active" // or "inactive"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User user123 has been activated",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Set User Role

Change a user's role (e.g., promote to admin or demote to regular user).

**Endpoint:** `POST /api/v1/admin/users/:id/set-role`

**Path Parameters:**
- `id` (string, required): User ID

**Request Body:**
```json
{
  "role": "admin" // or "user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User user123 role changed to admin",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Reset User Password

Generate a password reset link for a user.

**Endpoint:** `POST /api/v1/admin/users/:id/reset-password`

**Path Parameters:**
- `id` (string, required): User ID

**Response:**

```json
{
  "success": true,
  "message": "Password reset link generated for user user123",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Search Users

Search for users by name or email.

**Endpoint:** `GET /api/v1/admin/users/search`

**Query Parameters:**
- `term` (string, required): Search term (minimum 2 characters)
- `field` (string, optional): Field to search in (default: "both", options: "display_name", "email", "both")
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Users per page (default: 20, max: 100)

**Response:**

```json
{
  "users": [
    {
      "id": "user123",
      "display_name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "created_at": "2023-03-15T10:30:00.000Z"
    },
    // More users...
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

## Subscription Types

### Get Subscription Types

Get a list of all subscription types in the system.

**Endpoint:** `GET /api/v1/admin/subscription-types`

**Response:**

```json
{
  "subscription_types": [
    {
      "id": "boe",
      "name": "boe",
      "display_name": "Boletín Oficial del Estado",
      "description": "Official bulletin of the Spanish state",
      "icon": "government-building",
      "parser_url": "https://boe-parser-415554190254.us-central1.run.app",
      "logo_url": "https://example.com/logos/boe.png",
      "is_system": true,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "subscription_count": 85
    },
    // More subscription types...
  ]
}
```

### Get Subscription Type Details

Get detailed information for a specific subscription type.

**Endpoint:** `GET /api/v1/admin/subscription-types/:id`

**Path Parameters:**
- `id` (string, required): Subscription type ID

**Response:**

```json
{
  "subscription_type": {
    "id": "boe",
    "name": "boe",
    "display_name": "Boletín Oficial del Estado",
    "description": "Official bulletin of the Spanish state",
    "icon": "government-building",
    "parser_url": "https://boe-parser-415554190254.us-central1.run.app",
    "logo_url": "https://example.com/logos/boe.png",
    "is_system": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "metadata": {
      "country": "Spain",
      "language": "es",
      "frequency": "daily"
    },
    "subscription_count": 85
  }
}
```

### Create Subscription Type

Create a new subscription type.

**Endpoint:** `POST /api/v1/admin/subscription-types`

**Request Body:**
```json
{
  "name": "new-type",
  "display_name": "New Subscription Type",
  "description": "Description of the new subscription type",
  "icon": "custom-icon",
  "parser_url": "https://custom-parser.example.com",
  "logo_url": "https://example.com/logos/custom.png",
  "is_system": false,
  "metadata": {
    "country": "Global",
    "language": "en",
    "frequency": "weekly"
  }
}
```

**Required fields:** `name`, `display_name`

**Response:**

```json
{
  "subscription_type": {
    "id": "new-type-id",
    "name": "new-type",
    "display_name": "New Subscription Type",
    "created_at": "2023-04-01T12:34:56.789Z"
  },
  "message": "Subscription type created successfully"
}
```

### Update Subscription Type

Update an existing subscription type.

**Endpoint:** `PUT /api/v1/admin/subscription-types/:id`

**Path Parameters:**
- `id` (string, required): Subscription type ID

**Request Body:**
```json
{
  "display_name": "Updated Subscription Type",
  "description": "Updated description",
  "icon": "updated-icon",
  "parser_url": "https://updated-parser.example.com",
  "logo_url": "https://example.com/logos/updated.png",
  "is_system": false,
  "metadata": {
    "country": "Global",
    "language": "en",
    "frequency": "daily"
  }
}
```

**Note:** You only need to include the fields you want to update.

**Response:**

```json
{
  "success": true,
  "message": "Subscription type updated successfully"
}
```

### Delete Subscription Type

Delete a subscription type.

**Endpoint:** `DELETE /api/v1/admin/subscription-types/:id`

**Path Parameters:**
- `id` (string, required): Subscription type ID

**Response:**

```json
{
  "success": true,
  "message": "Subscription type deleted successfully",
  "affected_subscriptions": 3
}
```

**Note:** Cannot delete system subscription types (where `is_system` is `true`).

## Subscriptions

### Get Subscriptions List

Get a paginated list of all subscriptions in the system.

**Endpoint:** `GET /api/v1/admin/subscriptions`

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Subscriptions per page (default: 20, max: 100)
- `sort_by` (string, optional): Field to sort by (default: "created_at", options: "created_at", "name", "active")
- `sort_order` (string, optional): Sort direction (default: "desc", options: "asc", "desc")
- `type_id` (string, optional): Filter by subscription type ID
- `active` (boolean, optional): Filter by active status

**Response:**

```json
{
  "subscriptions": [
    {
      "id": "sub456",
      "name": "BOE Tax Alerts",
      "description": "Tax regulations from BOE",
      "user_id": "user123",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "type_id": "boe",
      "type_name": "Boletín Oficial del Estado",
      "active": true,
      "created_at": "2023-03-16T09:15:00.000Z",
      "updated_at": "2023-03-16T09:15:00.000Z"
    },
    // More subscriptions...
  ],
  "pagination": {
    "total": 210,
    "page": 1,
    "limit": 20,
    "pages": 11,
    "has_next": true,
    "has_prev": false
  }
}
```

### Get Subscription Details

Get detailed information for a specific subscription.

**Endpoint:** `GET /api/v1/admin/subscriptions/:id`

**Path Parameters:**
- `id` (string, required): Subscription ID

**Response:**

```json
{
  "subscription": {
    "id": "sub456",
    "name": "BOE Tax Alerts",
    "description": "Tax regulations from BOE",
    "user_id": "user123",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "type_id": "boe",
    "type_name": "Boletín Oficial del Estado",
    "prompts": [
      {
        "text": "Tax regulations",
        "importance": 0.8
      },
      {
        "text": "Corporate tax",
        "importance": 0.6
      }
    ],
    "frequency": "daily",
    "active": true,
    "created_at": "2023-03-16T09:15:00.000Z",
    "updated_at": "2023-03-16T09:15:00.000Z",
    "metadata": {
      "last_processed": "2023-04-01T00:00:00.000Z",
      "setup_complete": true
    },
    "notification_count": 15,
    "recent_notifications": [
      {
        "id": "notif789",
        "title": "New Tax Regulation Found",
        "created_at": "2023-04-01T10:20:00.000Z",
        "read": false
      },
      // More notifications...
    ]
  }
}
```

### Set Subscription Status

Activate or deactivate a subscription.

**Endpoint:** `PUT /api/v1/admin/subscriptions/:id/set-status`

**Path Parameters:**
- `id` (string, required): Subscription ID

**Request Body:**
```json
{
  "active": true // or false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription sub456 has been activated",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Delete Subscription

Delete a subscription.

**Endpoint:** `DELETE /api/v1/admin/subscriptions/:id`

**Path Parameters:**
- `id` (string, required): Subscription ID

**Response:**

```json
{
  "success": true,
  "message": "Subscription deleted successfully",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Generate Subscription Report

Generate a report of subscriptions with filtering options.

**Endpoint:** `GET /api/v1/admin/subscriptions/report`

**Query Parameters:**
- `format` (string, optional): Output format (default: "json", options: "json", "csv")
- `type_id` (string, optional): Filter by subscription type ID
- `active` (boolean, optional): Filter by active status
- `start_date` (string, optional): Filter by created date (format: YYYY-MM-DD)
- `end_date` (string, optional): Filter by created date (format: YYYY-MM-DD)

**Response (JSON format):**

```json
{
  "subscriptions": [
    {
      "id": "sub456",
      "name": "BOE Tax Alerts",
      "description": "Tax regulations from BOE",
      "user_id": "user123",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "type_id": "boe",
      "type_name": "Boletín Oficial del Estado",
      "frequency": "daily",
      "active": true,
      "created_at": "2023-03-16T09:15:00.000Z",
      "updated_at": "2023-03-16T09:15:00.000Z",
      "notification_count": 15
    },
    // More subscriptions...
  ],
  "total": 85,
  "timestamp": "2023-04-01T12:34:56.789Z",
  "filters": {
    "type_id": "boe",
    "active": true,
    "start_date": "2023-01-01",
    "end_date": "2023-04-01"
  }
}
```

**Response (CSV format):**

```
id,name,user_name,user_email,type_name,frequency,active,created_at,notification_count
sub456,"BOE Tax Alerts","John Doe","john@example.com","Boletín Oficial del Estado",daily,true,2023-03-16T09:15:00.000Z,15
...
```

## Notifications

### Get Notifications List

Get a paginated list of all notifications in the system.

**Endpoint:** `GET /api/v1/admin/notifications`

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Notifications per page (default: 20, max: 100)
- `sort_by` (string, optional): Field to sort by (default: "created_at", options: "created_at", "read", "email_sent")
- `sort_order` (string, optional): Sort direction (default: "desc", options: "asc", "desc")

**Response:**

```json
{
  "notifications": [
    {
      "id": "notif789",
      "user_id": "user123",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "subscription_id": "sub456",
      "subscription_name": "BOE Tax Alerts",
      "title": "New Tax Regulation Found",
      "content": "A new tax regulation has been published in the BOE...",
      "read": false,
      "read_at": null,
      "entity_type": "boe:regulation",
      "source": "boe",
      "email_sent": true,
      "email_sent_at": "2023-04-01T10:25:00.000Z",
      "created_at": "2023-04-01T10:20:00.000Z"
    },
    // More notifications...
  ],
  "pagination": {
    "total": 1250,
    "page": 1,
    "limit": 20,
    "pages": 63,
    "has_next": true,
    "has_prev": false
  }
}
```

### Get Notification Details

Get detailed information for a specific notification.

**Endpoint:** `GET /api/v1/admin/notifications/:id`

**Path Parameters:**
- `id` (string, required): Notification ID

**Response:**

```json
{
  "notification": {
    "id": "notif789",
    "user_id": "user123",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "subscription_id": "sub456",
    "subscription_name": "BOE Tax Alerts",
    "title": "New Tax Regulation Found",
    "content": "A new tax regulation has been published in the BOE...",
    "source_url": "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-12345",
    "read": false,
    "read_at": null,
    "entity_type": "boe:regulation",
    "source": "boe",
    "data": {
      "regulation_id": "BOE-A-2023-12345",
      "publication_date": "2023-04-01",
      "section": "Tax",
      "summary": "This regulation updates corporate tax rates..."
    },
    "metadata": {
      "matched_keywords": ["tax rate", "corporate", "fiscal"],
      "relevance_score": 0.85
    },
    "email_sent": true,
    "email_sent_at": "2023-04-01T10:25:00.000Z",
    "created_at": "2023-04-01T10:20:00.000Z",
    "updated_at": "2023-04-01T10:20:00.000Z"
  }
}
```

### Resend Notification Email

Resend an email for a specific notification.

**Endpoint:** `POST /api/v1/admin/notifications/:id/resend`

**Path Parameters:**
- `id` (string, required): Notification ID

**Response:**

```json
{
  "success": true,
  "message": "Notification queued for email resend",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Delete Notification

Delete a notification.

**Endpoint:** `DELETE /api/v1/admin/notifications/:id`

**Path Parameters:**
- `id` (string, required): Notification ID

**Response:**

```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

### Send Test Notification

Send a test notification to a user.

**Endpoint:** `POST /api/v1/admin/notifications/test`

**Request Body:**
```json
{
  "user_id": "user123",
  "title": "Test Notification",
  "content": "This is a test notification sent by an admin",
  "send_email": true
}
```

**Response:**

```json
{
  "notification_id": "notif999",
  "message": "Test notification created and queued for email delivery",
  "timestamp": "2023-04-01T12:34:56.789Z"
}
``` 