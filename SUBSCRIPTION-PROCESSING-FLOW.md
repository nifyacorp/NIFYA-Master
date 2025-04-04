# Subscription Processing Flow

This document describes the end-to-end flow of the subscription processing system in NIFYA, from when a user initiates processing until the notifications are saved in the database.

## Overview

The subscription processing flow involves several microservices working together:

1. **Backend** - Receives initial subscription processing request from frontend
2. **Subscription Worker** - Schedules and coordinates subscription processing
3. **BOE Parser** - Specializes in parsing and analyzing BOE (Boletín Oficial del Estado) content
4. **Notification Worker** - Processes parser results and saves notifications to the database

## Flow Diagram

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐     ┌─────────┐
│            │     │            │     │            │     │            │     │         │
│  Frontend  │────▶│  Backend   │────▶│Subscription│────▶│ BOE Parser │────▶│ PubSub  │
│            │     │            │     │   Worker   │     │            │     │         │
└────────────┘     └────────────┘     └────────────┘     └────────────┘     └────┬────┘
                                                                                 │
                                                                                 ▼
                                                                           ┌────────────┐     ┌─────────┐
                                                                           │Notification│     │         │
                                                                           │   Worker   │────▶│Database │
                                                                           │            │     │         │
                                                                           └────────────┘     └─────────┘
```

## Detailed Process Flow

1. **User Initiates Processing**
   - A user clicks the "Process" button for a subscription in the Frontend
   - The Frontend makes a POST request to the Backend API

2. **Backend Handles Initial Request**
   - Endpoint: `POST /v1/subscriptions/{id}/process`
   - Validates the request and user permissions
   - Creates a processing record in the database
   - Forwards the processing request to Subscription Worker
   - Returns a response to the Frontend with status and tracking ID

3. **Subscription Worker Coordinates Processing**
   - Endpoint: `POST /process-subscription`
   - Retrieves subscription details from database
   - Decides which parser to use based on subscription type
   - For BOE subscriptions, routes to BOE Parser
   - Tracks processing state and handles retries if needed

4. **BOE Parser Processes Content**
   - Endpoint: `POST /analyze-text`
   - Scrapes and processes BOE website for the current or specified date
   - Analyzes content based on subscription prompts/keywords
   - Uses AI (Gemini) to determine relevant matches
   - Publishes results to PubSub topic "parser-results"

5. **PubSub Message Bus**
   - Acts as a message queue between services
   - Guarantees message delivery with retries
   - Provides a buffer for asynchronous processing

6. **Notification Worker Processes Results**
   - Subscribes to the "parser-results" PubSub topic
   - Processes incoming messages from parsers
   - Transforms results into notifications
   - Validates and enhances data
   - Writes notifications to the database
   - Handles error cases and publishes to DLQ (Dead Letter Queue) if needed

7. **Database Storage**
   - Notifications are stored in the PostgreSQL database
   - Row-Level Security (RLS) ensures data isolation
   - Frontend can query notifications through the Backend API

## Service URLs

| Service | Environment | URL |
|---------|------------|-----|
| Backend | Production | https://backend-415554190254.us-central1.run.app |
| Subscription Worker | Production | https://subscription-worker-415554190254.us-central1.run.app |
| BOE Parser | Production | https://boe-parser-415554190254.us-central1.run.app |
| Notification Worker | Production | https://notification-worker-415554190254.us-central1.run.app |

## Error Handling

Each service in the pipeline includes robust error handling:

1. **Validation Errors** - Invalid requests are rejected with appropriate error messages
2. **Processing Errors** - Temporary failures trigger retries with exponential backoff
3. **Dead Letter Queue** - Persistent failures are sent to a DLQ for later inspection
4. **Timeout Handling** - Long-running operations include timeouts to prevent blocking
5. **Logging** - Comprehensive logging with trace IDs for debugging

## Monitoring and Debugging

To monitor and debug the subscription processing flow:

1. **Health Endpoints** - Each service provides a `/health` endpoint
2. **Diagnostic Endpoints** - Services offer debugging endpoints like:
   - `/diagnostics/subscription-debug/{userId}` on Backend
   - `/debug/notifications` on Notification Worker
   - `/test-analyze` on BOE Parser

3. **Logs** - Use Cloud Logging to trace execution across services

## Testing the Flow

To test the complete subscription processing flow:

1. Create a subscription in the Frontend
2. Use the "Process" button to start processing
3. Check logs in each service to trace execution
4. Verify notifications appear in the Frontend

For more detailed information about each service, refer to their respective endpoint documentation:
- [Backend Endpoint Documentation](./backend/ENDPOINTS.md)
- [Subscription Worker Endpoint Documentation](./subscription-worker/ENDPOINTS.md)
- [BOE Parser Endpoint Documentation](./boe-parser/ENDPOINTS.md)
- [Notification Worker Endpoint Documentation](./notification-worker/ENDPOINTS.md)