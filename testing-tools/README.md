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

## 📊 Test Categories

### Authentication Tests

Verify login functionality and token management.

```bash
npm run test:auth
# or individual tests
node tests/auth/login.js
node tests/auth/test-login.js
```

### Subscription Tests

Test subscription creation, listing, and processing.

```bash
npm run test:subscriptions
# or individual tests
node tests/subscriptions/create.js
node tests/subscriptions/list.js
node tests/subscriptions/minimal-create.js
node tests/subscriptions/process.js
node tests/subscriptions/templates.js
```

### Notification Tests

Verify notification retrieval, polling, and activity tracking.

```bash
npm run test:notifications
# or individual tests
node tests/notifications/basic-list.js
node tests/notifications/poll.js
node tests/notifications/activity.js
node tests/notifications/get-by-entity.js
```

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