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

# Run all tests
npm run test:all
```

### Test Runners

Several test runners are available to run different test suites:

```bash
# Run all tests
node run-all-tests.js

# Run specific test suites
node run-auth-tests.js
node run-subscription-tests.js
node run-notification-tests.js
node run-user-profile-tests.js
node run-template-tests.js
node run-explorer-tests.js
node run-integration-tests.js
```

## 📊 Test Categories

### Authentication Tests

Verify login functionality, token management, session validation, and profile access.

```bash
# Run comprehensive authentication tests
node run-auth-tests.js

# or individual tests
node tests/auth/login.js
```

### User Profile Tests

Test user profile management, notification settings, and email preferences.

```bash
# Run user profile tests
node run-user-profile-tests.js
```

### Subscription Tests

Test subscription creation, listing, and processing.

```bash
# Run comprehensive subscription management tests
node run-subscription-tests.js

# Run specific tests
node tests/subscriptions/create.js
node tests/subscriptions/list.js
node tests/subscriptions/process.js
```

### Template Tests

Test template management including listing, details, creation, and subscribing from templates.

```bash
# Run template tests
node run-template-tests.js
```

### Notification Tests

Verify notification retrieval, management, and activity tracking.

```bash
# Comprehensive notification management tests
node run-notification-tests.js

# Individual tests
node tests/notifications/poll.js
node tests/notifications/activity.js
node tests/notifications/delete-all.js
```

### API Explorer Tests

Test API documentation endpoints.

```bash
# Run API explorer tests
node run-explorer-tests.js
```

### Integration Tests

Test functionality across multiple services (notification worker, subscription worker, backend, authentication).

```bash
# Run all integration tests
node run-integration-tests.js

# Run specific integration test
node tests/integration/subscription-journey-test.js
```

## 📝 Test Outputs

Test results are saved to the `outputs` directory:

- `outputs/comprehensive-tests/`: JSON result files and summaries
- `outputs/logs/`: Detailed logs for each test execution
- `outputs/responses/`: Raw API responses captured during testing
- `outputs/reports/`: Human-readable markdown reports
- `outputs/findings/`: Test findings and issue reports

See [Debug Endpoints Guide](./docs/DEBUG-ENDPOINTS-GUIDE.md) for information about backend debugging capabilities.

## 📋 Test Implementation

### Core Components

- **API Client** (`core/api-client.js`): Handles authenticated requests
- **Logger** (`core/logger.js`): Structured logging with levels and timestamps
- **Endpoints** (`config/endpoints.js`): Configuration for all testable endpoints
- **Test Runner** (`utils/test-runner.js`): Consistent test execution framework

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
4. Add the test to the relevant test runner

## 📄 Test Coverage

The testing tools now provide coverage for approximately 95% of documented API endpoints, including:

- Authentication service endpoints
- Subscription management endpoints
- Notification system endpoints
- Template management endpoints
- API explorer documentation endpoints
- Health and diagnostic endpoints

See the [Test Coverage Analysis](./outputs/reports/test-coverage-analysis.md) for detailed information.

## 📄 License

UNLICENSED - © NIFYA Team