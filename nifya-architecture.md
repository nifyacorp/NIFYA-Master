# NIFYA System Architecture Diagram

Below is a diagram that illustrates the relationships and data flows between the different NIFYA submodules:

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

## Functional Relationships

The diagram above illustrates the following key relationships:

1. **User Interaction Layer**
   - Users interact with the Frontend to view content and create/manage subscriptions
   - Frontend authenticates users via the Authentication Service
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

## Data Flows

### Subscription Creation Flow
1. User creates a subscription via Frontend
2. Frontend sends request to Backend
3. Backend stores subscription and publishes event to PubSub
4. Subscription Worker processes the subscription
5. Worker uses specialized parsers (BOE/DOGA) as needed
6. Results are published to PubSub

### Notification Flow
1. Notification Worker consumes processing results from PubSub
2. Worker creates notifications in the database
3. Worker publishes email notification events to PubSub
4. Email Service sends emails to users
5. Users view notifications in Frontend (via Backend API)

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | https://clever-kelpie-60c3a6.netlify.app |
| Authentication Service | https://authentication-service-415554190254.us-central1.run.app |
| Backend | https://backend-415554190254.us-central1.run.app |
| Subscription Worker | https://subscription-worker-415554190254.us-central1.run.app |
| BOE Parser | https://boe-parser-415554190254.us-central1.run.app |
| DOGA Parser | https://doga-parser-415554190254.us-central1.run.app |
| Notification Worker | https://notification-worker-415554190254.us-central1.run.app |
| Email Notification | https://email-notification-415554190254.us-central1.run.app | 