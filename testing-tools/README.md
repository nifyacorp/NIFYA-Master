# NIFYA Testing Toolkit

A comprehensive suite of tools for testing the NIFYA platform, including backend API tests, frontend communication tests, and end-to-end test flows.

## 📋 Overview

The NIFYA Testing Toolkit provides a collection of scripts and utilities designed to verify the functionality and integration of all NIFYA platform components:

- **Backend API Testing**: Verify endpoints, authentication, and data operations
- **Frontend Communication**: Monitor and analyze API requests between frontend and backend
- **End-to-End Testing**: Test complete user flows from frontend to backend
- **Performance Testing**: Measure response times and throughput
- **Diagnostic Tools**: Debug and troubleshoot issues across the platform

## 📂 Directory Structure

```
testing-tools/
├── config/               # Configuration files
│   ├── auth.config.js    # Authentication testing config
│   ├── backends.js       # Backend endpoints config
│   └── test-users.js     # Test user credentials
├── core/                 # Core testing utilities
│   ├── api-client.js     # API request client
│   ├── jwt-helper.js     # JWT token utilities
│   ├── logger.js         # Structured logging
│   └── test-runner.js    # Test execution engine
├── docs/                 # Documentation
│   ├── TEST-GUIDE.md     # Comprehensive testing guide
│   └── backend-endpoints-reference.md # API endpoint reference
├── frontend-tests/       # Frontend testing tools
│   ├── api-monitor/      # API request monitoring tools
│   │   ├── request-logger.js # Records all API calls
│   │   └── response-validator.js # Validates API responses
│   ├── mock-server/      # Mock API server
│   │   ├── mock-api-server.js # API proxy for testing
│   │   └── mock-responses/ # Predefined responses
│   ├── network-validation/ # Network request validation
│   │   ├── cors-tester.js # CORS configuration testing
│   │   └── header-validator.js # HTTP header validation
│   └── ui-components/    # Debug UI components
│       ├── api-debugger.jsx # API request visualizer 
│       └── token-inspector.jsx # JWT token inspector
├── outputs/              # Test outputs and logs
│   ├── comprehensive-tests/ # Full test run results
│   ├── frontend-logs/    # Frontend request logs
│   ├── logs/             # Detailed test logs
│   └── reports/          # Test reports and summaries
└── tests/                # Test scripts
    ├── auth/             # Authentication tests
    │   ├── login.js      # Login flow tests
    │   ├── refresh-token.js # Token refresh tests
    │   └── user-sync.js  # User synchronization tests
    ├── notifications/    # Notification tests
    │   ├── create-notification.js # Creation tests
    │   └── notification-delivery.js # Delivery tests
    ├── subscriptions/    # Subscription tests
    │   ├── create-subscription.js # Creation tests
    │   ├── process-subscription.js # Processing tests
    │   ├── subscription-validation.js # Validation tests
    │   └── subscription-deletion.js # Deletion tests
    └── user-journeys/    # End-to-end user flows
        ├── full-subscription-flow.js # Complete subscription flow
        └── notification-interaction.js # Notification interaction flow
```

## 🚀 Key Features

### API Testing Tools

#### Core API Client (`core/api-client.js`)

Central API client for all test requests:

```javascript
/**
 * Performs an authenticated API request
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} options.endpoint - API endpoint
 * @param {Object} options.data - Request body data
 * @param {Object} options.user - User credentials
 * @returns {Promise<Object>} Response data
 */
async function authenticatedRequest(options) {
  // Get token for user
  // Prepare headers with authorization
  // Send request
  // Handle response
  // Return data or error
}
```

#### JWT Helper (`core/jwt-helper.js`)

JWT token utilities for testing:

```javascript
/**
 * Creates a test JWT token
 * @param {string} userId - User ID to include in token
 * @param {Object} claims - Additional claims
 * @returns {string} JWT token
 */
function createTestToken(userId, claims = {}) {
  // Generate token with test secret
  // Add standard claims
  // Return signed token
}

/**
 * Decodes and validates a JWT token
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
function decodeToken(token) {
  // Decode token
  // Verify signature
  // Return payload
}
```

