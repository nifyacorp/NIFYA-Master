# NIFYA Microservices Collection

A collection of independent microservices that power the backend implementation of NIFYA platform.

## ⚠️ IMPORTANT: Repository Structure ⚠️

**This is NOT a monolithic application. This is a repository of repositories (monorepo) containing multiple INDEPENDENT microservices.**

Each directory at the root level represents a completely independent service with its own:
- Dependencies (package.json)
- Runtime environment
- Database connections
- Deployment pipeline
- Scalability parameters

These services should NEVER be merged together or refactored into a monolithic structure.

## Microservices Overview

- **Authentication-Service/** - Handles user authentication and token management
- **backend/** - Main API gateway service
- **boe-parser/** - Service for parsing BOE (Boletín Oficial del Estado) data
- **doga-parser/** - Service for parsing DOGA (Diario Oficial de Galicia) data
- **email-notification/** - Service for sending emails and notifications
- **notification-worker/** - Service for managing notifications and alerts
- **subscription-worker/** - Service for managing user subscriptions
- **frontend/** - Frontend application (incorporated as a submodule from https://github.com/nifyacorp/main_page)

Each service is designed to be deployed independently to Google Cloud Run.

## System Architecture and Workflow

The NIFYA system follows a microservices architecture with distinct components that work together to provide subscription-based notifications for official bulletins and other data sources. Here's how the components interact:

### 1. Templates and Subscriptions Flow

**Templates** are pre-defined subscription patterns stored in the **backend** service:
- Built-in templates are defined in code (`backend/src/core/subscription/data/built-in-templates.js`)
- Custom templates can be created by users and stored in the database
- Templates specify a data source type (e.g., BOE, real estate), keywords/prompts, and frequency

**Subscriptions** are created when users select a template:
- Users can customize the prompts or frequency when subscribing
- Subscriptions are stored in the database with reference to their template type
- Each subscription is tied to a specific user and includes processing metadata

### 2. Subscription Processing Flow

**Subscription Worker** handles the execution of subscriptions:
- Triggered manually via the "Procesar" button in frontend or on a schedule
- When triggered, the backend sends a request to the subscription-worker
- The worker retrieves the subscription details including type, prompts, and frequency
- Based on the subscription type, it determines which parser to use (e.g., BOE)

**Parsing Process**:
- The subscription worker sends the prompts to the appropriate parser (e.g., BOE-Parser)
- The parser analyzes the latest publications for matches against the prompts
- Matches are returned to the Subscription Worker for processing
- The Subscription Worker then publishes matches to Google Cloud Pub/Sub as notification messages

### 3. Notification Flow

**Notification Worker** processes the messages from Pub/Sub:
- Listens continuously for new messages
- Validates and processes incoming messages based on their type
- Creates notifications in the database for each match
- Enriches notification content with type-specific metadata
- Handles errors and publishes failed messages to a Dead Letter Queue

**User Notifications**:
- The frontend polls for new notifications for the logged-in user
- Email notifications can be sent via the email-notification service

### 4. Component Responsibilities

The system follows a clear separation of responsibilities:

- **BOE/DOGA Parser Services**: Focus solely on content analysis - search through publications with provided prompts and return matches. They do not create notifications or interact with the notification system directly.

- **Subscription Worker**: Orchestrates the entire process - retrieves subscription details, calls appropriate parsers, publishes notification messages to Pub/Sub, and updates subscription processing status.

- **Notification Worker**: Processes notification messages, creates database entries, and triggers email notifications when appropriate.

This architecture ensures loose coupling between components and allows each service to focus on its core responsibility.

## Deployment Architecture

This project follows a strict microservices architecture pattern:

- Each service has its own independent codebase and should be modified separately
- Services communicate with each other via HTTP/REST APIs only
- Each service is separately containerized and deployed to Google Cloud Run
- Services can scale independently based on demand
- Authentication is handled by the dedicated Authentication-Service

## Technology Stack

- **Runtime**: Node.js
- **API Framework**: Express.js
- **Databases**: MongoDB, PostgreSQL (varies by service)
- **Deployment**: Google Cloud Run
- **CI/CD**: GitHub Actions
- **Frontend**: React deployed to Netlify at https://clever-kelpie-60c3a6.netlify.app/

## Development Guidelines

### ⚠️ Working with Individual Services

Each service MUST be treated as an independent application:

```bash
# Navigate to a specific service
cd Authentication-Service

# Install dependencies for that service only
npm install

# Run that service locally
npm run dev

# Make changes only to this specific service
# DO NOT modify shared code across services as they are independent
```

### Code Modification Guidelines

When modifying code:
- Always make changes within a single service directory
- Never create dependencies between services except through their published APIs
- Each service should have its own environment variables
- Each service should have its own database connections
- Never refactor across service boundaries

### Working with the Frontend Submodule

The frontend is maintained as a Git submodule:

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/your-org/NIFYA-Master.git

# Or if already cloned, initialize submodules
git submodule update --init --recursive

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run frontend locally
npm run dev
```

### CORS Configuration

When developing locally, ensure each service has proper CORS configuration to allow requests from:
- https://clever-kelpie-60c3a6.netlify.app (production frontend)
- http://localhost:5173 (Vite development server)

The frontend connects to each service independently, not through a unified API gateway.

## Deployment

Each service MUST be deployed to Google Cloud Run independently:

```bash
# Example deployment to Google Cloud Run
cd Authentication-Service

# Build the container
gcloud builds submit --tag gcr.io/project-id/auth-service

# Deploy to Cloud Run
gcloud run deploy auth-service --image gcr.io/project-id/auth-service --platform managed
```

## Service Communication

Services communicate with each other through their public APIs only. Direct database or file system sharing between services is prohibited by design.

This ensures proper service isolation and allows for independent scaling and deployment.
