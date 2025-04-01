# Notification Format Standardization

This document outlines the changes made to standardize the notification format between backend and frontend components, addressing several identified discrepancies.

## Identified Issues

1. **Field Normalization**: The frontend had extensive normalization logic to handle inconsistencies in the backend response.
2. **Entity Type Field**: The backend needed a more consistent approach to add an `entity_type` field expected by the frontend.
3. **Title Extraction**: Complex logic on both ends to extract titles from various fields indicated inconsistency.
4. **Response Structure**: Inconsistency in response structure between backend and frontend.
5. **Field Name Differences**: Snake_case vs. camelCase field naming inconsistencies.
6. **Content Parsing**: Inconsistent content format (string vs. object).
7. **Missing Fields**: Frontend expected fields like `sourceUrl` not consistently provided.

## Solutions Implemented

### 1. Standardized `normalizeNotification` function

The notification normalizer function in `backend/utils/notification-helper.js` has been updated to:
- Return a standardized notification object exactly matching frontend expectations
- Handle both camelCase and snake_case field variants
- Ensure all required fields are present
- Support consistent error handling with fallbacks

### 2. Updated Notification Routes

The notification endpoints in `backend/routes/notifications.js` have been improved to:
- Return data in exactly the format expected by frontend
- Support page-based and offset-based pagination
- Handle both `unread` and `includeRead` filter parameters
- Support subscription filtering
- Return consistent error responses that won't break frontend rendering

### 3. Enhanced Service Layer

The notification service in `backend/services/notification-service.js` has been updated to:
- Centralize all notification normalization through one function
- Handle subscription filtering consistently
- Improve error handling to avoid propagating errors to the frontend
- Standardize documentation for better clarity

### 4. Realtime Notification Standardization

The realtime notification delivery in `backend/services/notification-service.js` now:
- Uses the same normalizeNotification function for websocket messages
- Ensures consistent format between REST API and websocket notifications
- Includes all fields expected by the frontend

## Benefits

- **Reduced Frontend Complexity**: By standardizing the backend, the frontend's extensive normalization code could potentially be simplified
- **Improved Reliability**: Consistent field naming and structures prevent data-related errors
- **Better Maintainability**: Centralized normalization logic is easier to update
- **Enhanced Documentation**: Added extensive documentation for future developers

## Next Steps

1. Consider simplifying the frontend's normalization logic since the backend now provides standardized data
2. Add unit tests to verify the notification format matches expectations
3. Monitor error rates to ensure the fixes are effective