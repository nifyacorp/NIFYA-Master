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

### Running Tests

Run an individual test:
```bash
node ../../test-notification-pipeline.js
```

Run all integration tests:
```bash
node ../../run-integration-tests.js
```

## Test Results

Test results are saved in the following locations:
- JSON results: `../../outputs/integration/`
- Summary reports: `../../outputs/reports/`

## Adding New Tests

To add a new integration test:
1. Create a new test file in this directory
2. Follow the test structure in existing files
3. Add the test to `../../run-integration-tests.js`

## Best Practices

- Always clean up after tests (delete test subscriptions, etc.)
- Include detailed logging
- Save comprehensive test outputs
- Handle authentication failures gracefully
- Test with reasonable timeouts for async operations