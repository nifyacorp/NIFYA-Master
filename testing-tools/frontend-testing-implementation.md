# Frontend Testing Implementation Platform

## Overview

This testing platform focuses on verifying frontend-to-backend API communication in the NIFYA application. Instead of testing UI components directly, we'll create tools to monitor, validate, and simulate API interactions.

## Core Components

### 1. API Request Monitor

A tool to intercept and log all API requests and responses between the frontend and backend. This will help identify:
- Authentication header issues
- Request payload format problems
- Response processing errors

### 2. Response Simulator

A mock server that simulates backend responses for testing frontend behavior with:
- Success responses
- Error conditions
- Edge cases (slow responses, timeouts)

### 3. Network Validation Tool

A utility to validate that requests conform to the expected schema:
- Correct headers (Authorization, Content-Type)
- Properly structured request bodies
- Proper error handling

### 4. In-Browser Debug Dashboard

A component that can be integrated into the app to show:
- Real-time API request logs
- Authentication state
- Request/response details
- Error tracking

## Implementation Plan

### Phase 1: Setup and Monitoring Tools

1. **API Request Logger**
   - Implement a browser extension or proxy to capture API requests
   - Store request/response pairs for analysis
   - Create a UI to filter and search logs

2. **Debug Dashboard Component**
   - Create a React component that can be embedded in the app
   - Display real-time API communication
   - Show authentication state and token information
   - Implement as a development-only tool

3. **Test Data Generator**
   - Generate realistic test data for API requests
   - Create sample response data for mocking

### Phase 2: Response Simulation

1. **Mock API Server**
   - Create a simple Express server that mimics the backend API
   - Implement endpoints to match the production API
   - Support configurable response delays and errors

2. **Proxy Configuration**
   - Set up a proxy to route requests to mock server
   - Allow switching between mock and real backend

3. **Scenario Runner**
   - Create predefined test scenarios
   - Support recording and playback of API interactions

### Phase 3: Testing Framework

1. **API Contract Tests**
   - Verify that requests match expected schema
   - Validate response handling conforms to requirements

2. **Authentication Flow Tests**
   - Test login/logout flows
   - Verify token refresh behavior
   - Test error handling for expired/invalid tokens

3. **Network Failure Tests**
   - Simulate network errors and timeouts
   - Test application resilience

4. **End-to-End User Flows**
   - Define key user journeys
   - Automate testing of complete flows

## Tools and Technologies

1. **Core Testing Tools**
   - Jest for unit testing
   - Cypress for end-to-end testing
   - MSW (Mock Service Worker) for API mocking

2. **Monitoring and Debugging**
   - Redux DevTools for state management inspection
   - Chrome DevTools Network Monitor
   - Custom logging middleware

3. **API Validation**
   - Zod schemas (already used in the app)
   - TypeScript for type checking

## Implementation Code Examples

### 1. API Request Logger Middleware

```typescript
// apiLoggerMiddleware.ts
import { Middleware } from 'redux';

export const apiLoggerMiddleware: Middleware = store => next => action => {
  // Log API requests/responses
  if (action.type.endsWith('_REQUEST')) {
    console.group(`🔄 API Request: ${action.type}`);
    console.log('Request Payload:', action.payload);
    console.log('Headers:', action.meta?.headers);
    console.timeStamp();
    console.groupEnd();
  }
  
  if (action.type.endsWith('_SUCCESS') || action.type.endsWith('_FAILURE')) {
    console.group(`📥 API Response: ${action.type}`);
    console.log('Response Data:', action.payload);
    console.log('Status:', action.meta?.status);
    console.timeStamp();
    console.groupEnd();
  }
  
  return next(action);
};
```

### 2. Debug Dashboard Component

```tsx
// DebugDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/use-auth';
import './DebugDashboard.css';

export const DebugDashboard: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for API communication events
    const handleApiEvent = (event: CustomEvent) => {
      setApiLogs(prev => [...prev, event.detail]);
    };
    
    window.addEventListener('api-log', handleApiEvent as EventListener);
    return () => window.removeEventListener('api-log', handleApiEvent as EventListener);
  }, []);

  if (!isVisible) {
    return (
      <button className="debug-toggle" onClick={() => setIsVisible(true)}>
        Show Debug Panel
      </button>
    );
  }

  return (
    <div className="debug-dashboard">
      <h2>API Debug Dashboard</h2>
      <button onClick={() => setIsVisible(false)}>Close</button>
      
      <div className="auth-info">
        <h3>Authentication</h3>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User ID: {user?.id || 'Not logged in'}</div>
        <div>Token: {token ? `${token.substring(0, 10)}...` : 'None'}</div>
      </div>
      
      <div className="api-logs">
        <h3>API Communication Logs</h3>
        {apiLogs.map((log, i) => (
          <div key={i} className={`log-entry ${log.isError ? 'error' : ''}`}>
            <div className="log-method">{log.method}</div>
            <div className="log-url">{log.url}</div>
            <div className="log-status">{log.status}</div>
            <button onClick={() => console.log('Full log:', log)}>
              Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Mock API Server

```javascript
// mock-api-server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const delay = require('express-delay');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configurable delay for response simulation
app.use(delay(500)); // Default 500ms delay

