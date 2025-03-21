# NIFYA - Notificaciones Inteligentes con IA

A comprehensive platform for intelligent notifications powered by AI. NIFYA provides personalized alerts for official bulletins (BOE, DOGA), real estate listings, and more through a microservices architecture.

![NIFYA](https://ik.imagekit.io/appraisily/NYFIA/logo.png)

## 🚀 Current Status (March 2025)

- **Frontend**: Fully operational with React, TypeScript, and Tailwind CSS
- **Authentication**: Complete with OAuth and JWT authentication
- **Notification System**: Implemented with real-time and email delivery
- **Subscription Management**: Available with customizable templates and processing
- **Data Validation**: Zod implemented in frontend, backend, and authentication services
- **API Resilience**: Enhanced error handling and standardized responses
- **Email Notifications**: Working with HTML templates and user preferences
- **Current Focus**: Bug fixes and performance optimization across services

## 🧪 Testing & Debugging

For testing and debugging purposes, use the test credentials stored in the `test-credentials.md` file (gitignored). This file contains a test account that can be used across all environments.

- Test site: https://clever-kelpie-60c3a6.netlify.app/
- Comprehensive testing documentation available in [testing-documentation.md](testing-documentation.md)

### Automated Testing

The repository includes automated testing scripts:
- `debug-website.js`: Runs a comprehensive test of the website and generates a detailed bug report
- `route-testing-script.js`: Tests all application routes and produces screenshots with error logs

#### Running Tests

You can run all tests using the provided test runner scripts:

**For Linux/Mac:**
```bash
# Make the script executable
chmod +x run-tests.sh

# Run all tests
./run-tests.sh
```

**For Windows:**
```powershell
# Run all tests
.\run-tests.ps1
```

Or run individual test scripts:
```bash
# Install dependencies
npm install puppeteer

# Run the debug script
node debug-website.js

# Run the route testing script
node route-testing-script.js
```

Test results are stored in:
- Bug reports: `bugs-report.md`
- Route test results: `route-test-results/`

### Common Issues

For common issues and their solutions, refer to the [testing documentation](testing-documentation.md#common-issues-and-solutions).

## 🏛️ System Architecture

NIFYA is built with a microservices architecture where specialized services handle specific domains of functionality:

```
                  ┌─────────────────┐                           ┌─────────────────┐
                  │     Frontend    │                           │ Authentication  │
  ┌─────┐         │    (React/TS)   │◄────JWT Auth─────────────►│    Service      │
  │     │         │ clever-kelpie...│                           │ authentication..│
  │User │◄──Email─┤                 │                           └────────┬────────┘
  │     │         └────────┬────────┘                                    │
  └─────┘                  │                                             │
    ▲                      │                                             │
    │                      │                                             │
    │                      ▼                                             ▼
    │            ┌─────────────────┐                           ┌─────────────────┐
    │            │     Backend     │                           │                 │
    │            │    (Node.js)    │◄───────Store/Retrieve────►│    Database     │
    │            │    backend...   │                           │   (PostgreSQL)  │
    │            └────────┬────────┘                           └─────────────────┘
    │                     │                                             ▲
    │                     │                                             │
    │                     ▼                                             │
    │            ┌─────────────────┐                                    │
    │            │    PubSub       │                                    │
    │            │   (Topics)      │                                    │
    │            └──┬─────┬─────┬──┘                                    │
    │               │     │     │                                       │
    │               ▼     │     ▼                                       │
┌───┴───────┐  ┌────────┐ │ ┌────────┐                                  │
│   Email   │  │Notific.│ │ │Subscr. │                                  │
│   Service │  │ Worker │ │ │ Worker │◄────Store/Retrieve───────────────┘
│ email-... │  │notific.│ │ │subscr..│
└───────────┘  └────┬───┘ │ └───┬────┘
                     │    │     │
                     │    │     ├────────────────┐
                     │    │     │                │
                     │    │     ▼                ▼
                     │    │  ┌────────────┐  ┌────────────┐
                     │    │  │ BOE Parser │  │DOGA Parser │
                     │    │  │ boe-parser │  │doga-parser │
                     │    │  └────────────┘  └────────────┘
                     │    │
                     │    └─────────┐
                     │              │
                     ▼              ▼
            ┌─────────────────┐    │
            │    Database     │◄───┘
            │   (PostgreSQL)  │
            └─────────────────┘
```

### Functional Relationships

The architecture above illustrates the following key relationships:

1. **User Interaction Layer**
   - Users interact with the Frontend to view content and create/manage subscriptions
   - Frontend authenticates users via the Authentication Service using JWT
   - Email Service sends notifications directly to users

2. **Core Services Layer**
   - Backend provides API endpoints for the Frontend
   - Authentication Service validates user identity
   - Backend orchestrates the overall system

3. **Processing Layer**
   - Subscription Worker processes subscription requests:
     - Analyzes content using specialized parsers (BOE/DOGA)
     - Publishes results for notification creation
   - Notification Worker creates notifications from processing results
   - Email Notification sends email summaries to users

4. **Data Storage Layer**
   - PostgreSQL Database stores all persistent data:
     - User accounts and authentication
     - Subscriptions and templates
     - Notifications and delivery status

5. **Messaging Layer**
   - Google Cloud PubSub enables asynchronous communication between services

### Data Flows

#### Subscription Creation Flow
1. User creates a subscription via Frontend
2. Frontend sends request to Backend
3. Backend stores subscription and publishes event to PubSub
4. Subscription Worker processes the subscription
5. Worker uses specialized parsers (BOE/DOGA) as needed
6. Results are published to PubSub

#### Notification Flow
1. Notification Worker consumes processing results from PubSub
2. Worker creates notifications in the database
3. Worker publishes email notification events to PubSub
4. Email Service sends emails to users
5. Users view notifications in Frontend (via Backend API)

## 📦 Submodules

The repository contains the following submodules, each with its own specific functionality:

| Submodule | Description | Deployment URL |
|-----------|-------------|----------------|
| **Frontend** | User interface and client-side application | https://clever-kelpie-60c3a6.netlify.app |
| **Authentication Service** | Handles user authentication and authorization | https://authentication-service-415554190254.us-central1.run.app |
| **Backend** | Core API and business logic | https://backend-415554190254.us-central1.run.app |
| **Subscription Worker** | Manages subscription processing | https://subscription-worker-415554190254.us-central1.run.app |
| **BOE Parser** | AI-powered analysis of Spanish Official Bulletin (BOE) | https://boe-parser-415554190254.us-central1.run.app |
| **DOGA Parser** | AI-powered analysis of Galician Official Bulletin (DOGA) | https://doga-parser-415554190254.us-central1.run.app |
| **Notification Worker** | Processes notification messages and stores them in the database | https://notification-worker-415554190254.us-central1.run.app |
| **Email Notification** | Sends email summaries of notifications to users | https://email-notification-415554190254.us-central1.run.app |

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

## Development Workflow

1. Make changes to the relevant subservice code
2. Commit your changes to the repository
3. Push/sync your changes to trigger the build process
4. Monitor the build process in the deployment platform

## Build Process

Each subservice has an independent build process triggered by changes to its respective code:

1. Code changes are committed and pushed to the repository
2. CI/CD pipeline detects changes and initiates the build process
3. Tests are run to ensure code quality
4. If tests pass, the service is built and deployed to its respective environment
5. Deployment status can be monitored in the deployment platform

## Testing

Before deploying changes, it's recommended to run the automated test suite to verify functionality:

```bash
# Run the test suite for the frontend
cd frontend
npm test

# Test the subscription flow
node fix-subscription-form.js
```

## Troubleshooting Build Process

If you encounter issues with the build process:

1. Check the build logs in the CI/CD platform
2. Verify that all dependencies are correctly specified
3. Ensure that tests are passing locally before pushing changes
4. Check for any API compatibility issues between services
