# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NIFYA Testing Tools Guidelines

## Build/Test Commands
- **Run All Tests**: `npm run test:all`
- **Single Test Categories**: `npm run test:auth`, `npm run test:subscriptions`, `npm run test:notifications`, `npm run test:journey`, `npm run test:diagnostics`
- **Run Individual Test**: `node tests/auth/login.js`, `DEBUG=1 node tests/auth/login.js` (with debug output), `ENV=production node tests/auth/login.js` (specify environment)
- **Generate Reports**: `npm run report`
- **Mock API Server**: `npm run start:proxy`

## Code Style Guidelines
- **API Client Usage**: Use `makeApiRequest()` with proper auth headers (see auth-client.js)
- **Logging**: Use `logger.info()`, `logger.error()`, `logger.success()` for structured logs with context
- **Imports**: Group by external → internal, core utilities first
- **Formatting**: 2-space indentation, max 80-100 chars per line
- **Naming**: camelCase for variables/functions, UPPER_CASE for constants
- **Error Handling**: Structured try/catch with detailed error objects
- **API Response Handling**: Save response data with `saveResponseToFile()`
- **Authentication**: Always use `Bearer {token}` format with space after "Bearer"
- **API Endpoints**: Import from `config/endpoints.js`
- **Test Structure**: Each test should export a function that returns `{success: true/false, error: string}`

## Testing Standards
- Each test file should be individually runnable
- Use consistent logging patterns
- Include proper test result reporting
- Save API responses to the outputs directory
- Follow API authentication header requirements
- Never use simulated data or mock up, NEVER

## Project Structure
- **/config**: Endpoint configuration
- **/core**: API client, logger, and other utilities
- **/tests**: Test implementations organized by category
- **/outputs**: Test results, logs, and API responses
- **/docs**: Documentation and guides