### Subscription Testing Tools

#### Subscription Creation Test (`tests/subscriptions/create-subscription.js`)

Tests subscription creation functionality:

```javascript
/**
 * Tests subscription creation with valid data
 */
async function testValidSubscriptionCreation() {
  // Prepare test user
  // Create test subscription
  // Verify response structure
  // Validate created subscription in database
  // Assert success
}

/**
 * Tests subscription creation with invalid data
 */
async function testInvalidSubscriptionCreation() {
  // Prepare test cases with invalid data
  // Try creating subscriptions
  // Verify proper error responses
  // Assert failure cases handled correctly
}
```

#### Subscription Processing Test (`tests/subscriptions/process-subscription.js`)

Tests subscription processing flow:

```javascript
/**
 * Tests the complete subscription processing flow
 */
async function testSubscriptionProcessing() {
  // Create a subscription
  // Trigger processing
  // Poll for status updates
  // Verify processing completed
  // Check for generated notifications
  // Assert successful processing
}
```

### Notification Testing Tools

#### Notification Delivery Test (`tests/notifications/notification-delivery.js`)

Tests notification delivery through various channels:

```javascript
/**
 * Tests real-time notification delivery
 */
async function testRealtimeNotifications() {
  // Setup WebSocket connection
  // Create test notification
  // Verify notification received via WebSocket
  // Assert delivery time within tolerance
}

/**
 * Tests email notification delivery
 */
async function testEmailNotifications() {
  // Setup test email account
  // Update user preferences to enable email notifications
  // Create test notification
  // Verify email delivered
  // Validate email content
}
```

### Authentication Testing Tools

#### User Synchronization Test (`tests/auth/user-sync.js`)

Tests the user synchronization between authentication and backend:

```javascript
/**
 * Tests user synchronization between auth and backend
 */
async function testUserSynchronization() {
  // Create test user in auth service
  // Generate valid JWT token
  // Make authenticated request to backend
  // Verify user automatically created in backend
  // Check user data correctly synchronized
}

/**
 * Tests synchronization with incomplete user data
 */
async function testPartialDataSynchronization() {
  // Create token with minimal user data
  // Make authenticated request
  // Verify user created with defaults
  // Assert default values applied correctly
}
```

### End-to-End Test Flows

#### Full Subscription Flow (`tests/user-journeys/full-subscription-flow.js`)

Tests the complete subscription lifecycle:

```javascript
/**
 * Tests the complete subscription lifecycle
 */
async function testFullSubscriptionLifecycle() {
  // Authenticate user
  // Create subscription
  // Process subscription
  // Wait for notifications
  // Interact with notifications
  // Update subscription
  // Delete subscription
  // Verify all operations successful
}
```

## 🧪 Running Tests

### Single Test

To run a single test file:

```bash
# Run a specific test file
node tests/auth/login.js

# Run with debug output
DEBUG=1 node tests/auth/login.js

# Run against production environment
ENV=production node tests/auth/login.js
```

### Test Suites

To run a group of related tests:

```bash
# Run all authentication tests
node run-suite.js auth

# Run all subscription tests
node run-suite.js subscriptions

# Run all end-to-end tests
node run-suite.js user-journeys
```

### Comprehensive Test Run

To run all tests and generate a detailed report:

```bash
# Run all tests
node run-all-tests.js

# Run all tests with additional diagnostic information
node run-all-tests.js --diagnostics

# Run all tests in parallel (faster but less detailed logging)
node run-all-tests.js --parallel
```

## 📝 Test Results and Reporting

All test results are saved to the `outputs` directory:

- **Detailed Logs**: `outputs/logs/[test-name]-[timestamp].log`
- **Summary Reports**: `outputs/reports/summary-[timestamp].json`
- **HTML Reports**: `outputs/reports/report-[timestamp].html`

