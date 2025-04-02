# NIFYA Backend Testing & Analysis Guide

This comprehensive guide documents the testing, analysis, and troubleshooting approach for the NIFYA backend services.

## Overview

The NIFYA platform consists of multiple microservices that need to work together seamlessly:

- **Authentication Service**: User authentication and authorization
- **Backend API**: Main backend for the web application
- **Subscription Worker**: Handles subscription processing
- **Notification Worker**: Processes notifications for users
- **BOE Parser**: Parses BOE data and sends to notification system

This guide provides tools and methodologies to test and troubleshoot these services.

## Contents

1. [Testing Scripts](#testing-scripts)
2. [User Journey](#user-journey)
3. [API Endpoint Mapping](#api-endpoint-mapping)
4. [Notification Pipeline Analysis](#notification-pipeline-analysis)
5. [Troubleshooting Common Issues](#troubleshooting-common-issues)
6. [Documentation](#documentation)

## Testing Scripts

We've developed several Node.js scripts to test the NIFYA backend services:

### Authentication Testing

`tests/auth/login.js` - Tests authentication with the auth service:

```javascript
// Run with:
node tests/auth/login.js

// This will:
// 1. Send credentials to auth service
// 2. Get an authentication token
// 3. Save token to auth_token.txt
```

### User Profile Testing

`tests/auth/profile.js` - Tests retrieving user profile:

```javascript
// Run with:
node tests/auth/profile.js

// This will:
// 1. Use token from auth/login.js
// 2. Retrieve user profile
// 3. Save profile to profile_response.json
```

### Subscription Testing

`tests/subscriptions/list.js` - Lists user subscriptions:

```javascript
// Run with:
node tests/subscriptions/list.js

// This will:
// 1. Use token from auth/login.js 
// 2. Retrieve user subscriptions
// 3. Save results to subscriptions_response.json
```

`tests/subscriptions/create.js` - Creates new subscription:

```javascript
// Run with:
node tests/subscriptions/create.js

// This will:
// 1. Use token from auth/login.js
// 2. Create a new subscription
// 3. Save subscription ID to latest_subscription_id.txt
```

`tests/subscriptions/process.js` - Processes an existing subscription:

```javascript
// Run with:
node tests/subscriptions/process.js

// This will:
// 1. Use token from auth/login.js
// 2. Process the subscription from latest_subscription_id.txt
// 3. Save processing result
```

### Notification Testing

`tests/notifications/poll.js` - Polls for notifications:

```javascript
// Run with:
node tests/notifications/poll.js

// This will:
// 1. Use token from auth/login.js
// 2. Poll for notifications at regular intervals
// 3. Save results when notifications are found
```

### Comprehensive Testing

`utils/test-runner.js` - Runs all tests in sequence:

```javascript
// Run with:
node utils/test-runner.js all

// This will:
// 1. Run all the above scripts in order
// 2. Track success/failure of each step
// 3. Generate a consolidated report
```

## User Journey

The `tests/user-journeys/standard-flow.js` script simulates the complete user journey from authentication to notification delivery, matching how users interact with the frontend:

```javascript
// Run with:
node tests/user-journeys/standard-flow.js

// This will:
// 1. Authenticate user
// 2. Get user profile
// 3. List subscriptions
// 4. Process subscription
// 5. Poll for notifications
// 6. Generate journey report
```

This script provides detailed logs and helps identify issues in the end-to-end flow.

### Common User Journey Issues

- **Authentication Failures**: Check auth service logs and credentials
- **Missing Subscriptions**: Verify subscription IDs and user permissions
- **Processing Errors**: Check subscription worker logs
- **Missing Notifications**: Analyze notification worker and PubSub logs

## API Endpoint Mapping

The `utils/api-mapper.js` script creates a comprehensive map of all backend endpoints and compares them with frontend usage:

```javascript
// Run with:
node utils/api-mapper.js

// This will:
// 1. Discover endpoints from API explorers and code
// 2. Analyze frontend code for API usage
// 3. Compare and identify mismatches
// 4. Generate comprehensive report
```

This helps identify:
- Missing backend endpoints
- Unused endpoints
- API discrepancies

## Notification Pipeline Analysis

The `tests/analysis/notification-pipeline.js` script specifically focuses on the notification pipeline, which has been showing errors:

```javascript
// Run with:
node tests/analysis/notification-pipeline.js

// This will:
// 1. Check service health
// 2. Analyze message schemas
// 3. Check PubSub configuration
// 4. Analyze error patterns
// 5. Generate recommendations
```

### Known Notification Issues

The main issue identified is a mismatch between the message format produced by the BOE Parser and expected by the Notification Worker:

1. **Schema Mismatch**:
   - BOE Parser sends: `results.results[].matches`
   - Notification Worker expects: `results.matches[]`

2. **Missing DLQ**:
   - The DLQ topic `notification-dlq` doesn't exist

3. **Error Handling**:
   - No recovery mechanism for schema validation failures

## Troubleshooting Common Issues

### Authentication Issues

1. **Wrong Endpoint**: Ensure using `/api/auth/login` not just `/login`
2. **Token Expiration**: Check token expiration and refresh if needed
3. **Network Issues**: Verify service is accessible and responding

### Subscription Processing

1. **Invalid Subscription ID**: Verify ID exists and belongs to user
2. **Processing Queue**: Check if subscription worker is processing requests
3. **Permissions**: Verify user has permission to process subscription

### Notification Pipeline

1. **Message Format**: Check message schema conformance
2. **PubSub Configuration**: Ensure topics and subscriptions exist
3. **Service Health**: Verify all services are running correctly

## Documentation

In addition to these testing scripts, we've created several documentation files:

1. `docs/TESTING-GUIDE.md` - This comprehensive guide
2. `docs/findings/AUTH-SERVICE-ISSUES.md` - Analysis of authentication service issues
3. `docs/findings/NOTIFICATION-PIPELINE-CONCLUSIONS.md` - Analysis of notification pipeline

## Running Tests in Development Environment

Follow these steps to test the backend services:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/NIFYA-Master.git
   cd NIFYA-Master/testing-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the user journey test:
   ```bash
   node tests/user-journeys/standard-flow.js
   ```

4. Analyze API endpoints:
   ```bash
   node utils/api-mapper.js
   ```

5. Analyze notification pipeline:
   ```bash
   node tests/analysis/notification-pipeline.js
   ```

## Conclusion

These testing scripts and documentation provide a comprehensive approach to verify, troubleshoot, and improve the NIFYA backend services. By systematically testing each component and analyzing interactions between services, we can identify and fix issues in the backend pipeline.