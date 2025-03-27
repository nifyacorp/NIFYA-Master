# BOE Notification Pipeline Fixes

This document summarizes the fixes implemented for the BOE Notification Pipeline to address multiple issues discovered during testing.

## Issue Summary

The BOE notification pipeline was failing with several errors:

1. **API Versioning Errors**: The API clients were using outdated endpoints without the `/v1/` prefix
2. **Missing User ID Header**: The v1 API endpoints require a `x-user-id` header 
3. **Subscription Processing Error**: The subscription processing endpoint returned a 500 error with message "Cannot read properties of undefined (reading 'match')"
4. **PubSub Message Schema Mismatch**: The notification worker was failing with "Invalid message format: missing or invalid matches array" due to incompatible message formats between BOE Parser and Notification Worker
5. **Missing Dead Letter Queue (DLQ)**: The DLQ topic for error handling didn't exist

## Implemented Fixes

### 1. API Client Fixes

Updated the API client (`api-client.js`) with:
- Better path sanitization to prevent malformed requests
- Automatic v1 API path detection and correction
- Enhanced error handling with try/catch blocks
- Improved logging for debugging
- Automatic extraction of user ID from JWT token for the required header

### 2. Subscription Processing Fix

Fixed the subscription processing script (`process-subscription-v1.js`) with:
- UUID formatting to prevent match errors
- Added proper request payload
- Enhanced error logging and debugging
- Fixed API path to use v1 endpoint

### 3. Message Schema Compatibility

Enhanced the BOE processor in the notification worker (`notification-worker/src/processors/boe.js`) with:
- Robust schema validation and recovery
- Support for multiple message formats for backward compatibility
- Fallback defaults for missing fields
- Detailed logging for schema mismatch issues
- Defensive programming to handle undefined values

### 4. DLQ Topic Creation

Added a script to create the missing DLQ topics:
- `notification-worker/create-dlq.sh` creates both required DLQ topics:
  - `notification-dlq` for the notification worker
  - `processor-results-dlq` for the BOE parser
- Added monitoring subscriptions for the DLQ topics

### 5. Documentation

Created comprehensive documentation:
- `docs/pubsub-structure.md` defines standardized message formats
- Added backward compatibility guidance
- Documented DLQ usage
- Provided testing instructions

## How to Verify the Fixes

### 1. Test the API Client

Run the updated scripts:
```bash
# First authenticate
node auth-login.js

# Process a subscription
node process-subscription-v1.js

# Poll for notifications
node poll-notifications-v1.js
```

### 2. Create the DLQ Topics

Run the DLQ creation script:
```bash
cd notification-worker
./create-dlq.sh
```

### 3. Monitor Error Handling

Check logs after processing to verify:
- No "Cannot read properties of undefined (reading 'match')" errors
- No "Invalid message format: missing or invalid matches array" errors
- Successful message handling with schema compatibility

## Next Steps

After implementing these fixes, we should:

1. **Monitor DLQ Topics**: Check for any messages landing in the DLQ
2. **Update Schema Documentation**: Maintain pubsub-structure.md as a single source of truth
3. **Implement Monitoring**: Add metrics for message processing success/failure rates
4. **Test End-to-End**: Run user journey test to confirm the entire notification pipeline works

## Conclusion

The notification pipeline issues were primarily caused by:
1. API versioning changes without client updates
2. Message schema mismatches between services
3. Missing infrastructure (DLQ topics)
4. Insufficient error handling

By addressing these issues with both client and server-side fixes, we've dramatically improved the reliability of the notification pipeline, ensuring that subscriptions are processed correctly and notifications are delivered to users.