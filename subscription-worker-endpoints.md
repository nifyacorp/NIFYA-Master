# Subscription Worker API Endpoints

This document provides a comprehensive list of all endpoints available in the NIFYA Subscription Worker service.

## Base URL
`https://subscription-worker-415554190254.us-central1.run.app`

## Health Check Endpoints

### Check Service Health
- **URL**: `/health` or `/api/health` or `/_health`
- **Method**: `GET`
- **Description**: Checks if the service and database are running correctly
- **Response**: Health status details

## Subscription Processing Endpoints

### Process Single Subscription
- **URL**: `/api/subscriptions/process/:id`
- **Method**: `POST`
- **Description**: Queues a specific subscription for asynchronous processing with dynamic parser selection
- **Parameters**: 
  - `id`: Subscription ID (UUID)
- **Process**:
  1. Retrieves subscription details including `type_id`
  2. Retrieves the parser URL from the `subscription_types` table
  3. Dynamically configures the parser client with the appropriate URL
  4. Sends the request to the correct parser service based on subscription type
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "Subscription queued for processing",
    "processing_id": "uuid",
    "subscription_id": "uuid"
  }
  ```

### Get Pending Subscriptions
- **URL**: `/api/subscriptions/pending`
- **Method**: `GET`
- **Description**: Retrieves a list of subscription processing records currently in a pending state
- **Response**: List of pending subscription processing records with details

### Process Batch Subscriptions
- **URL**: `/api/subscriptions/batch/process`
- **Method**: `POST`
- **Description**: Triggers the processing of pending subscriptions
- **Response**: Batch processing status information

## Legacy Endpoints (Redirected)

The following legacy endpoints are now redirected to the primary endpoint:

- `/process-subscription/:id` → `/api/subscriptions/process/:id`
- `/subscriptions/process/:id` → `/api/subscriptions/process/:id`

## Parser-Specific Endpoints

### BOE Parser Integration (To be deprecated)
- **URL**: `/api/boe/process`
- **Method**: `POST` 
- **Description**: Forward requests to the BOE parser service directly
- **Note**: This endpoint will be deprecated in favor of the dynamic parser selection in the main endpoint

## API Documentation

- **URL**: `/api`
- **Method**: `GET`
- **Description**: Returns API documentation with available endpoints
- **Response**: JSON object containing endpoint documentation 