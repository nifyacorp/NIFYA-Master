# NIFYA - Notificaciones Inteligentes con IA

A comprehensive platform for intelligent notifications powered by AI. NIFYA provides personalized alerts for official bulletins (BOE, DOGA), real estate listings, and more through a microservices architecture.

![NIFYA](https://ik.imagekit.io/appraisily/NYFIA/logo.png)

## 📚 Repository Overview

This repository serves as the master repository containing all NIFYA microservices as submodules. Each submodule has its own repository, documentation, and deployment pipeline. This README provides a high-level overview of the entire platform architecture and guides you to the specific documentation for each component.

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

## 📦 Submodules Overview

The repository contains the following submodules, each with its own specific functionality:

| Submodule | Description | Documentation Files | Function |
|-----------|-------------|---------------------|----------|
| **Frontend** | User interface and client-side application | [README.md](/frontend/README.md)<br>[CLAUDE.md](/frontend/CLAUDE.md) | Provides the user interface for interacting with the NIFYA platform |
| **Authentication Service** | Handles user authentication and authorization | [README.md](/Authentication-Service/README.md) | Manages user authentication, JWT tokens, and OAuth integration |
| **Backend** | Core API and business logic | [README.md](/backend/README.md)<br>[ENDPOINTS.md](/backend/ENDPOINTS.md) | Orchestrates the entire system and provides the main API endpoints |
| **Subscription Worker** | Manages subscription processing | [README.md](/subscription-worker/README.md) | Processes subscriptions and sends results to notification services |
| **BOE Parser** | AI-powered analysis of Spanish Official Bulletin (BOE) | [README.md](/boe-parser/README.md)<br>[CLAUDE.md](/boe-parser/CLAUDE.md) | Analyzes BOE content using AI and extracts relevant information |
| **DOGA Parser** | AI-powered analysis of Galician Official Bulletin (DOGA) | [README.md](/doga-parser/README.md)<br>[CLAUDE.md](/doga-parser/CLAUDE.md) | Analyzes DOGA content using AI and extracts relevant information |
| **Notification Worker** | Processes notification messages and stores them in the database | [README.md](/notification-worker/README.md)<br>[CLAUDE.md](/notification-worker/CLAUDE.md) | Creates notifications from processing results |
| **Email Notification** | Sends email summaries of notifications to users | [README.md](/email-notification/README.md)<br>[CLAUDE.md](/email-notification/CLAUDE.md) | Sends email notifications based on user preferences |

## 🔄 Service Relationships & Communication Flows

The NIFYA platform uses both HTTP/REST and PubSub for service communication:

```
┌──────────────────────┐                               ┌──────────────────────┐
│                      │                               │                      │
│   Client (Browser)   │                               │  Authentication      │
│                      │                               │  Service             │
└───────────┬──────────┘                               └───────────┬──────────┘
            │                                                      │
            │ HTTP/REST                                            │
            │ (JWT Auth)                                           │
            ▼                                                      ▼
┌──────────────────────┐     HTTP/REST      ┌──────────────────────┐
│                      │     (JWT Auth)     │                      │     HTTP/REST
│   Frontend           ├────────────────────►   Backend            ├─────────────────┐
│   (React/TypeScript) │                    │   (Node.js/Express)  │                 │
│                      │◄────────────────────┤                      │                 │
└──────────────────────┘                    └──────────┬─┬──────────┘                 │
                                                       │ │                            │
                                                       │ │                            │
                    ┌───────────────────────────────────┘ │                          │
                    │                                     │                          │
                    │ PubSub Message                      │ PubSub Message           │
                    │ (subscription_created)              │ (notification_created)   │
                    ▼                                     ▼                          ▼
     ┌──────────────────────┐              ┌──────────────────────┐     ┌──────────────────────┐
     │                      │  PubSub      │                      │     │                      │
     │  Subscription        │  Message     │  Notification        │     │  AI Parsers          │
     │  Worker              ├─────────────►│  Worker              │     │  (BOE/DOGA)          │
     │                      │  (results)   │                      │     │                      │
     └──────────┬───────────┘              └──────────┬───────────┘     └──────────────────────┘
                │                                     │                           ▲
                │                                     │                           │
                │ HTTP/REST                           │ PubSub Message            │
                │ (process request)                   │ (email_notification)      │
                ▼                                     ▼                           │
     ┌──────────────────────┐              ┌──────────────────────┐               │
     │                      │              │                      │               │
     │  Parser Services     │              │  Email               │               │
     │  (BOE/DOGA)          ├──────────────┘  Notification        │               │
     │                      │                 Service              │───────────────┘
     └──────────────────────┘              └──────────────────────┘
```

### Basic Data Flows

#### User Authentication Flow
```
User ──► Frontend ──► Authentication Service ──► Database
                            │
                            └───► JWT Token ───► Frontend
```

#### Subscription Creation Flow
```
User ──► Frontend ──► Backend ──► Database
                        │
                        └───► PubSub ───► Subscription Worker
```

#### Notification Flow
```
Subscription Worker ──► AI Parser ──► Subscription Worker ──► PubSub ──► Notification Worker ──► Database
                                                                            │
                                                                            └───► PubSub ───► Email Service ──► User Email
```

## 🔑 Documentation Structure

Each submodule contains its own documentation with detailed information about its functionality, API endpoints, deployment instructions, and more:

1. **README.md** - Primary documentation for each submodule with overview, features, and setup instructions
2. **CLAUDE.md** - AI assistant guidance file with codebase-specific instructions
3. **Additional MD Files** - More specialized documentation for specific features or components

### Where to Find Documentation

- **Frontend Documentation**: `/frontend/README.md`, `/frontend/CLAUDE.md`
- **Authentication Service Documentation**: `/Authentication-Service/README.md`
- **Backend Documentation**: `/backend/README.md`, `/backend/ENDPOINTS.md`
- **Subscription Worker Documentation**: `/subscription-worker/README.md`
- **BOE Parser Documentation**: `/boe-parser/README.md`, `/boe-parser/CLAUDE.md`
- **DOGA Parser Documentation**: `/doga-parser/README.md`, `/doga-parser/CLAUDE.md`
- **Notification Worker Documentation**: `/notification-worker/README.md`, `/notification-worker/CLAUDE.md`
- **Email Notification Documentation**: `/email-notification/README.md`, `/email-notification/CLAUDE.md`
- **Testing Tools Documentation**: `/testing-tools/README.md`

## 🔄 Common Communication Patterns

### HTTP/REST Communication

The following services communicate via REST APIs:

#### Frontend → Authentication Service
- **Protocol**: HTTP/REST
- **Authentication**: None (for login/register) / JWT (for authenticated requests)
- **Key Endpoints**:
  - `POST /api/auth/login`: User authentication
  - `POST /api/auth/register`: User registration
  - `POST /api/auth/refresh`: Token refresh
  - `GET /api/auth/me`: Current user info

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

#### 1. Subscription Worker → Notification Worker
- **Topic**: `processor-results`
- **Protocol**: PubSub
- **Message Format**: Standardized JSON format with version, processor type, and results

#### 2. Backend → Subscription Worker
- **Topic**: `subscription-created` / `subscription-updated`
- **Protocol**: PubSub
- **Message Format**: JSON with subscription details and user ID

#### 3. Notification Worker → Email Service
- **Topic**: `email-notifications`
- **Protocol**: PubSub
- **Message Format**: JSON with notification details and user ID

## 🧰 Development Guide

### Environment Setup

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

### Available Scripts

Each submodule has its own scripts defined in its respective `package.json` file. See the CLAUDE.md file at the root of this repository for common build commands.

### Testing

The repository includes comprehensive testing tools in the `/testing-tools` directory that can be used to test all aspects of the platform. See the [Testing Tools README](/testing-tools/README.md) for more information.

```bash
# Run the test suite for a specific component
cd <component>
npm test

# Run the comprehensive test suite
cd testing-tools
node run-all-tests.js
```

## 🔍 Troubleshooting

When troubleshooting the system, consider the following common integration points:

1. **Authentication Flow**: 
   - Verify JWT tokens are correctly passed and validated
   - Ensure tokens have proper `Bearer ` prefix (note the space)
   - Check that the `X-User-ID` header is included in all authenticated requests
   - Validate that the user ID in the token matches the user ID in the header

2. **Authentication Errors**:
   - `MISSING_HEADERS` error (401): Check Authorization header format, ensure it's `Bearer {token}`
   - `USER_MISMATCH` error (401): Check that the user ID in the token matches the X-User-ID header
   - `TOKEN_EXPIRED` error: Refresh token or re-authenticate

3. **PubSub Messages**: Check message format and topic subscriptions
4. **Database Connections**: Verify RLS context is properly set
5. **Service Health**: Check each service's `/health` endpoint
6. **Service Logs**: Review Cloud Run logs for each service

## 📖 License

Copyright © 2025 NIFYA. All rights reserved.

# Collect All Logs Script

This script automates the collection of all runtime logs from multiple Google Cloud Run services into a single consolidated file with unique identifiers for each log entry.

## Usage

1.  **Ensure Google Cloud SDK is installed and configured:** You need to have `gcloud` installed and authenticated with the necessary permissions to read logs from your Google Cloud project.
2.  **Run the script:** Execute `collect_all_logs.bat` from your command line or terminal.

## Functionality

-   **Creates Directory:** Checks for a `CollectLogs` directory in the current location. If it doesn't exist, it creates one.
-   **Defines Services:** Collects logs from these Cloud Run services:
    -   `backend`
    -   `main_page`
    -   `subscription-worker`
    -   `notification-worker`
    -   `boe-parser`
-   **Consolidates Logs:**
    -   Defines a single output file: `CollectLogs\consolidated_runtime_logs.log`.
    -   **Overwrites** the existing log file every time the script runs to ensure you always have the latest logs.
    -   Assigns each log entry a unique identifier (UUID) in the format: `[YYYYMMDD_HHMMSS_service-name_sequential-number]`.
    -   Collects up to 500 log entries per service (including all severity levels).
    -   Organizes logs by service with clear section headers.
    -   Timestamps the start and end of the collection process.

## Output File

The script generates/overwrites the file `CollectLogs\consolidated_runtime_logs.log`. This file contains all logs from all specified services, with each log entry having a unique identifier prefix for easier tracking and reference.

## Sample Output Format

```
Collecting logs started at 08/04/2025 0:10:15
==========================================

================ LOGS FOR backend - STARTED ================
[20250408_101015_backend_1] Server started on port 8080
[20250408_101015_backend_2] Connected to database successfully
[20250408_101015_backend_3] Error connecting to database: connection refused
================ LOGS FOR backend - COMPLETED ================

================ LOGS FOR main_page - STARTED ================
[20250408_101015_main_page_4] Application started
[20250408_101015_main_page_5] User request received for profile page
================ LOGS FOR main_page - COMPLETED ================
...
```

## Database Schema

The NIFYA platform uses PostgreSQL with a clean, consistent schema. The core tables are:

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Stores user accounts and profile information |
| `subscription_types` | Defines available subscription types (BOE, DOGA, real-estate, etc.) |
| `subscriptions` | User subscriptions for different data sources |
| `subscription_processing` | Tracks processing status of subscriptions |
| `notifications` | Notifications for users based on subscription matches |
| `user_email_preferences` | User preferences for email notifications |

### Schema Management

The database schema is managed through a consolidated single-schema approach:

1. Schema version tracking via the `schema_version` table
2. Consolidated schema file in `backend/consolidated-schema.sql` - the single source of truth
3. Automatic schema initialization on application startup

### Database Initialization

When the backend service starts, it:
1. Checks database connection
2. Loads and applies the consolidated schema
3. Ensures default records exist (subscription types, etc.)

See [Backend Documentation](./backend/README.md) for detailed database implementation information.

## Recent Updates

- **User Settings Implementation**: Added structured storage of user preferences using a JSONB metadata field. See the [detailed documentation](backend/docs/user-settings.md).
