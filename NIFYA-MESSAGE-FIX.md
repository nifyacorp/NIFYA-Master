# NIFYA PubSub Message Format Fix

## Issue Summary

The notification worker was failing to process messages from the BOE parser due to a message structure mismatch:

```
Invalid message format: missing or invalid matches array
```

## Root Cause Analysis

1. The BOE parser was sending messages with this structure:
```json
"results": {
  "query_date": "2025-03-26",
  "boe_info": {...},
  "results": [
    {
      "prompt": "quiero ser funcionario",
      "matches": []
    }
  ]
}
```

2. The notification worker expected this structure:
```json
"results": {
  "query_date": "2025-03-26",
  "matches": [
    {
      "prompt": "quiero ser funcionario",
      "documents": []
    }
  ]
}
```

3. The validation error occurred because:
   - BOE parser put matches in `results.results[0].matches`
   - Notification worker expected matches in `results.matches`
   - The notification worker schema in `notification-worker/src/types/boe.js` specifically requires `results.matches`

## Solution Implemented

1. Updated `boe-parser/src/utils/pubsub.js` to produce messages in the exact format expected by the notification worker:
   - Changed the structure to put matches directly in `results.matches`
   - Ensure each match has a `documents` array as required by the schema
   - Added appropriate BOE-specific fields to each document

2. Created comprehensive documentation for the message schema:
   - Added `/docs/pubsub-structure.md` with detailed schema description
   - Added examples for successful and error messages
   - Included TypeScript-like schemas for each component

3. Updated READMEs to reference the new documentation:
   - Updated `boe-parser/README.md` with corrected message format
   - Updated `notification-worker/README.md` with reference to the schema
   - Created symbolic links to the documentation in both service directories

## Key Changes

1. `/boe-parser/src/utils/pubsub.js`
   - Fixed the message structure to exactly match notification worker expectations
   - Improved error handling and fallbacks for missing fields
   - Enhanced logging to better track message format issues

2. `/docs/pubsub-structure.md`
   - Created standardized documentation for all message formats
   - Included detailed object schemas for each component
   - Added complete examples for clear reference

3. Service documentation
   - Updated both service READMEs with consistent information
   - Added references to the shared schema
   - Improved example messages in documentation

## Testing and Verification

The fix can be verified by:

1. Monitoring logs for PubSub messages in the BOE parser
2. Checking notification worker logs for validation warnings
3. Confirming successful notification creation in the database

## Recommendations

1. Implement unit tests for message validation in both services
2. Add schema validation in the BOE parser before publishing messages
3. Create a shared library for message schemas to enforce consistency
4. Add automated tests to verify schema compatibility between services
5. Consider using TypeScript or a schema registry for better type safety

## Future Work

1. Apply the same schema standardization to other parser services (DOGA, Real Estate)
2. Enhance error handling for message validation failures
3. Add monitoring for message format validation errors
4. Create a schema evolution process for future changes
5. Consider implementing message versioning for backward compatibility