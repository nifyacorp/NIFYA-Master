# NIFYA Master Repository

This repository serves as the central hub for the NIFYA project, containing various interconnected microservices that work together to provide the NIFYA platform. NIFYA aims to deliver timely notifications and insights derived from official Spanish bulletins (like BOE and DOGA) to its users.

## Architecture Overview

NIFYA employs a microservices architecture to ensure modularity, scalability, and independent development cycles for different parts of the application. The services communicate primarily through REST APIs and potentially asynchronous messaging queues (e.g., Google Cloud Pub/Sub) for background tasks.

## File Structure

This master repository utilizes Git submodules to manage the code for each individual microservice. Each subdirectory corresponds to a specific service with its own codebase, dependencies, and deployment configuration.

```
NIFYA-Master/
├── frontend/           # Submodule for the user interface
├── backend/            # Submodule for the core API
├── subscription-worker/ # Submodule for subscription management
├── boe-parser/         # Submodule for BOE parsing
├── doga-parser/        # Submodule for DOGA parsing
├── notification-worker/ # Submodule for notification processing
├── email-notification/ # Submodule for sending email notifications
└── README.md           # This file
```

## Microservices

The following table lists the core microservices within the NIFYA ecosystem:

| Service              | Description                                                      | Deployment URL                                                       | Technology Stack (Assumed) |
|----------------------|------------------------------------------------------------------|----------------------------------------------------------------------|--------------------------|
| Frontend             | User interface and client-side application                       | https://clever-kelpie-60c3a6.netlify.app                             | React/Vue/Angular?       |
| Backend              | Core API, business logic, and data orchestration                 | https://backend-415554190254.us-central1.run.app                     | Node.js/Python/Go?       |
| Subscription Worker  | Manages user subscriptions and billing cycles                    | https://subscription-worker-415554190254.us-central1.run.app         | Node.js/Python/Go?       |
| BOE Parser           | AI-powered analysis of Spanish Official Bulletin (BOE)           | https://boe-parser-415554190254.us-central1.run.app                 | Python? (AI/ML focus)    |
| DOGA Parser          | AI-powered analysis of Galician Official Bulletin (DOGA)         | https://doga-parser-415554190254.us-central1.run.app                 | Python? (AI/ML focus)    |
| Notification Worker  | Processes parsed bulletin data into user notifications           | https://notification-worker-415554190254.us-central1.run.app         | Node.js/Python/Go?       |
| Email Notification   | Sends email summaries of notifications to subscribed users       | https://email-notification-415554190254.us-central1.run.app       | Node.js/Python/Go?       |

*(Note: Technology stack is assumed and may vary)*

## Inter-Service Communication Flow

1.  **User Interaction:** Users interact with the `Frontend`.
2.  **Authentication:** The `Frontend` handles authentication using Firebase.
3.  **API Requests:** Authenticated requests from the `Frontend` are directed to the `Backend` API.
4.  **Backend Orchestration:** The `Backend` handles core business logic. It verifies Firebase tokens, manages user data, interacts with subscription status (potentially via `Subscription Worker`), and coordinates notification preferences.
5.  **Parsing:** The `BOE Parser` and `DOGA Parser` independently fetch and analyze official bulletins. Upon finding relevant information, they likely publish events (e.g., to a Pub/Sub topic).
6.  **Notification Processing:** The `Notification Worker` subscribes to events from the parsers. It processes this information, determines which users should be notified based on their preferences and subscription status (potentially querying the `Backend` or a shared database), and stores the notifications. It might also publish another event to trigger email sending.
7.  **Email Delivery:** The `Email Notification` service subscribes to events from the `Notification Worker` and sends formatted email summaries to users.
8.  **Subscription Management:** The `Subscription Worker` handles tasks related to subscription lifecycles (e.g., renewals, cancellations), potentially triggered by the `Backend` or scheduled jobs.

*(Note: This describes a likely communication flow. Specific implementation details like direct API calls vs. message queues might vary between services.)*

## Deployment & Configuration

-   **Frontend:** Deployed via Netlify.
-   **Backend Services:** Deployed as containerized applications on Google Cloud Run.
-   **Secrets Management:** Configuration secrets (API keys, database credentials, etc.) are managed using Google Secret Manager or injected as Runtime Environment Variables in Cloud Run. **`.env` files are not used for deployment.** Builds happen entirely within the Cloud environment to securely access these secrets.

## Development Workflow

1.  Navigate into the specific submodule directory you wish to modify (e.g., `cd backend/`).
2.  Make your code changes.
3.  Commit your changes within the submodule directory (`git add .`, `git commit -m "Your commit message"`).
4.  Push the changes for the submodule (`git push`).
5.  Navigate back to the root `NIFYA-Master` directory (`cd ..`).
6.  Add the updated submodule reference (`git add <submodule_directory>`).
7.  Commit the submodule update (`git commit -m "Update <submodule_directory>"`).
8.  Push/sync the master repository (`git push`).
9.  Pushing changes triggers the respective Cloud Build pipeline for the modified service. Monitor the build and deployment process in Google Cloud Console or Netlify.

## Testing

Automated tests, potentially using tools like Puppeteer for end-to-end testing of the `Frontend`, should be maintained within each relevant submodule. Consistent use of testing scripts helps identify regressions and bugs introduced during development.
