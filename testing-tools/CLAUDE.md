# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NIFYA Testing Tools Guidelines

## Build/Test Commands
- **Run All Tests**: `npm run test:all`
- **Test Categories**: `npm run test:auth`, `npm run test:subscriptions`, `npm run test:notifications`, `npm run test:journey`
- **Run Individual Test**: `node tests/auth/login.js`, `DEBUG=1 node tests/auth/login.js` (debug mode)
- **Run Test Suites**: `node run-template-tests.js`, `node run-explorer-tests.js`, `node run-notification-tests.js`
- **Generate Reports**: `npm run report`

## Code Style Guidelines
- **API Client**: Use `makeApiRequest()` from `core/api-client.js` with proper auth headers
- **Logging**: Use `logger.info/error/success()` from `core/logger.js` for structured logs
- **Imports**: Group external → internal, core utilities first
- **Formatting**: 2-space indentation, max 100 chars per line
- **Naming**: camelCase for variables/functions, UPPER_CASE for constants
- **Error Handling**: Use structured try/catch with detailed error objects
- **Authentication**: Always use `Bearer {token}` format with space after "Bearer" 
- **API Endpoints**: Import from `config/endpoints.js`

## Test Structure
- Each test should export a function returning `{success: true/false, error: string}`
- Save API responses to outputs directory using `saveResponseToFile()`
- Use consistent logging patterns for test start, success, and failure
- Test Runners should use `utils/test-runner.js` to execute tests consistently
- Never use simulated data unless explicitly testing offline functionality