Example of generated report structure:

```javascript
{
  "testRun": {
    "timestamp": "2025-04-02T14:30:22.123Z",
    "environment": "development",
    "duration": 12450,
    "passRate": 0.95
  },
  "results": {
    "total": 87,
    "passed": 83,
    "failed": 4,
    "skipped": 0
  },
  "suites": [
    {
      "name": "Authentication",
      "tests": 15,
      "passed": 15,
      "failed": 0
    },
    {
      "name": "Subscriptions",
      "tests": 42,
      "passed": 38,
      "failed": 4
    },
    // ...more suites
  ],
  "failureDetails": [
    {
      "test": "Process subscription with invalid prompts",
      "file": "tests/subscriptions/process-subscription.js",
      "error": "Expected status 400 but got 500",
      "stack": "..."
    },
    // ...more failures
  ]
}
```

## 🔧 Configuration

### Environment Configuration

Create a `.env` file to configure test environments:

```env
# Test environments
TEST_DEV_URL=http://localhost:3000
TEST_STAGING_URL=https://staging-backend-415554190254.us-central1.run.app
TEST_PROD_URL=https://backend-415554190254.us-central1.run.app

# Test users
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123

# JWT settings
TEST_JWT_SECRET=test-secret-key

# Logging
LOG_LEVEL=info
SAVE_RESPONSES=true
```

### Test User Configuration

Configure test users in `config/test-users.js`:

```javascript
// Test user definitions
const testUsers = {
  // Admin user for admin-level API tests
  admin: {
    email: 'admin@nifya.test',
    password: process.env.ADMIN_TEST_PASSWORD,
    role: 'admin'
  },
  
  // Regular user for standard tests
  standard: {
    email: 'user@nifya.test',
    password: process.env.USER_TEST_PASSWORD,
    role: 'user'
  },
  
  // New user for registration/onboarding tests
  new: {
    email: `new-user-${Date.now()}@nifya.test`,
    password: 'NewUser12345!',
    role: 'user'
  }
};
```

## 🌐 Mock API Server

The testing toolkit includes a mock API server for frontend testing:

```bash
# Start the mock API server
node frontend-tests/mock-server/mock-api-server.js

# Start with specific port
PORT=3001 node frontend-tests/mock-server/mock-api-server.js

# Start with response delay (ms)
DELAY=200 node frontend-tests/mock-server/mock-api-server.js
```

This mock server will:
1. Record all API requests
2. Return configurable mock responses
3. Simulate backend behavior for frontend testing
4. Log all interactions for debugging

## 📈 Recent Test Results

The most recent test run identified the following issues:

1. **Authentication and basic infrastructure tests**: All passing ✅
2. **Subscription creation with user synchronization**: Fixed with auth middleware updates ✅
3. **Notification endpoints**: Working but with some timeout issues ⚠️
4. **WebSocket connections**: Occasional connection drops need investigation ⚠️

## 🐛 Troubleshooting

### Common Test Failures

- **Authentication failures**: Check if test user credentials are valid
- **CORS errors**: Verify CORS configuration in both backend and auth services
- **Database errors**: Check if DB migrations are up-to-date
- **Timeout errors**: Increase timeout values for long-running operations

### Debugging Tools

Additional debugging tools are available:

```bash
# Run API monitor for real-time request logging
node frontend-tests/api-monitor/api-monitor.js

# Validate CORS configuration
node frontend-tests/network-validation/cors-tester.js

# Test with network throttling
THROTTLE=true node tests/user-journeys/full-subscription-flow.js
```

## 🤝 Contributing

When adding new tests:

1. Follow the existing directory structure
2. Use the test utility functions from the `core` directory
3. Add appropriate assertions for all test cases
4. Include both positive and negative test cases
5. Document any special setup requirements

---

Developed with ❤️ by the NIFYA Team