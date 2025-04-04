# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NIFYA Testing Tools Guidelines

## Build/Test Commands
- **Run All Tests**: `npm run test:all`
- **Single Test Categories**: `npm run test:auth`, `npm run test:subscriptions`, `npm run test:notifications`, `npm run test:journey`, `npm run test:enhanced-journey`, `npm run test:diagnostics`
- **Run Individual Test**: `node tests/auth/login.js`, `DEBUG=1 node tests/auth/login.js` (with debug output), `ENV=production node tests/auth/login.js` (specify environment)
- **Run Test Suites**: `node run-auth-tests.js`, `node run-integration-tests.js`, `node run-notification-tests.js`, `node run-subscription-tests.js`
- **Generate Reports**: `npm run report`
- **Mock API Server**: `npm run start:proxy`

## Code Style Guidelines
- **API Client Usage**: Use `makeApiRequest()` from `core/api-client.js` with proper auth headers
- **Logging**: Use `logger.info()`, `logger.error()`, `logger.success()` from `core/logger.js` for structured logs with context
- **Imports**: Group by external → internal, core utilities first
- **Formatting**: 2-space indentation, max 80-100 chars per line
- **Naming**: camelCase for variables/functions, UPPER_CASE for constants
- **Error Handling**: Structured try/catch with detailed error objects
- **API Response Handling**: Save response data with `saveResponseToFile()`
- **Authentication**: Always use `Bearer {token}` format with space after "Bearer"
- **API Endpoints**: Import from `config/endpoints.js`
- **Test Structure**: Each test should export a function that returns `{success: true/false, error: string}`

## Authentication and Token Handling
- **Token Format**: Always use `Bearer {token}` with space after "Bearer"
- **Token Refresh**: `refreshTokenIfNeeded()` from api-client.js handles automatic token refresh
- **User ID Extraction**: Use `getUserIdFromToken()` to extract user ID from JWT token
- **Headers**: Include both `Authorization` and `x-user-id` headers in authenticated requests

## Integration Testing
- **Subscription Journey**: End-to-end test for subscription creation, processing, and notification delivery
- **Notification Pipeline**: Tests for the complete notification pipeline flow
- **Run Integration Tests**: `node tests/integration/subscription-journey-test.js`, `node test-notification-pipeline.js`
- **Environment Variables**: `NODE_ENV=test` to run in test environment, `DEBUG=1` for verbose logging

## Testing Standards
- Each test file should be individually runnable
- Use consistent logging patterns
- Include proper test result reporting
- Save API responses to the outputs directory
- Follow API authentication header requirements
- Never use simulated data or mock up, NEVER

## Report Generation
- **Test Reports**: Many tests generate both JSON and markdown reports in the outputs/reports directory
- **Run Reports**: `npm run report` to generate comprehensive test reports
- **View Reports**: Check outputs/reports directory for test summaries and detailed test results
- **Test Summaries**: Review latest-test-summary.md and latest-report.md for current test status

## Project Structure
- **/config**: Endpoint configuration and test settings
- **/core**: API client, logger, and other core utilities 
- **/tests**: Test implementations organized by category
  - **/tests/auth**: Authentication-related tests
  - **/tests/subscriptions**: Subscription management tests
  - **/tests/notifications**: Notification handling tests
  - **/tests/user-journeys**: User journey flow tests
  - **/tests/integration**: End-to-end integration tests
- **/outputs**: Test results, logs, and API responses
  - **/outputs/logs**: Test execution logs
  - **/outputs/reports**: Generated test reports and summaries
- **/docs**: Documentation and guides