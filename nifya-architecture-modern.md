# NIFYA System Architecture - Modern Representation

Below is a modern diagram showing the relationships between all NIFYA microservices:

```mermaid
flowchart TD
    %% Define nodes with URLs
    User([User])
    Frontend[Frontend\nReact/TypeScript\nhttps://clever-kelpie-60c3a6.netlify.app]
    Auth[Authentication Service\nhttps://authentication-service-415554190254.us-central1.run.app]
    Backend[Backend\nhttps://backend-415554190254.us-central1.run.app]
    SubWorker[Subscription Worker\nhttps://subscription-worker-415554190254.us-central1.run.app]
    BOEParser[BOE Parser\nhttps://boe-parser-415554190254.us-central1.run.app]
    DOGAParser[DOGA Parser\nhttps://doga-parser-415554190254.us-central1.run.app]
    NotifWorker[Notification Worker\nhttps://notification-worker-415554190254.us-central1.run.app]
    Email[Email Notification\nhttps://email-notification-415554190254.us-central1.run.app]
    DB[(PostgreSQL\nDatabase)]
    PubSub{{Google Cloud\nPubSub}}

    %% Define connections
    User -->|"Views UI"| Frontend
    User -->|"Receives emails"| Email
    
    Frontend <-->|"HTTP/REST\nJWT Auth"| Auth
    Frontend <-->|"HTTP/REST\nCRUD Operations"| Backend
    
    Backend <-->|"Verify tokens"| Auth
    Backend -->|"Stores/retrieves data"| DB
    Backend -->|"Publishes events"| PubSub
    
    PubSub -->|"subscription events"| SubWorker
    SubWorker -->|"Stores/retrieves data"| DB
    SubWorker -->|"POST /analyze-text"| BOEParser
    SubWorker -->|"POST /analyze-text"| DOGAParser
    SubWorker -->|"Publishes results"| PubSub
    
    PubSub -->|"processor-results"| NotifWorker
    NotifWorker -->|"Stores notifications"| DB
    NotifWorker -->|"Publishes email events"| PubSub
    
    PubSub -->|"email-notifications"| Email
    
    Auth -->|"User data"| DB
    
    %% Styling
    classDef user fill:#f9f,stroke:#333,stroke-width:2px
    classDef frontend fill:#bbf,stroke:#333,stroke-width:2px
    classDef backend fill:#bfb,stroke:#333,stroke-width:2px
    classDef worker fill:#fbf,stroke:#333,stroke-width:2px
    classDef parser fill:#fbb,stroke:#333,stroke-width:2px
    classDef database fill:#bff,stroke:#333,stroke-width:2px
    classDef pubsub fill:#ffb,stroke:#333,stroke-width:2px
    
    class User user
    class Frontend frontend
    class Auth,Backend backend
    class SubWorker,NotifWorker,Email worker
    class BOEParser,DOGAParser parser
    class DB database
    class PubSub pubsub
```

## System Layers

### Client Layer
- **Frontend**: React/TypeScript application that provides the user interface
  - Communicates with Backend for CRUD operations
  - Uses Authentication Service for user management

### API Layer
- **Backend**: Core REST API service that handles business logic
  - Orchestrates subscription management
  - Provides endpoints for the Frontend
  - Publishes events to PubSub for asynchronous processing

- **Authentication Service**: Handles user authentication and authorization
  - Issues and validates JWT tokens
  - Manages user account operations
  - Secures API access

### Processing Layer
- **Subscription Worker**: Processes subscription requests
  - Consumes events from PubSub topics
  - Uses content parsers to analyze official bulletins
  - Generates processing results for notifications

- **BOE Parser**: Specializes in Spanish Official Bulletin analysis
  - Provides AI-powered text analysis
  - Takes prompts and returns relevant documents

- **DOGA Parser**: Specializes in Galician Official Bulletin analysis
  - Similar functionality to BOE Parser, but for DOGA content
  - Takes prompts and returns relevant documents

### Notification Layer
- **Notification Worker**: Creates and manages notifications
  - Consumes processing results from PubSub
  - Stores notifications in the database
  - Triggers email notifications as needed

- **Email Notification**: Delivers email summaries to users
  - Consumes email events from PubSub
  - Formats and sends personalized emails
  - Tracks delivery status

### Data Layer
- **PostgreSQL Database**: Central data store
  - Stores user data, subscriptions, and notifications
  - Implements row-level security (RLS) for data isolation
  - Shared across services with appropriate access controls

### Messaging Layer
- **Google Cloud PubSub**: Asynchronous messaging service
  - Decouples services for better scalability
  - Manages message queues between components
  - Provides reliable message delivery

## Communication Protocols

1. **HTTP/REST**:
   - Frontend ↔ Backend
   - Frontend ↔ Authentication Service
   - Subscription Worker ↔ Content Parsers (BOE/DOGA)

2. **PubSub Messaging**:
   - Backend → Subscription Worker
   - Subscription Worker → Notification Worker
   - Notification Worker → Email Service

3. **Database Access**:
   - All services → PostgreSQL Database (with appropriate permissions)

## Deployment Information

All services are deployed on Google Cloud Run, providing:
- Automatic scaling
- High availability
- Containerized deployment
- Secure service-to-service communication 