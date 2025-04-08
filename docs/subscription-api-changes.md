# Subscription API Standardization

This document describes recent standardization changes made to the subscription API endpoints.

## Changes Implemented

1. **Standardized on PATCH for Updates**
   - Modified the `PUT /api/v1/subscriptions/:id` endpoint to redirect to `PATCH /api/v1/subscriptions/:id` with 308 status code
   - Updated frontend code to use PATCH instead of PUT for subscription updates
   - This aligns with REST API best practices using PATCH for partial updates

2. **Simplified Activation/Deactivation**
   - Removed dedicated activation/deactivation endpoints
   - Replaced with a standard PATCH update using the `active` field
   - Added backward compatibility layer for existing code

3. **Removed Bulk Deletion**
   - Removed the undocumented `DELETE /api/v1/subscriptions/` endpoint
   - All deletions should use the standard `DELETE /api/v1/subscriptions/:id` endpoint

## Current API Endpoints

### Core Subscription Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/subscriptions` | List all subscriptions for authenticated user |
| `POST` | `/api/v1/subscriptions` | Create a new subscription |
| `GET` | `/api/v1/subscriptions/:id` | Get details for a specific subscription |
| `PATCH` | `/api/v1/subscriptions/:id` | Update a subscription (partial update) |
| `DELETE` | `/api/v1/subscriptions/:id` | Delete a specific subscription |

### Processing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/subscriptions/:id/process` | Trigger immediate processing for a subscription |
| `GET` | `/api/v1/subscriptions/:id/status` | Check processing status for a subscription |

## Deprecated Endpoints

The following endpoints are now deprecated and will redirect to their standardized replacements:

| Deprecated Endpoint | Replacement Endpoint |
|---------------------|---------------------|
| `PUT /api/v1/subscriptions/:id` | `PATCH /api/v1/subscriptions/:id` |
| `PATCH /api/v1/subscriptions/:id/activate` | `PATCH /api/v1/subscriptions/:id` with `{ "active": true }` |
| `PATCH /api/v1/subscriptions/:id/deactivate` | `PATCH /api/v1/subscriptions/:id` with `{ "active": false }` |
| `DELETE /api/v1/subscriptions/` | No direct replacement (use individual deletion) |

## Client Code Changes

Frontend code has been updated to use the standardized endpoints:

```typescript
// Update a subscription (now uses PATCH)
subscriptionService.update(id, { name: "New name" });

// Activate a subscription (uses the toggle method which calls PATCH)
subscriptionService.toggle(id, true);

// Deactivate a subscription (uses the toggle method which calls PATCH)
subscriptionService.toggle(id, false);
```

The original `activate()` and `deactivate()` methods are kept for backward compatibility but now log deprecation warnings and call the new `toggle()` method internally.

## Benefits

1. **Consistent API Design**: Follows REST conventions more closely
2. **Simplified Codebase**: Removes redundant endpoints and consolidates logic
3. **Better Maintainability**: Fewer endpoints and code paths to maintain
4. **Improved Type Safety**: With standardized request/response schemas 