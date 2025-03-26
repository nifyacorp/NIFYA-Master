# NIFYA Notification Pipeline Analysis

This report analyzes the notification pipeline from BOE Parser to Notification Worker.

Generated: 2025-03-26T12:29:25.509Z

## Service Health Status

### boeParser

- **Status**: ❌ Unhealthy
- **Status Code**: 401
- **Details**: {
  "error": "Authorization header is required"
}...

### notificationWorker

- **Status**: ✅ Healthy
- **Status Code**: 200
- **Details**: {
  "status": "OK",
  "service": "notification-worker",
  "timestamp": "2025-03-26T12:30:41.023Z",
  "uptime": 4987.761300894,
  "memory": {
    "rss": "114 MB",
    "heapTotal": "41 MB",
    "heapUse...

### backend

- **Status**: ✅ Healthy
- **Status Code**: 200
- **Details**: {
  "status": "healthy",
  "timestamp": "2025-03-26T12:30:41.339Z",
  "uptime": 1728.684508343,
  "version": {
    "package": "1.0.0",
    "buildTimestamp": "$(date",
    "commitSha": "unknown",
    "...

## Message Schema Analysis

### BOE Parser Output Schema

```javascript
const message = {
      // Required version field
      version: '1.0',
      trace_id: traceId,
      processor_type: 'boe',
      timestamp: new Date().toISOString(),
      
      // Request details with required fields
      request: {
        subscription_id: subscriptionId,
        user_id: userId,
        processing_id: randomUUID(),
        prompts: prompts
      },
      
      // Results section with required query_date and matches array (not nested under results)
      results: {
        query_date: queryDate,
        matches: transformedMatches
      },
      
      // Metadata with required fields
      metadata: {
        processing_time_ms: payload.metadata?.processing_time_ms || 0,
        total_items_processed: payload.metadata?.total_items_processed || 0,
        total_matches: matches.length,
        model_used: payload.metadata?.model_used || "gemini-2.0-pro-exp-02-05",
        status: payload.metadata?.status || 'success',
        error: null
      }
    };
```

### Notification Worker Input Schema

```javascript
export const BOEMessageSchema = z.object({
  version: z.string(),
  processor_type: z.literal('boe'),
  timestamp: z.string().datetime(),
  trace_id: z.string(),
  request: CommonRequestSchema,
  results: z.object({
    query_date: z.string(),
    matches: z.array(BOEMatchSchema),
  }),
  metadata: CommonMetadataSchema,
});
```

### Schema Comparison

✅ **No structural discrepancies found**

## PubSub Configuration

### BOE Parser PubSub Configuration

- **Topic Name**: processor-results
- **DLQ Topic Name**: processor-results-dlq

### Notification Worker PubSub Configuration

- **Subscription Name**: From environment variable
- **DLQ Topic Name**: Not found

### PubSub Configuration Issues

- ❌ **Topic name in BOE Parser does not match subscription name in Notification Worker**

- ❌ **DLQ topic names do not match between services**

## Error Pattern Analysis

### Error Logs Sample

```

2025-03-26T12:05:03.276Z ERROR: Failed to publish to DLQ {"error":{"code":5,"details":"Resource not found (resource=notification-dlq).","metadata":{},"note":"Exception occurred in retry method that was not classified as transient"},"original_error":{},"trace_id":"47e47250-00e0-4502-90ed-031e23dcc222"}
2025-03-26T12:05:04.259Z WARN: Message validation warning {"processor_type":"boe","trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","errors":{"_errors":[],"results":{"_errors":[],"matches":{"_errors":["Required"]}}}}
2025-03-26T12:05:04.259Z WARN: Message validation warnings {"processor_type":"boe","trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","errors":{"_errors":[],"results":{"_errors":[],"matches":{"_errors":["Required"]}}}}
2025-03-26T12:05:04.259Z INFO: Processing BOE message {"trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","subscription_id":"bbcde7bb-bc04-4a0b-8c47-01682a31cc15","user_id":"65c6074d-dbc4-4091-8e45-b6aecffd9ab9","match_count":0}
2025-03-26T12:05:04.259Z ERROR: Failed to process BOE message {"error":"Invalid message format: missing or invalid matches array","stack":"Error: Invalid message format: missing or invalid matches array\n at processBOEMessage (file:///app/src/processors/boe.js:28:13)\n at withRetry.maxRetries (file:///app/src/index.js:569:13)\n at withRetry (file:///app/src/index.js:431:20)\n at Subscription.processMessage (file:///app/src/index.js:568:11)\n at process.processTicksAndRejections (node:internal/process/task_queues:95:5)","trace_id":"47e47250-00e0-4502-90ed-031e23dcc222","subscription_id":"bbcde7bb-bc04-4a0b-8c47-01682a31cc15","user_id":"65c6074d-dbc4-4091-8e45-b6aecffd9ab9"}
```

### Error Analysis

#### Primary Issues Identified

1. **Message Validation Error**: `matches: { _errors: ["Required"] }`
   - The notification worker expects a `matches` array in the message structure
   - The incoming message doesn't have the expected `matches` array or it is not in the expected location

2. **Missing DLQ Resource**: `Resource not found (resource=notification-dlq)`
   - The Dead Letter Queue (DLQ) topic `notification-dlq` does not exist
   - This prevents failed messages from being properly handled

3. **Processing Failure**: `Invalid message format: missing or invalid matches array`
   - Error occurs in `processBOEMessage` at line 28 of `processors/boe.js`
   - The message structure doesn't match what the processor expects

#### Root Cause Analysis

Based on the schema and error analysis, the root issues are:

1. **Schema Mismatch**: The BOE Parser is sending data in a structure different from what the Notification Worker expects
2. **Missing PubSub Resource**: The DLQ topic does not exist or is inaccessible
3. **Validation Error Handling**: The error handling doesn't recover from schema validation failures

## Recommended Fixes

### 1. Update Message Schema in BOE Parser

Update `boe-parser/src/utils/pubsub.js` to use the correct message structure:

```javascript
// Create the message structure that EXACTLY matches what the notification worker expects
const message = {
  // Required version field
  version: '1.0',
  trace_id: traceId,
  processor_type: 'boe',
  timestamp: new Date().toISOString(),
  
  // Request details with required fields
  request: {
    subscription_id: subscriptionId,
    user_id: userId,
    processing_id: randomUUID(),
    prompts: prompts
  },
  
  // Results section with required query_date and matches array
  results: {
    query_date: queryDate,
    matches: transformedMatches // Array of objects with prompt and documents
  },
  
  // Metadata with required fields
  metadata: {
    processing_time_ms: payload.metadata?.processing_time_ms || 0,
    total_items_processed: payload.metadata?.total_items_processed || 0,
    total_matches: matches.length,
    model_used: payload.metadata?.model_used || "gemini-2.0-pro-exp-02-05",
    status: payload.metadata?.status || 'success',
    error: null
  }
};
```

### 2. Create Missing DLQ Topic

Create the missing PubSub DLQ topic `notification-dlq` in Google Cloud:

```bash
# Using Google Cloud CLI
gcloud pubsub topics create notification-dlq --project=PROJECT_ID

# Verify topic exists
gcloud pubsub topics list --filter=name:notification-dlq
```

### 3. Improve Error Handling in Notification Worker

Update `notification-worker/src/processors/boe.js` to handle schema validation errors more gracefully:

```javascript
// Validate the message structure with fallbacks
if (!message.results?.matches || !Array.isArray(message.results.matches)) {
  // Try to recover by looking for matches in expected locations
  let matches = [];
  
  if (Array.isArray(message.results?.results?.[0]?.matches)) {
    // Handle legacy format where matches is nested under results.results[0]
    matches = message.results.results[0].matches;
    logger.warn('Found matches in legacy location: results.results[0].matches', {
      trace_id: message.trace_id,
      match_count: matches.length
    });
  } else if (message.results?.results) {
    // Try to extract matches from all results
    matches = message.results.results.flatMap(r => 
      Array.isArray(r.matches) ? r.matches.map(m => ({...m, prompt: r.prompt})) : []
    );
    logger.warn('Reconstructed matches from nested results structure', {
      trace_id: message.trace_id,
      match_count: matches.length
    });
  }
  
  if (matches.length > 0) {
    // Use the recovered matches
    message.results.matches = matches;
  } else {
    throw new Error('Invalid message format: missing or invalid matches array');
  }
}
```

### 4. Document Message Schema in a Shared Location

Create a comprehensive schema document at `docs/pubsub-structure.md` with:

- Complete JSON schema definition
- Example messages (successful and error cases)
- Implementation guidelines for all services
- Test utilities to validate schema conformance

### 5. Implement Monitoring and Alerting

Add monitoring for the notification pipeline:

- Track message validation errors in Cloud Monitoring
- Set up alerts for DLQ usage
- Create a dashboard for the notification pipeline
- Add custom metrics for schema version tracking

