# NIFYA Testing Guide

This guide provides instructions for testing both the backend and frontend components of the NIFYA platform using the tools in this repository.

## Table of Contents

1. [Setup](#setup)
2. [Backend Testing](#backend-testing)
   - [Running Comprehensive Tests](#running-comprehensive-tests)
   - [Running Individual Backend Tests](#running-individual-backend-tests)
   - [Analyzing Test Results](#analyzing-test-results)
   - [Troubleshooting Backend Issues](#troubleshooting-backend-issues)
3. [Frontend Testing](#frontend-testing)
   - [Starting the API Proxy Server](#starting-the-api-proxy-server)
   - [Using the Debug Dashboard](#using-the-debug-dashboard)
   - [Analyzing API Communication](#analyzing-api-communication)
   - [Troubleshooting Frontend Issues](#troubleshooting-frontend-issues)
4. [End-to-End Testing](#end-to-end-testing)
5. [Common Issues and Solutions](#common-issues-and-solutions)

## Setup

Before running any tests, make sure to install the required dependencies:

```bash
# Navigate to the testing-tools directory
cd /path/to/NIFYA-Master/testing-tools

# Install dependencies
npm install
```

## Backend Testing

The backend testing tools focus on verifying API endpoints, authentication flows, and data operations.

### Running Comprehensive Tests

To run a full suite of tests against all backend endpoints:

```bash
# Run the comprehensive test suite
node run-all-tests.js
```

This will:
1. Test authentication endpoints
2. Verify health check endpoints
3. Test subscription endpoints (list, create, update, delete)
4. Test notification endpoints
5. Verify diagnostic endpoints

A detailed report will be generated in `outputs/comprehensive-tests/latest-test-summary.md`.

### Running Individual Backend Tests

You can also run specific tests for targeted testing:

```bash
# Test authentication
node tests/auth/login.js

# Test subscription creation
node tests/subscriptions/create.js

# Test notification polling
node tests/notifications/poll.js

# Check database status
node tests/admin/diagnose-database.js
```

Each test will output detailed logs to the console and store results in the `outputs/logs/` directory.

### Analyzing Test Results

After running tests, examine the results in these locations:

1. **Summary Report**: `outputs/comprehensive-tests/latest-test-summary.md`
2. **Raw Test Data**: `outputs/responses/` contains JSON responses from API calls
3. **Detailed Logs**: `outputs/logs/` contains timestamped logs of all test runs

The `test-results-summary.md` file in the root directory provides an analysis of the latest test results with identified issues and recommended fixes.

### Troubleshooting Backend Issues

If tests are failing, use these diagnostic tools:

```bash
# Check if the user exists in the database
node tests/admin/check-user.js

# View detailed database status
node tests/admin/diagnose-database.js

# Add a test user to the database (if needed)
node tests/admin/add-test-user.js
```

Common backend issues include:
- Authentication token problems
- Missing user records in the database
- Foreign key constraint violations
- Request body parsing issues

## Frontend Testing

Frontend testing focuses on the communication between the frontend and backend services, rather than UI testing.

### Starting the API Proxy Server

The API proxy server captures and logs all requests between the frontend and backend:

```bash
# Navigate to the frontend-tests directory
cd frontend-tests

# Start the proxy server
node mock-server/mock-api-server.js
```

The server will start on port 3030 by default, proxying requests to the real backend services while logging all interactions.

Configure your frontend to use this proxy server by:

1. Setting the API URL in your frontend to `http://localhost:3030`
2. Or using browser network debugging tools like Proxy Switcher

### Using the Debug Dashboard

To monitor API communication in real-time:

1. Add the Debug Dashboard component to your React application:

```jsx
// Import at the top of your App.js or similar component
import { DebugDashboard } from '/path/to/testing-tools/frontend-tests/ui-components/DebugDashboard';

// Add it to your component's render method
<DebugDashboard />
```

2. The dashboard will appear minimized in the corner of your application
3. Click to expand and view real-time API requests and responses
4. Examine authentication state, headers, and response data

### Analyzing API Communication

After performing actions in the frontend, analyze the communication:

1. **View Logs**: Access `http://localhost:3030/debug/logs` to see all captured API requests
2. **Examine Specific Request**: Use `http://localhost:3030/debug/logs/{filename}` to view details of a specific request
3. **Check Logs Directory**: Raw log files are stored in `outputs/frontend-logs/`

Look for these common issues:
- Missing or malformed Authorization headers
- Incorrect request body structure
- Error responses from the backend
- CORS issues

### Troubleshooting Frontend Issues

For common frontend-to-backend communication issues:

1. **Authentication Problems**:
   - Check token format in local storage
   - Verify proper Authorization header format (should be `Bearer <token>`)
   - Confirm the token hasn't expired

2. **API Format Issues**:
   - Compare request format with the expected format (see backend documentation)
   - Check for missing required fields
   - Verify content type headers

3. **Network Issues**:
   - Confirm proxy server is running
   - Check browser console for CORS errors
   - Look for timeouts or connection refused errors

## End-to-End Testing

To test the complete user flow from frontend to backend:

```bash
# Run the user journey test
node tests/user-journeys/standard-flow.js
```

This test simulates a complete user journey:
1. Authentication
2. Subscription creation
3. Subscription listing
4. Notification polling

Results will be stored in `outputs/reports/user_journey_log.md`.

## Common Issues and Solutions

### Authentication Issues

**Problem**: 401 Unauthorized responses
**Solutions**:
- Refresh the authentication token
- Check token format (should be `Bearer <token>`)
- Verify the user exists in both auth and backend databases

### Database Connection Issues

**Problem**: 500 Internal Server errors on data operations
**Solutions**:
- Run `node tests/admin/diagnose-database.js` to check DB connection
- Verify database tables exist and have the expected schema
- Check for foreign key constraint issues

### Request Format Issues

**Problem**: 400 Bad Request errors when creating/updating resources
**Solutions**:
- Compare actual request with expected format
- Check for missing required fields
- Verify content types (application/json)

### Notification Polling Issues

**Problem**: No notifications appearing or 404 errors
**Solutions**:
- Verify notification paths and parameters
- Check filters (entityType, entityId)
- Confirm pagination parameters are correct

---

For more detailed information about specific endpoints and their requirements, refer to the [Backend Endpoints Reference](backend-endpoints-reference.md) document.

If you encounter issues not covered by this guide, please report them by creating a detailed issue with logs and steps to reproduce.