# NIFYA Comprehensive Architecture Diagram

This diagram illustrates the complete flow of the NIFYA platform, including the subscription creation process, data processing flow, and notification delivery.

## 1. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       NIFYA Platform Architecture                               │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
                     ┌─────────────────┐                           ┌─────────────────┐
                     │     Frontend    │                           │ Authentication  │
     ┌─────┐         │    (React/TS)   │◄────JWT Auth─────────────►│    Service      │
     │     │         │                 │                           │                 │
     │User │◄──Email─┤                 │                           └────────┬────────┘
     │     │         └────────┬────────┘                                    │
     └─────┘                  │                                             │
       ▲                      │                                             │
       │                      │                                             │
       │                      ▼                                             ▼
       │            ┌─────────────────┐                           ┌─────────────────┐
       │            │     Backend     │                           │                 │
       │            │    (Node.js)    │◄───────Store/Retrieve────►│    Database     │
       │            │                 │                           │   (PostgreSQL)  │
       │            └────────┬────────┘                           └─────────────────┘
       │                     │                                             ▲
       │                     │                                             │
       │                     ▼                                             │
       │            ┌──────────────────┐                                   │
       │            │    PubSub        │                                   │
       │            │ "subscription"   │                                   │
       │            └────────┬─────────┘                                   │
       │                     │                                             │
       │                     ▼                                             │
       │            ┌──────────────────┐                                   │
       │            │ Subscription     │                                   │
       │            │    Worker        │◄───────Store/Retrieve─────────────┘
       │            │                  │                                   ▲
       │            └────────┬─────────┘                                   │
       │                     │                                             │
       │                     ├───────────────────┐                         │
       │                     │                   │                         │
       │                     ▼                   ▼                         │
       │            ┌──────────────────┐ ┌──────────────────┐             │
       │            │   BOE Parser     │ │   DOGA Parser    │             │
       │            │                  │ │                  │             │
       │            └────────┬─────────┘ └────────┬─────────┘             │
       │                     │                    │                        │
       │                     └──────┬─────────────┘                        │
       │                            │                                      │
       │                            ▼                                      │
       │            ┌──────────────────────────┐                           │
       │            │        PubSub            │                           │
       │            │   "processor-results"    │                           │
       │            └────────────┬─────────────┘                           │
       │                         │                                         │
       │                         ▼                                         │
       │            ┌──────────────────────────┐                           │
       │            │     Notification         │                           │
       │            │        Worker            │◄───Store/Retrieve─────────┘
       │            └────────────┬─────────────┘                           ▲
       │                         │                                         │
       │                         ├───────────────────┐                     │
       │                         │                   │                     │
       │                         ▼                   ▼                     │
       │            ┌──────────────────┐  ┌──────────────────────┐         │
       │            │  WebSocket       │  │       PubSub         │         │
       │            │  Notification    │  │ "email-notifications" │         │
       │            └────────┬─────────┘  └────────┬─────────────┘         │
       │                     │                     │                        │
       │                     │                     ▼                        │
       │                     │            ┌──────────────────┐              │
       │                     │            │ Email            │              │
       └─────────────────────┴───────────►│ Notification     │───Store/Retrieve─┘
                                          │ Service          │
                                          └──────────────────┘
```

## 2. Detailed Data Flow for Subscription Processing

```
┌───────────────────────────────────────┐
│ Frontend                              │
│ 1. User selects subscription template │
│ 2. User enters prompt                 │
│ 3. User submits form                  │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ Backend API                           │
│ POST /api/subscriptions               │
│ {                                     │
│   "user_id": "uuid",                  │
│   "type_name": "boe",                 │
│   "prompts": ["query text"],          │
│   "frequency": "immediate"            │
│ }                                     │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ Database                              │
│ INSERT INTO subscriptions             │
│ RETURNING subscription_id             │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ PubSub "subscription" Topic           │
│ {                                     │
│   "subscription_id": "uuid",          │
│   "user_id": "uuid",                  │
│   "type_name": "boe",                 │
│   "prompts": ["query text"]           │
│ }                                     │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ Subscription Worker                   │
│ 1. Validates subscription             │
│ 2. Determines processor (BOE/DOGA)    │
│ 3. Calls appropriate parser           │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ BOE/DOGA Parser Request               │
│ POST /analyze-text                    │
│ {                                     │
│   "texts": ["query text"],            │
│   "metadata": {                       │
│     "user_id": "uuid",                │
│     "subscription_id": "uuid"         │
│   },                                  │
│   "limit": 5,                         │
│   "date": "YYYY-MM-DD"                │
│ }                                     │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ BOE/DOGA Parser Response              │
│ {                                     │
│   "query_date": "YYYY-MM-DD",         │
│   "results": [                        │
│     {                                 │
│       "prompt": "query text",         │
│       "matches": [                    │
│         {                             │
│           "document_type": "type",    │
│           "title": "Title text",      │
│           "summary": "Summary text",  │
│           "relevance_score": 0.95,    │
│           "links": {                  │
│             "html": "URL",            │
│             "pdf": "URL"              │
│           }                           │
│         }                             │
│       ]                               │
│     }                                 │
│   ]                                   │
│ }                                     │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ PubSub "processor-results" Topic      │
│ {                                     │
│   "version": "1.0",                   │
│   "processor_type": "boe",            │
│   "timestamp": "ISO-8601",            │
│   "trace_id": "uuid",                 │
│   "request": {                        │
│     "subscription_id": "uuid",        │
│     "processing_id": "uuid",          │
│     "user_id": "uuid",                │
│     "prompts": ["query text"]         │
│   },                                  │
│   "results": {                        │
│     "query_date": "YYYY-MM-DD",       │
│     "matches": [                      │
│       {                               │
│         "prompt": "query text",       │
│         "documents": [                │
│           {                           │
│             "document_type": "type",  │
│             "title": "Title text",    │
│             "summary": "Summary text",│
│             "relevance_score": 0.95,  │
│             "links": {                │
│               "html": "URL",          │
│               "pdf": "URL"            │
│             }                         │
│           }                           │
│         ]                             │
│       }                               │
│     ]                                 │
│   },                                  │
│   "metadata": {                       │
│     "processing_time_ms": 1234,       │
│     "total_matches": 5,               │
│     "status": "success"               │
│   }                                   │
│ }                                     │
└─────────────────┬─────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│ Notification Worker                   │
│ 1. Validates message                  │
│ 2. Creates notifications in DB        │
│ 3. Triggers realtime & email notices  │
└─────────────────┬─────────────────────┘
                  │
                  ├─────────────────────┐
                  │                     │
                  ▼                     ▼
