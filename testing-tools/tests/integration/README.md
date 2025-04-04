# NIFYA Integration Tests

This directory contains tests that verify cross-service functionality in the NIFYA platform.

## Overview

Integration tests verify functionality that spans multiple microservices. These tests ensure that services can communicate correctly and that end-to-end user journeys work as expected.

## Available Tests

### Notification Pipeline Test

File: `test-notification-pipeline.js`

This test verifies the complete notification pipeline:
1. Authenticates a user
2. Creates a subscription
3. Processes the subscription
4. Checks for notifications in the backend API
5. Verifies notifications in the notification worker via debug endpoint

### Subscription Journey Test

File: `subscription-journey-test.js`

This comprehensive test validates the entire subscription processing journey:
1. Authenticates with the authentication service
2. Creates a test BOE subscription in the backend
3. Verifies the subscription appears in the listing
4. Initiates subscription processing
5. Polls for processing completion across services
6. Checks for generated notifications
7. Tests notification actions (read/unread)

### Running Tests

Run an individual test:
```bash
node tests/integration/test-notification-pipeline.js
node tests/integration/subscription-journey-test.js
```

Run all integration tests:
```bash
node run-integration-tests.js
```

## Test Results

Test results are saved in the following locations:
- JSON results: `outputs/integration/` and `outputs/journey-tests/`
- Summary reports: `outputs/reports/`
- Journey test reports: `outputs/journey-tests/test_report_[timestamp].md`

## Environment Setup

Create a `.env` file in the testing-tools directory with the following variables:

```
TEST_USER_EMAIL=test-user@example.com
TEST_USER_PASSWORD=secure-password
API_KEY=your-api-key-for-internal-services
```

## Adding New Tests

To add a new integration test:
1. Create a new test file in this directory
2. Follow the test structure in existing files
3. Add the test to `run-integration-tests.js`

## Best Practices

- Always clean up after tests (delete test subscriptions, etc.)
- Include detailed logging
- Save comprehensive test outputs
- Handle authentication failures gracefully
- Test with reasonable timeouts for async operations
- Use proper authentication headers (Bearer token format)

## Related Documentation

- [Subscription Processing Flow](../../SUBSCRIPTION-PROCESSING-FLOW.md)
- [Subscription Journey Test Suite](../../SUBSCRIPTION-JOURNEY-TEST-SUITE.md)