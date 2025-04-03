# NIFYA Testing Tools

A comprehensive suite of testing tools for the NIFYA platform, focusing on API validation, user journey testing, and diagnostics.

## 🔍 Overview

This testing toolkit provides a flexible and powerful way to validate the NIFYA platform's functionality. The tools cover API endpoint testing, user journey simulation, diagnostics, and frontend integration validation.

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18.0.0
- Access to NIFYA services (authentication, backend, subscription worker)

### Installation

```bash
# Install dependencies
npm install

# Run all tests (legacy method)
npm run test:all

# Run all tests using the new test runner
node index.js run-all
```

### New Test Runner

A unified test runner is now available to run any or all test types:

```bash
# Show available commands
node index.js help

# List available test types
node index.js list

# Run specific test types
node index.js run subscription   # Test subscription endpoints
node index.js run user-profile   # Test user profile endpoints
node index.js run notification   # Test notification endpoints
node index.js run integration    # Test cross-service functionality

# Run all test types
node index.js run-all
```

## 📊 Test Categories

### Authentication Tests

Verify login functionality, token management, session validation, and profile access.

```bash
# Run comprehensive authentication tests
node run-auth-tests.js

# Run as part of the test suite
node index.js run auth

# or individual tests
node tests/auth/login.js
node tests/auth/test-login.js
```

The comprehensive authentication tests verify:
- Login and token acquisition
- User profile retrieval
- Session validation and management
- Token refresh functionality
- Session revocation

### User Profile Tests

Test user profile management, notification settings, and email preferences.

```bash
# Run user profile tests
node run-user-profile-tests.js

# Run as part of the test suite
node index.js run user-profile
```

### Subscription Tests

Test subscription creation, listing, and processing.

```bash
# Run all subscription tests (basic)
npm run test:subscriptions

# Run comprehensive subscription management tests
node run-subscription-tests.js

# Run specific tests
node tests/subscriptions/create.js
node tests/subscriptions/list.js
node tests/subscriptions/minimal-create.js
node tests/subscriptions/process.js
node tests/subscriptions/templates.js
```

#### New Subscription Management Test Suite

A comprehensive test suite for all subscription management endpoints:

```bash
# Run all subscription management tests
node run-subscription-tests.js

# Run a specific test suite
node run-subscription-tests.js run subscription-manager
```

This tests:
- Create/read/update/delete operations
- Subscription processing
- Subscription status toggling
- Subscription sharing
- Multiple subscription types

### Notification Tests

Verify notification retrieval, management, and activity tracking.

```bash
# Legacy tests
npm run test:notifications
# or individual legacy tests
node tests/notifications/basic-list.js
node tests/notifications/poll.js
node tests/notifications/activity.js
node tests/notifications/get-by-entity.js

# Comprehensive notification management tests
node run-notification-tests.js   # Run all notification tests
node index.js run notification   # Run via the unified test runner
```

The comprehensive notification tests verify:
- Retrieving notifications with filtering
- Marking notifications as read/unread
- Deleting notifications
- Notification statistics and activity
- Query parameter handling

### Health and Diagnostics Tests

Check system health and database status.

```bash
npm run test:diagnostics
# or individual tests
node tests/health/health.js
node tests/admin/diagnose-database.js
```

### User Journey Tests

End-to-end workflow tests from authentication to notification processing.

```bash
# Standard journey test
npm run test:journey

# Enhanced journey test with debug capabilities
npm run test:enhanced-journey

# Or individual tests
node tests/user-journeys/standard-flow.js
node tests/user-journeys/enhanced-flow.js
```

See [User Journey Tests Guide](./docs/USER-JOURNEY-TESTS.md) for detailed information.

### Comprehensive API Tests

Test all configured API endpoints in a single run.

```bash
node tests/comprehensive-endpoint-test.js
```

### Cross-Service Integration Tests

Test functionality across multiple services (notification worker, subscription worker, backend, authentication).

```bash
# Run all integration tests
node run-integration-tests.js

# Run specific notification pipeline test
node test-notification-pipeline.js
```

These tests verify:
- End-to-end notification pipeline
- Cross-service communication
- Worker service functionality

### Post-Fix Verification

Validate that specific issues have been fixed.

```bash
node post-fix-test.js
```

## 📝 Test Outputs

Test results are saved to the `outputs` directory:

- `outputs/comprehensive-tests/`: JSON result files and summaries
- `outputs/logs/`: Detailed logs for each test execution
- `outputs/responses/`: Raw API responses captured during testing
- `outputs/reports/`: Human-readable markdown reports
- `outputs/findings/`: Test findings and issue reports
- `outputs/debug/`: Debug information from backend debug endpoints

See [Debug Endpoints Guide](./docs/DEBUG-ENDPOINTS-GUIDE.md) for information about backend debugging capabilities.

### Example Output

```
[2025-04-02T07:15:24.485Z] [INFO] Starting authentication test
[2025-04-02T07:15:24.485Z] [INFO] Sending authentication request to: authentication-service-415554190254.us-central1.run.app/api/auth/login
[2025-04-02T07:15:25.612Z] [SUCCESS] Authentication successful! Access token saved
[2025-04-02T07:15:25.614Z] [INFO] User ID saved: 12345-abcde-67890
[2025-04-02T07:15:25.616Z] [SUCCESS] Authentication test completed successfully
```

## 🧩 Frontend Integration Testing

### Mock API Server

Provides a transparent proxy for frontend-backend communication with request logging.

```bash
npm run start:proxy
```

### Network Validation

Tools for analyzing API communication patterns and identifying issues.

```bash
# Located in:
frontend-tests/network-validation/
```

### Debug Dashboard

A React component that can be integrated into frontend applications for real-time API monitoring.

```jsx
// Located in:
frontend-tests/ui-components/DebugDashboard.jsx
```

## 🛠️ Key Features

### Authentication Handling

- Proper token format (Bearer) validation
- User ID extraction and verification
- Authorization header construction

### Comprehensive Coverage

- Tests all API endpoints with correct methods
- Validates both success and error cases
- Verifies data formatting and response structure

### Detailed Reporting

- Success rates by category and overall
- Detailed logs of failed tests with context
- Historical test results for comparison

### Real-world Scenarios

- User journey tests simulate actual user workflows
- Frontend integration tests use real API interactions
- Post-fix verification confirms issue resolution

## 📋 Test Implementation

### Core Components

- **API Client** (`core/api-client.js`): Handles authenticated requests
- **Logger** (`core/logger.js`): Structured logging with levels and timestamps
- **Endpoints** (`config/endpoints.js`): Configuration for all testable endpoints

### Test Structure

Each test follows a standard pattern:

1. Setup phase (initialize resources, authenticate if needed)
2. Execution phase (make API requests, verify responses)
3. Reporting phase (log results, save responses)
4. Cleanup phase (if applicable)

### Adding New Tests

1. Create a new test file in the appropriate directory
2. Use the API client and logger for consistency
3. Export a main function that returns `{success: true/false, error: string}`
4. Add the test to the relevant test script in `package.json`

## 📄 License

UNLICENSED - © NIFYA Team