┌───────────────────────┐   ┌───────────────────────┐
│ WebSocket Notification│   │ Email Notification    │
│ {                     │   │ {                     │
│   "type": "new_notif",│   │   "userId": "uuid",   │
│   "data": {           │   │   "email": "address", │
│     "id": "uuid",     │   │   "notification": {   │
│     "title": "Title", │   │     "id": "uuid",     │
│     "content": "Text" │   │     "title": "Title", │
│   }                   │   │     "content": "Text" │
│ }                     │   │   }                   │
└───────────────────────┘   │ }                     │
                            └───────────────────────┘
```

## 3. Key Components and Responsibilities

### Frontend (React/TypeScript)
- User interface for authentication, subscription management, and notifications
- Form for creating subscriptions with templates
- Dashboard for viewing notifications
- Uses JWT tokens for authentication with backend

### Authentication Service
- Manages user registration and login
- Issues JWT tokens
- Handles password reset, Google OAuth

### Backend (Node.js)
- RESTful API for subscriptions and notifications
- Stores subscriptions in database
- Publishes subscription events to PubSub
- Handles authentication

### Subscription Worker
- Processes subscription creation/updates
- Validates subscription data
- Routes to appropriate parser service based on type
- Handles retry logic with exponential backoff
- Publishes results to processor-results topic

### Parser Services (BOE, DOGA)
- Analyze text queries against publication content
- Use AI to find relevant matches
- Return standardized results
- Specialized for specific document sources

### Notification Worker
- Consumes processor results from PubSub
- Creates notification records in database
- Triggers email notifications (immediate/daily)
- Sends realtime notifications via WebSockets

### Email Notification Service
- Formats and sends email notifications
- Handles immediate alerts and daily digests
- Respects user notification preferences

### Database (PostgreSQL)
- Stores user accounts, subscriptions, and notifications
- Uses Row-Level Security (RLS) for data isolation
- Provides transaction support and data integrity

## 4. Communication Formats

### Subscription Worker to Parser Format
```json
{
  "texts": ["query text"],
  "metadata": {
    "user_id": "uuid",
    "subscription_id": "uuid"
  },
  "limit": 5,
  "date": "YYYY-MM-DD"
}
```

### Parser to PubSub Format (processor-results)
```json
{
  "version": "1.0",
  "processor_type": "boe",
  "timestamp": "ISO-8601",
  "trace_id": "uuid",
  "request": {
    "subscription_id": "uuid",
    "processing_id": "uuid",
    "user_id": "uuid",
    "prompts": ["query text"]
  },
  "results": {
    "query_date": "YYYY-MM-DD",
    "matches": [
      {
        "prompt": "query text",
        "documents": [
          {
            "document_type": "type",
            "title": "Title text",
            "summary": "Summary text",
            "relevance_score": 0.95,
            "links": {
              "html": "URL",
              "pdf": "URL"
            }
          }
        ]
      }
    ]
  },
  "metadata": {
    "processing_time_ms": 1234,
    "total_matches": 5,
    "status": "success"
  }
}
```

### Notification Worker to Email Service Format
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "notification": {
    "id": "uuid",
    "title": "Notification Title",
    "content": "Notification content",
    "sourceUrl": "Source URL",
    "subscriptionName": "Subscription Name"
  },
  "timestamp": "ISO-8601"
}
```

## 5. Security and Error Handling

### Security Measures
- JWT authentication between frontend and backend
- API keys for service-to-service communication
- Row-Level Security in database to isolate user data
- HTTPS for all API communications
- Input validation with Zod schemas

### Error Handling and Resilience
- Retry mechanisms with exponential backoff
- Dead Letter Queues (DLQ) for failed messages
- Fallback patterns for service unavailability
- Structured logging for traceability
- Request/response validation at each step