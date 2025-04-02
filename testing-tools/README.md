# NIFYA Testing Tools

This module provides structured testing tools for the NIFYA platform. It offers comprehensive testing, debugging, and analysis capabilities for all NIFYA components.

## Directory Structure

```
/testing-tools/
├── config/              # Configuration files
├── core/                # Core utilities
├── tests/               # Test scripts organized by domain
├── utils/               # Helper utilities
├── docs/                # Documentation and guides
└── outputs/             # Test outputs
```

## Getting Started

To run the tests:

```bash
cd testing-tools

# Run individual test
node tests/auth/login.js

# Run test suite
node utils/test-runner.js all

# Run specific domain tests
node utils/test-runner.js subscriptions
```

## Core Features

- **Authentication Testing**: Test login, token management, and session handling
- **Subscription Testing**: Verify subscription creation, processing, and status
- **Notification Testing**: Test notification delivery and formatting
- **API Endpoint Analysis**: Map and test all available endpoints
- **User Journey Simulation**: Test complete user flows
- **Pipeline Analysis**: Analyze data flow between services

## Usage Examples

### Authentication Testing

```javascript
// Test login and store token
node tests/auth/login.js
```

### Subscription Testing

```javascript
// Create and process a subscription
node tests/subscriptions/create-and-process.js
```

### Notification Testing

```javascript
// Poll for notifications
node tests/notifications/poll.js
```

### Full User Journey

```javascript
// Run complete user journey test
node tests/user-journeys/standard-flow.js
```

## Documentation

For detailed documentation, see the `docs/` directory:

- [Testing Guide](docs/TESTING-GUIDE.md)
- [Backend Endpoints Reference](docs/backend-endpoints-reference.md)
- [Notification Pipeline Analysis](docs/findings/NOTIFICATION-PIPELINE-CONCLUSIONS.md)
- [API Endpoint Map](docs/findings/API-ENDPOINT-MAP.md)

## Security

These scripts store auth tokens and other sensitive data in the `outputs/` directory. Ensure these are not committed to version control.