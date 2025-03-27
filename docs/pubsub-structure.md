# PubSub Message Structure Documentation

This document defines the standardized PubSub message formats used across NIFYA services for reliable communication.

## Message Format Versions

All PubSub messages should include a `version` field to support backward compatibility and future schema changes.

## Core Message Structure

All messages should follow this base structure:

```json
{
  "version": "1.0",
  "trace_id": "unique-uuid-for-tracing",
  "processor_type": "service-name",
  "timestamp": "2025-03-27T10:51:02.651Z",
  
  "request": {
    "subscription_id": "user-subscription-uuid",
    "user_id": "user-uuid",
    "processing_id": "processing-request-uuid",
    "prompts": ["Prompt text"]
  },
  
  "results": {
    /* Type-specific results */
  },
  
  "metadata": {
    "processing_time_ms": 1234,
    "status": "success",
    "error": null
  }
}
```

## BOE Processor Message Format

The BOE Processor publishes messages with this specific structure:

```json
{
  "version": "1.0",
  "trace_id": "47e47250-00e0-4502-90ed-031e23dcc222",
  "processor_type": "boe",
  "timestamp": "2025-03-27T10:51:02.651Z",
  
  "request": {
    "subscription_id": "bbcde7bb-bc04-4a0b-8c47-01682a31cc15",
    "user_id": "65c6074d-dbc4-4091-8e45-b6aecffd9ab9",
    "processing_id": "unique-uuid",
    "prompts": ["Keyword or phrase to search for"]
  },
  
  "results": {
    "query_date": "2025-03-27",
    "matches": [
      {
        "prompt": "Keyword or phrase",
        "documents": [
          {
            "document_type": "boe_document",
            "title": "Document title",
            "notification_title": "Title for notification",
            "issuing_body": "Ministry of...",
            "summary": "Brief summary of the document",
            "relevance_score": 0.85,
            "links": {
              "html": "https://www.boe.es/...",
              "pdf": "https://www.boe.es/..."
            },
            "publication_date": "2025-03-27T00:00:00.000Z",
            "section": "section-name",
            "bulletin_type": "BOE"
          }
        ]
      }
    ]
  },
  
  "metadata": {
    "processing_time_ms": 1234,
    "total_items_processed": 50,
    "total_matches": 3,
    "model_used": "gemini-2.0-pro-exp-02-05",
    "status": "success",
    "error": null
  }
}
```

## Backward Compatibility

### BOE Message Schema Compatibility

The notification worker has been updated to support multiple message formats for backward compatibility:

1. **Current Format**: `results.matches` array containing document matches
2. **Legacy Format 1**: `results.results[0].matches` array
3. **Legacy Format 2**: `results.results` array where each item has its own `matches` array

For maximum compatibility when updating services:

1. Always provide the full compliant message structure
2. Include a version field to distinguish schema versions
3. Log the complete message structure during development
4. Add resilient error handling for schema variations

## Dead Letter Queue (DLQ)

When message processing fails, services should publish to a DLQ topic with this format:

```json
{
  "original_payload": /* The original message that failed processing */,
  "error": {
    "message": "Error message",
    "stack": "Stack trace",
    "timestamp": "2025-03-27T10:51:05.352Z"
  }
}
```

## Message Size Limits

PubSub messages have a maximum size of 10MB. For large content:

1. Store the data in external storage (e.g., GCS)
2. Include a reference to the data in the message
3. Services retrieve the full data as needed

## Error Handling

All services should implement robust error handling for message processing:

1. **Validate** the message structure immediately
2. **Provide fallbacks** for missing fields
3. **Log detailed errors** for debugging
4. **Use DLQ** for unprocessable messages

## Testing

Test messages can be published directly to topics for verification:

```bash
gcloud pubsub topics publish processor-results --message="$(cat test-message.json)"
```

## Topic and Subscription Naming

Standard naming conventions:

- Main topic: `{service}-results` (e.g., `processor-results`)
- DLQ topic: `{service}-results-dlq` (e.g., `processor-results-dlq`)
- Subscription: `{service}-subscription` (e.g., `notification-subscription`)

## Schema Validation

Implement schema validation in all services:

1. Validate against expected schema
2. Log validation errors
3. Attempt recovery for backward compatibility
4. Reject completely invalid messages to DLQ