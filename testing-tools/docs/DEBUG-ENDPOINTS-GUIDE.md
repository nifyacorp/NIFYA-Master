# Debug Endpoints Guide

This document provides information about the debug endpoints available in the NIFYA backend services. These endpoints are valuable for troubleshooting issues that occur during testing or in production.

## Debug Endpoints Overview

The backend provides several debug endpoints that can be used to inspect the state of subscriptions, notifications, and the overall system health. These endpoints are particularly useful when automated tests fail or when investigating user-reported issues.

## Available Debug Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/debug/health` | GET | Returns detailed health information about the backend | No |
| `/debug/subscription/{id}` | GET | Returns detailed information about a subscription, including processing history | Yes |
| `/debug/notification/{id}` | GET | Returns detailed information about a notification, including delivery attempts | Yes |
| `/debug/notification/{id}/resend` | POST | Forces a notification to be resent | Yes |

## How to Use Debug Endpoints

### In Testing Tools

Our testing tools are configured to automatically call debug endpoints when errors occur. For example, if a subscription creation fails, the enhanced user journey test will automatically call the subscription debug endpoint to gather more information about the failure.

```javascript
// Example: Getting debug information for a subscription
async function getSubscriptionDebugInfo(subscriptionId, token) {
  const options = {
    hostname: endpoints.backend.baseUrl,
    path: endpoints.backend.debug.subscription(subscriptionId),
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const response = await apiClient.makeApiRequest(options, token);
  // Process and save debug info
}
```

### Manual Debugging

You can also call these endpoints manually using tools like cURL or Postman:

```bash
# Example: Get debug information for a subscription
curl -X GET "https://backend-415554190254.us-central1.run.app/debug/subscription/your-subscription-id" \
  -H "Authorization: Bearer your-auth-token" \
  -H "x-user-id: your-user-id"

# Example: Force a notification to be resent
curl -X POST "https://backend-415554190254.us-central1.run.app/debug/notification/your-notification-id/resend" \
  -H "Authorization: Bearer your-auth-token" \
  -H "x-user-id: your-user-id"
```

## Example Debug Output

### Subscription Debug Example

```json
{
  "status": "success",
  "data": {
    "subscription": {
      "id": "subscription-id",
      "name": "Test Subscription",
      "type": "boe",
      "created_at": "2025-04-02T08:45:12Z",
      "updated_at": "2025-04-02T09:15:30Z",
      "active": true,
      "user_id": "user-id",
      "processing_history": [
        {
          "job_id": "job-id-1",
          "status": "completed",
          "started_at": "2025-04-02T08:50:23Z",
          "completed_at": "2025-04-02T08:55:17Z",
          "results_count": 3
        }
      ],
      "configuration": {
        "frequency": "daily",
        "prompts": ["test prompt"]
      }
    },
    "processing_jobs": [
      {
        "id": "job-id-1",
        "status": "completed",
        "notifications_created": 3,
        "errors": null
      }
    ],
    "related_notifications": [
      {
        "id": "notification-id-1",
        "created_at": "2025-04-02T08:55:17Z", 
        "read": false
      }
    ]
  }
}
```

### Notification Debug Example

```json
{
  "status": "success",
  "data": {
    "notification": {
      "id": "notification-id-1",
      "title": "New Result Found",
      "message": "A new result was found for your subscription",
      "created_at": "2025-04-02T08:55:17Z",
      "subscription_id": "subscription-id",
      "user_id": "user-id",
      "read": false,
      "read_at": null,
      "delivery_attempts": [
        {
          "timestamp": "2025-04-02T08:55:18Z",
          "success": true,
          "channel": "in_app"
        },
        {
          "timestamp": "2025-04-02T08:55:19Z",
          "success": true,
          "channel": "email"
        }
      ]
    },
    "related_subscription": {
      "id": "subscription-id",
      "name": "Test Subscription",
      "type": "boe"
    }
  }
}
```

## Best Practices for Using Debug Endpoints

1. **Always log debug information**: When automated tests fail, collect and log debug information to help diagnose the issue.

2. **Check debug endpoints first**: When investigating a user-reported issue, check the debug endpoints first to get detailed information about the relevant subscription or notification.

3. **Include debug information in bug reports**: When reporting bugs, include the output from relevant debug endpoints to provide context and help with troubleshooting.

4. **Monitor errors in debug output**: Debug endpoints can reveal internal errors or issues that might not be immediately apparent from the standard API endpoints.

5. **Use debug data to reproduce issues**: Debug data can help you reproduce issues in development or staging environments.

## Adding New Debug Endpoints

If you find that additional debug information would be helpful, discuss with the backend team about adding new debug endpoints or enhancing existing ones. Debug endpoints should be designed to provide as much context as possible about the state of the system and the specific entity being debugged.

---

*Note: Debug endpoints are designed for development, testing, and troubleshooting purposes only. They may expose internal details of the system that are not meant for end users. Access to these endpoints should be appropriately restricted in production environments.*