// Mock auth response
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple credential check
  if (email === 'test@example.com' && password === 'password') {
    res.json({
      ok: true,
      status: 200,
      data: {
        token: 'mock-jwt-token-for-testing',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      }
    });
  } else {
    res.status(401).json({
      ok: false,
      status: 401,
      error: 'Invalid credentials'
    });
  }
});

// Mock subscriptions endpoint
app.get('/api/v1/subscriptions', (req, res) => {
  res.json({
    ok: true,
    status: 200,
    data: {
      subscriptions: [
        {
          id: 'mock-sub-1',
          name: 'Test Subscription',
          description: 'This is a mock subscription',
          prompts: ['test prompt'],
          logo: 'https://example.com/logo.png',
          frequency: 'daily',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }
  });
});

// Error endpoint for testing error handling
app.get('/api/error-test', (req, res) => {
  const errorType = req.query.type;
  
  switch (errorType) {
    case 'timeout':
      // Don't respond to simulate timeout
      break;
    case 'network':
      res.destroy();
      break;
    case '401':
      res.status(401).json({
        ok: false,
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      break;
    case '500':
      res.status(500).json({
        ok: false,
        status: 500,
        error: 'Internal Server Error',
        message: 'Something went wrong'
      });
      break;
    default:
      res.status(400).json({
        ok: false,
        status: 400,
        error: 'Bad Request',
        message: 'Invalid test type'
      });
  }
});

// Start the server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
});
```

### 4. API Testing Utilities

```typescript
// api-test-utils.ts
import { ApiResponse } from '../lib/api/types';

export interface RequestCapture {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface ResponseCapture {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export interface ApiCapture {
  request: RequestCapture;
  response: ResponseCapture;
  timestamp: number;
  duration: number;
}

// Global store for captured API interactions
const apiStore: ApiCapture[] = [];

// Mock fetch for testing
export function setupFetchMock(
  responseMap: Record<string, ApiResponse<any>> = {}
) {
  const originalFetch = window.fetch;
  
  window.fetch = jest.fn(async (url, options) => {
    const startTime = Date.now();
    const method = options?.method || 'GET';
    const key = `${method}:${url.toString()}`;
    
    // Capture request
    const requestCapture: RequestCapture = {
      url: url.toString(),
      method,
      headers: options?.headers as Record<string, string> || {},
      body: options?.body ? JSON.parse(options.body as string) : undefined
    };
    
    // Get mock response or use default
    const mockResponse = responseMap[key] || {
      ok: true,
      status: 200,
      data: { message: 'Default mock response' }
    };
    
    // Create response object
    const response = {
      ok: mockResponse.ok !== false,
      status: mockResponse.status || 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => mockResponse
    };
    
    // Capture response
    const responseCapture: ResponseCapture = {
      status: response.status,
      body: mockResponse,
      headers: { 'Content-Type': 'application/json' }
    };
    
    // Store capture
    apiStore.push({
      request: requestCapture,
      response: responseCapture,
      timestamp: startTime,
      duration: Date.now() - startTime
    });
    
    return response as Response;
  });
  
  // Helper to restore original fetch
  return {
    restore: () => {
      window.fetch = originalFetch;
    },
    getCapturedRequests: () => [...apiStore]
  };
}

// Validate a request against expected schema
export function validateRequest(
  captured: RequestCapture,
  expected: Partial<RequestCapture>
): boolean {
  // Validate URL
  if (expected.url && captured.url !== expected.url) {
    console.error(`URL mismatch: ${captured.url} vs ${expected.url}`);
    return false;
  }
  
  // Validate method
  if (expected.method && captured.method !== expected.method) {
    console.error(`Method mismatch: ${captured.method} vs ${expected.method}`);
    return false;
  }
  
  // Validate headers
  if (expected.headers) {
    for (const [key, value] of Object.entries(expected.headers)) {
      if (captured.headers[key] !== value) {
        console.error(`Header "${key}" mismatch: ${captured.headers[key]} vs ${value}`);
        return false;
      }
    }
  }
  
  // Validate body if expected body is provided
  if (expected.body) {
    if (!captured.body) {
      console.error('Expected body but none was captured');
      return false;
    }
    
    // We'll do a simple check here, but you could implement a more complex validation
    const expectedKeys = Object.keys(expected.body);
    for (const key of expectedKeys) {
      if (captured.body[key] !== expected.body[key]) {
        console.error(`Body field "${key}" mismatch: ${captured.body[key]} vs ${expected.body[key]}`);
        return false;
      }
    }
  }
  
  return true;
}
```

## Testing Scripts

### 1. Test API Authentication Flow

```typescript
// test-auth-flow.ts
import { setupFetchMock, validateRequest } from './api-test-utils';
import { authService } from '../src/lib/api/services/auth';

describe('Authentication Flow', () => {
  let fetchMock;
  
  beforeEach(() => {
    // Setup mock fetch
    fetchMock = setupFetchMock({
      'POST:/api/auth/login': {
        status: 200,
        ok: true,
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }
      },
      'POST:/api/auth/refresh': {
        status: 200,
        ok: true,
        data: {
          token: 'new-test-token',
          refreshToken: 'new-refresh-token'
        }
      },
      'POST:/api/auth/logout': {
        status: 200,
        ok: true,
        data: { message: 'Logged out successfully' }
      }
    });
    
    // Clear storage
    localStorage.clear();
  });
  
  afterEach(() => {
    fetchMock.restore();
    localStorage.clear();
  });
  
  test('Login flow sends correct request format', async () => {
    await authService.login({
      email: 'test@example.com',
      password: 'password123'
    });
    
    const requests = fetchMock.getCapturedRequests();
    const loginRequest = requests[0];
    
    expect(validateRequest(loginRequest.request, {
      url: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    })).toBe(true);
  });
  
  test('Login success stores tokens correctly', async () => {
    await authService.login({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(localStorage.getItem('accessToken')).toBe('test-token');
    expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
  });
  
  test('Token refresh flow works correctly', async () => {
    // Setup initial tokens
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'old-refresh-token');
    localStorage.setItem('isAuthenticated', 'true');
    
    await authService.refreshToken();
    
    const requests = fetchMock.getCapturedRequests();
    const refreshRequest = requests[0];
    
    expect(validateRequest(refreshRequest.request, {
      url: '/api/auth/refresh',
      method: 'POST',
      body: { refreshToken: 'old-refresh-token' }
    })).toBe(true);
    
    expect(localStorage.getItem('accessToken')).toBe('new-test-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
  });
});
```

### 2. Test Subscription API Interactions

```typescript
// test-subscription-api.ts
import { setupFetchMock, validateRequest } from './api-test-utils';
import { subscriptionService } from '../src/lib/api/services/subscriptions';

describe('Subscription API Interactions', () => {
  let fetchMock;
  
  beforeEach(() => {
    // Setup mock fetch
    fetchMock = setupFetchMock({
      'GET:/api/v1/subscriptions': {
        status: 200,
        ok: true,
        data: {
          subscriptions: [
            {
              id: 'sub-1',
              name: 'Test Subscription',
              description: 'Test description',
              prompts: ['Test prompt'],
              logo: 'test-logo.png',
              frequency: 'daily',
              active: true,
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z'
            }
          ]
        }
      },
      'POST:/api/v1/subscriptions': {
        status: 201,
        ok: true,
        data: {
          subscription: {
            id: 'new-sub-id',
            name: 'New Subscription',
            description: 'New description',
            prompts: ['New prompt'],
            logo: 'new-logo.png',
            frequency: 'immediate',
            active: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        }
      }
    });
    
    // Setup auth token
    localStorage.setItem('accessToken', 'test-token');
  });
  
  afterEach(() => {
    fetchMock.restore();
    localStorage.clear();
  });
  
  test('List subscriptions sends correct request', async () => {
    await subscriptionService.list();
    
    const requests = fetchMock.getCapturedRequests();
    const listRequest = requests[0];
    
    expect(validateRequest(listRequest.request, {
      url: '/api/v1/subscriptions',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })).toBe(true);
  });
  
  test('Create subscription sends correct request format', async () => {
    const newSubscription = {
      name: 'New Subscription',
      description: 'New description',
      prompts: ['New prompt'],
      logo: 'new-logo.png',
      frequency: 'immediate',
      type: 'test',
      active: true
    };
    
    await subscriptionService.create(newSubscription);
    
    const requests = fetchMock.getCapturedRequests();
    const createRequest = requests[0];
    
    expect(validateRequest(createRequest.request, {
      url: '/api/v1/subscriptions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: newSubscription
    })).toBe(true);
  });
  
  test('Create subscription validates input before sending', async () => {
    const invalidSubscription = {
      // Missing required name field
      description: 'Invalid subscription'
    };
    
    const result = await subscriptionService.create(invalidSubscription as any);
    
    // Should fail validation
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    
    // No request should have been sent
    const requests = fetchMock.getCapturedRequests();
    expect(requests.length).toBe(0);
  });
});
```

## Integration with Existing Backend Tests

The frontend testing platform can seamlessly integrate with the backend tests we've already created:

1. **Shared Test Data**
   - Use the same test data in both frontend and backend tests
   - Test exact request/response formats that match each other

2. **End-to-End API Flow Tests**
   - Test complete frontend-to-backend flows
   - Validate complete request/response cycles

3. **Coordinated Test Runs**
   - Run frontend and backend tests in sequence
   - Verify full system functionality

This approach ensures we catch issues at the integration point between frontend and backend, which is where many real-world problems occur.