# Frontend Debugging Guide for NIFYA

This guide provides instructions for using the frontend testing and debugging tools to identify and troubleshoot frontend-to-backend communication issues.

## Setting Up the Debug Environment

### 1. Start the API Proxy Server

The API proxy server intercepts all communication between the frontend and backend, allowing you to inspect requests and responses:

```bash
# Navigate to the frontend-tests directory
cd testing-tools/frontend-tests

# Start the proxy server
node mock-server/mock-api-server.js
```

This will start a server on port 3030 that proxies requests to the real backend while capturing all API interactions.

### 2. Configure Your Frontend

To route all API requests through the proxy server:

#### Option 1: Update Environment Variables

Create or modify `.env.local` in your frontend directory:

```
VITE_BACKEND_URL=http://localhost:3030
VITE_AUTH_SERVICE_URL=http://localhost:3030/api/auth
```

#### Option 2: Use Browser DevTools

Use browser extensions like "Proxy SwitchyOmega" to route API requests through the proxy server.

### 3. Integrate the Debug Dashboard (For Development)

Add the debug dashboard to your frontend application for real-time monitoring:

```jsx
// Import at the top of your App.tsx or similar component
import { DebugDashboard } from '../../testing-tools/frontend-tests/ui-components/DebugDashboard';

// Add near the bottom of your component's render method
{process.env.NODE_ENV === 'development' && <DebugDashboard />}
```

## Debugging Frontend-Backend Communication

### Viewing API Requests

After performing operations in the frontend, you can examine the API requests in several ways:

#### Method 1: Debug Dashboard

The Debug Dashboard provides real-time monitoring of API requests:

1. Look for the Debug toggle button in the corner of your application
2. Click to expand the dashboard
3. View requests in the "Requests" tab
4. Click on any request to see detailed headers, body, and response

#### Method 2: API Proxy Logs

Access the logs captured by the API proxy server:

1. Visit `http://localhost:3030/debug/logs` in your browser
2. Click on any log entry to view complete request/response details
3. Raw log files are also available in `testing-tools/outputs/frontend-logs/`

#### Method 3: Browser Network Panel

Use the browser's built-in network panel for an alternative view:

1. Open browser DevTools (F12 or right-click > Inspect)
2. Go to the Network tab
3. Filter by XHR/Fetch requests
4. Examine requests to your backend API

### Common Issues and Solutions

#### Authentication Problems

**Symptoms**:
- 401 Unauthorized responses
- Missing Auth header in requests
- Invalid token format errors

**How to Debug**:
1. Check the Debug Dashboard's Auth tab to see current token state
2. Examine the Authorization header in outgoing requests
3. Verify token format (should be `Bearer eyJhbGciO...`)

**Solutions**:
- Clear local storage and log in again
- Fix Authorization header format
- Check token expiration and refresh mechanism

#### Request Body Issues

**Symptoms**:
- 400 Bad Request responses
- Validation errors in backend responses
- Missing required field errors

**How to Debug**:
1. Compare the request body in the Debug Dashboard with API requirements
2. Check for missing required fields or incorrect data types
3. Use the request validator to check request format:

```javascript
// In your browser console or code
const validator = require('./frontend-tests/network-validation/request-validator');
const result = validator.validateRequestType('subscriptionCreation', myRequest);
console.log(result);
```

**Solutions**:
- Fix request body format according to API schema
- Add missing required fields
- Fix data type issues

#### CORS Issues

**Symptoms**:
- Browser errors about CORS policy
- OPTIONS requests failing
- API requests not completing

**How to Debug**:
1. Check browser console for CORS-related errors
2. Examine the proxy server logs for preflight OPTIONS requests
3. Verify that headers are correctly set in both request and response

**Solutions**:
- Ensure the proxy server has correct CORS headers
- Check backend CORS configuration
- Use appropriate credentials setting in fetch/axios

#### Network Issues

**Symptoms**:
- Timeout errors
- Network errors in console
- Requests never completing

**How to Debug**:
1. Check network status in browser DevTools
2. Verify the proxy server is running and accessible
3. Check for any firewall or connectivity issues

**Solutions**:
- Ensure proper network connectivity
- Check proxy server status
- Verify backend services are running

## Advanced Debugging Techniques

### Validating Request Format

Use the request validator to check if requests match expected schemas:

```javascript
// Validate auth request
const authRequest = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: {
    email: 'user@example.com',
    password: 'password123'
  }
};

const result = validator.validateRequestType('auth', authRequest);
console.log(result.valid ? 'Valid request' : `Invalid: ${result.errors.join(', ')}`);
```

### Adding Custom Request Validation

Register custom schemas for your specific API endpoints:

```javascript
const validator = require('./frontend-tests/network-validation/request-validator');

// Register custom schema
validator.registerSchema('myCustomEndpoint', {
  headers: {
    'Content-Type': /^application\/json(;.*)?$/,
    'Authorization': /^Bearer .+$/
  },
  body: {
    customField1: { type: 'string' },
    customField2: { type: 'number' }
  },
  requiredFields: ['customField1']
});

// Validate against custom schema
const result = validator.validateRequestType('myCustomEndpoint', request);
```

### Analyzing Request Patterns

To identify patterns across multiple requests:

1. Export logs from the debug dashboard
2. Use the log analysis script:

```bash
node testing-tools/frontend-tests/utils/analyze-logs.js --pattern "api/v1/subscriptions"
```

This will generate a report of common patterns, errors, and statistics for the matching requests.

## Troubleshooting the Debug Tools

If the debugging tools themselves aren't working:

1. **Proxy Server Issues**:
   - Check if the server is running on port 3030
   - Verify there are no conflicting services on the same port
   - Check console for server errors

2. **Debug Dashboard Not Showing**:
   - Verify it's properly imported and rendered
   - Check browser console for React errors
   - Ensure styles are properly loaded

3. **No Requests Being Logged**:
   - Verify the frontend is configured to use the proxy
   - Check network requests in browser DevTools
   - Ensure the proxy server has write access to the logs directory

## Best Practices

1. **Always Start Fresh**: Clear local storage and application data when testing authentication flows

2. **Test Incrementally**: Debug one API interaction at a time rather than complex flows

3. **Compare with Known-Good Requests**: Keep examples of working requests for comparison

4. **Document Your Findings**: Note any issues and solutions for future reference

5. **Use Version Control**: Commit working frontend code before experimenting with fixes

## Additional Resources

- [Backend Endpoints Reference](backend-endpoints-reference.md): Details on all API endpoints
- [Testing Guide](TEST-GUIDE.md): Full testing procedures for both frontend and backend
- [Frontend API Services](../frontend/src/lib/api/services/): Reference implementation of frontend API clients