# User Journey Testing Guide

This guide explains how to use the user journey tests in the NIFYA testing platform. User journey tests simulate the complete flow of a user interacting with the application, from authentication to subscription creation and notification monitoring.

## Types of User Journey Tests

### 1. Standard User Journey Test

The standard user journey test simulates a basic user flow:

1. Authentication
2. Subscription creation
3. Subscription processing
4. Notification polling

```bash
# Run the standard user journey test
npm run test:journey

# Or directly with node
node tests/user-journeys/standard-flow.js
```

### 2. Enhanced User Journey Test

The enhanced user journey test provides a more comprehensive simulation of the frontend user experience:

1. Initial health check (simulating initial page load)
2. Authentication/login
3. User profile retrieval (as dashboard would)
4. Subscription types retrieval (for subscription form)
5. Current subscriptions retrieval (as dashboard would)
6. Subscription creation
7. Subscription processing
8. Notification polling

Additionally, it uses debug endpoints to collect detailed diagnostic information when errors occur.

```bash
# Run the enhanced user journey test
npm run test:enhanced-journey

# Or directly with node
node tests/user-journeys/enhanced-flow.js

# With custom polling parameters
node tests/user-journeys/enhanced-flow.js 20 3000  # 20 attempts, 3 second interval
```

## Debug Endpoints

The enhanced user journey test automatically uses debug endpoints to gather additional information when errors occur. These endpoints provide detailed information about the state of subscriptions, notifications, and the system as a whole.

For more information about debug endpoints, see [DEBUG-ENDPOINTS-GUIDE.md](./DEBUG-ENDPOINTS-GUIDE.md).

## Test Artifacts

Both tests generate several artifacts that are useful for understanding the test results:

### Standard User Journey Test

- Journey state: `outputs/reports/user_journey_state.json`
- Journey log: `outputs/reports/user_journey_log.md`
- Test logs: `outputs/logs/*-[session-id].log`
- Findings: `outputs/findings/latest-findings.md`

### Enhanced User Journey Test

- Journey state: `outputs/reports/enhanced_journey_state.json`
- Journey log: `outputs/reports/enhanced_journey_log.md`
- Debug information: `outputs/debug/*`
- Test logs: `outputs/logs/*-[session-id].log`
- Findings: `outputs/findings/enhanced-latest-findings.md`

## Error Handling

Unlike previous versions of the test, our current approach focuses on accurately identifying and reporting errors rather than simulating success. When an error occurs, the test:

1. Captures detailed information about the error
2. Calls relevant debug endpoints to gather additional diagnostic information
3. Generates a comprehensive findings report with details about what failed and why
4. Provides reference to all associated log files and debug information

## Interpreting Test Results

The most important file to check after a test run is the findings report. For the enhanced user journey test, this is located at `outputs/findings/enhanced-latest-findings.md`.

This report provides:

- A summary of the test results
- Step-by-step details of what passed and what failed
- Information gathered from debug endpoints
- References to all test artifacts
- Recommended next steps for addressing any issues

## Adding to the User Journey Test

If you need to add additional steps to the user journey test, follow these guidelines:

1. Add a new step to the appropriate test file (`standard-flow.js` or `enhanced-flow.js`)
2. Update the journey state structure to include the new step
3. Add appropriate error handling and debug calls
4. Update the findings report generation to include the new step

## Best Practices

1. **Run tests regularly**: User journey tests should be run regularly to detect regressions early
2. **Check findings reports**: Always check the findings report after a test run, even if the test passes
3. **Use debug information**: When a test fails, use the debug information to help diagnose the issue
4. **Add test coverage**: If you identify a gap in the user journey, add a new step to the test
5. **Keep tests up to date**: As the application evolves, update the user journey tests to reflect changes in the user experience

## Reference

- [Debug Endpoints Guide](./DEBUG-ENDPOINTS-GUIDE.md)
- [API Client Documentation](../core/api-client.js)
- [Logger Documentation](../core/logger.js)
- [Endpoints Configuration](../config/endpoints.js)