# NIFYA - Notificaciones Inteligentes con IA

A comprehensive platform for intelligent notifications powered by AI. NIFYA provides personalized alerts for official bulletins (BOE, DOGA), real estate listings, and more through a microservices architecture.

![NIFYA](https://ik.imagekit.io/appraisily/NYFIA/logo.png)

## 🏛️ System Architecture

NIFYA is built with a microservices architecture where specialized services handle specific domains of functionality:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│ Auth Service│
│  (React)    │◀────│  (Node.js)  │◀────│ (Node.js/TS)│
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       │                   ▼                   │
       │           ┌─────────────┐            │
       │           │  Cloud SQL  │            │
       │           │ PostgreSQL  │────────────┘
       │           └─────────────┘
       │                   ▲
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Notification│◀────│ PubSub      │◀────│ Subscription│
│   Worker    │     │   Topics    │     │   Worker    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   ▲                   ▲
       │                   │                   │
       ▼                   │                   │
┌─────────────┐            │                   │
│Email Service│            │                   │
└─────────────┘     ┌─────────────┐     ┌─────────────┐
                    │  BOE Parser │     │ DOGA Parser │
                    └─────────────┘     └─────────────┘
```

## 📦 Submodules

The repository contains the following submodules, each with its own specific functionality:

| Submodule | Description | URL |
|-----------|-------------|-----|
| **Authentication Service** | Handles user identity, authentication, and security | [https://authentication-415554190254.us-central1.run.app](https://authentication-415554190254.us-central1.run.app) |
| **Backend** | Core orchestration service for subscriptions and notifications | [https://backend-415554190254.us-central1.run.app](https://backend-415554190254.us-central1.run.app) |
| **Frontend** | React client application with responsive UI | [https://nifya.app](https://nifya.app) |
| **Notification Worker** | Processes notification messages and stores them in the database | [https://notification-worker-415554190254.us-central1.run.app](https://notification-worker-415554190254.us-central1.run.app) |
| **Subscription Worker** | Processes subscription requests and coordinates with content parsers | [https://subscription-worker-415554190254.us-central1.run.app](https://subscription-worker-415554190254.us-central1.run.app) |
| **BOE Parser** | AI-powered analysis of Spanish Official Bulletin (BOE) | [https://boe-parser-415554190254.us-central1.run.app](https://boe-parser-415554190254.us-central1.run.app) |
| **DOGA Parser** | AI-powered analysis of Galician Official Bulletin (DOGA) | [https://doga-parser-415554190254.us-central1.run.app](https://doga-parser-415554190254.us-central1.run.app) |
| **Email Notification** | Sends email summaries of notifications to users | Scheduled Cloud Run Job |

## 🔄 Communication Protocols

### HTTP/REST Communication

The following services communicate via REST APIs:

#### Frontend → Authentication Service
- **Protocol**: HTTP/REST
- **Authentication**: JWT
- **Key Endpoints**:
  - `POST /auth/login`: User authentication
  - `POST /auth/register`: User registration
  - `POST /auth/refresh`: Token refresh
  - `GET /auth/me`: Current user info

#### Frontend → Backend
- **Protocol**: HTTP/REST
- **Authentication**: JWT in `Authorization` header + `X-User-ID` header
- **Key Endpoints**:
  - `/api/v1/subscriptions`: Manage user subscriptions
  - `/api/v1/notifications`: Retrieve and manage notifications
  - `/api/v1/templates`: Get subscription templates

#### Subscription Worker → Content Parsers (BOE/DOGA)
- **Protocol**: HTTP/REST
- **Authentication**: API Key in `Authorization` header
- **Request Format**: JSON with prompts and metadata
- **Key Endpoints**:
  - `POST /analyze-text`: Submit queries for content analysis

### PubSub Messaging

The following message-based communications occur via Google Cloud PubSub:

#### 1. Subscription Worker → Notification Worker
- **Topic**: `processor-results`
- **Protocol**: PubSub
- **Message Format**:
  ```json
  {
    "version": "1.0",
    "processor_type": "boe|doga|real_estate",
    "timestamp": "ISO8601 timestamp",
    "request": {
      "subscription_id": "uuid",
      "processing_id": "uuid",
      "user_id": "uuid",
      "prompts": ["search prompt 1", "search prompt 2"]
    },
    "results": {
      "query_date": "2025-02-11",
      "matches": [
        {
          "prompt": "search prompt 1",
          "documents": [
            {
              "document_type": "boe_document",
              "title": "Document Title",
              "summary": "Document Summary",
              "relevance_score": 0.95,
              "links": {
                "html": "https://example.com/doc.html",
                "pdf": "https://example.com/doc.pdf"
              }
            }
          ]
        }
      ]
    }
  }
  ```

#### 2. Backend → Subscription Worker
- **Topic**: `subscription-created` / `subscription-updated`
- **Protocol**: PubSub
- **Message Format**:
  ```json
  {
    "event": "subscription_created|subscription_updated",
    "subscription_id": "uuid",
    "user_id": "uuid",
    "timestamp": "ISO8601 timestamp",
    "data": {
      "type": "boe|doga|real_estate",
      "prompts": ["prompt1", "prompt2"],
      "frequency": "immediate|daily"
    }
  }
  ```

#### 3. Notification Worker → Email Service
- **Topic**: `email-notifications`
- **Protocol**: PubSub
- **Message Format**:
  ```json
  {
    "event": "notification_created",
    "user_id": "uuid",
    "timestamp": "ISO8601 timestamp",
    "notification_data": {
      "id": "uuid",
      "title": "Notification Title",
      "content": "Notification Content",
      "subscription_id": "uuid",
      "source_url": "https://example.com/source"
    }
  }
  ```

### Database Access

All services share a PostgreSQL database with the following security approach:

- **Row-Level Security (RLS)**: Database enforces access control at the row level
- **Connection Pooling**: Each service maintains its own connection pool
- **Context Setting**: Services set `app.current_user_id` for RLS enforcement

#### Database Schema (High Level)
- **users**: Core user data
- **subscriptions**: User subscriptions with prompts and frequency
- **notifications**: Messages generated for users based on subscriptions
- **subscription_templates**: Reusable subscription configurations

## 🔒 Security

The system implements the following security measures across services:

- **JWT Authentication**: Short-lived access tokens + refresh tokens
- **API Keys**: For internal service-to-service communication
- **Row-Level Security**: Database-enforced data isolation
- **Secret Manager**: Secure storage of credentials and API keys
- **Environment Variables**: Configuration without hardcoded secrets
- **HTTPS**: All communications encrypted in transit

## 🚀 Deployment

All services are deployed to Google Cloud Run with the following configuration:

- **CI/CD**: Each service has its own deployment pipeline
- **Cloud Run**: Serverless containers for all services
- **Cloud SQL**: PostgreSQL database with proxy connections
- **Cloud Scheduler**: Triggers scheduled processes (daily subscription checks)
- **Secret Manager**: Secure storage of credentials
- **Cloud Storage**: Assets and static content storage

## 🧩 Development

Each service has its own development environment and setup. For local development:

1. Clone this repository with submodules:
   ```bash
   git clone --recursive https://github.com/yourusername/NIFYA-Master.git
   ```

2. Set up environment variables for each submodule based on their README files

3. Start services in the following order:
   - Authentication Service
   - Backend
   - Content Parsers (BOE/DOGA)
   - Workers (Subscription/Notification)
   - Frontend

## 📊 Monitoring

The system includes structured logging across all services with the following information:

- Request/response timing
- Database operation metrics
- Error tracking with stack traces
- User action auditing
- Performance metrics

## 🔍 Troubleshooting

When troubleshooting the system, consider the following common integration points:

1. **Authentication Flow**: Verify JWT tokens are correctly passed and validated
2. **PubSub Messages**: Check message format and topic subscriptions
3. **Database Connections**: Verify RLS context is properly set
4. **Service Health**: Check each service's `/health` endpoint
5. **Service Logs**: Review Cloud Run logs for each service

## 📖 License

Copyright © 2025 NIFYA. All rights reserved.

## Subscription Processing Flow

The subscription processing system follows this flow:

1. **Frontend Request**: 
   - User clicks "Process Immediately" button in the frontend
   - Frontend sends a POST request to `/api/v1/subscriptions/:id/process`

2. **Backend Processing**:
   - Backend receives the request and verifies ownership of the subscription
   - Backend forwards the request to the Subscription Worker
   - Path: `POST ${SUBSCRIPTION_WORKER_URL}/subscriptions/process-subscription/:id`

3. **Subscription Worker Processing**:
   - Worker receives the request and queues it for processing
   - Worker fetches the subscription details from the database
   - Worker determines the appropriate processor (BOE, DOGA, etc.)
   - Worker calls the processor's `processSubscription` method
   - For BOE subscriptions, it uses the BOEProcessor

4. **BOE Parser Communication**:
   - BOEProcessor makes a POST request to the BOE Parser service
   - Path: `POST ${BOE_PARSER_URL}/analyze-text`
   - Sends the subscription prompts and metadata
   - Processes the results and generates notifications

5. **Notification Creation**:
   - Worker creates notifications based on processing results
   - Notifications appear in the user's frontend interface

## Troubleshooting Communication Issues

If the subscription processing isn't working correctly, follow these steps:

1. **Verify Backend Configuration**:
   - Check that `SUBSCRIPTION_WORKER_URL` is correctly set in the backend environment
   - Default fallback is `http://localhost:8080`
   - Confirm in backend logs that the request is being forwarded to the worker

2. **Verify Subscription Worker Configuration**:
   - Check that `BOE_API_URL` is correctly set in the worker's environment variables
   - Default is `https://boe-parser-415554190254.us-central1.run.app`
   - Look for initialization logs from `boe-processor` showing the service URL

3. **Check Connectivity**:
   - Ensure the worker can reach the BOE Parser service
   - Test connectivity: `curl -v https://boe-parser-415554190254.us-central1.run.app/health`
   - Check network rules, firewall settings, or VPC configurations

4. **Review Worker Logs**:
   - Look for "Sending prompts to BOE analyzer" in logs
   - Check for errors in the request interceptor logs
   - Verify that "BOE analysis completed successfully" appears

5. **Review Processor Logs**:
   - The BOE Parser service should log incoming requests
   - Check for authentication issues (API keys)
   - Verify that the service is processing and returning results

## Common Issues

1. **Missing or Incorrect Environment Variables**:
   - If the `BOE_API_URL` is not set or incorrect, the worker may not be able to communicate with the BOE Parser service
   - Solution: Verify and update the environment variables in both the backend and worker services

2. **Network Connectivity Issues**:
   - If the worker cannot reach the BOE Parser service, requests will fail
   - Solution: Check firewall rules, network policies, and ensure the BOE Parser service is running

3. **Incorrect Endpoint Construction**:
   - The worker must use the correct path to communicate with the BOE Parser
   - Solution: Verify that the worker is using `/analyze-text` endpoint
