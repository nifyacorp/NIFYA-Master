# NIFYA Frontend Testing Implementation

This document outlines the implementation plan for testing the front-backend communication of the NIFYA platform, focusing on identifying and resolving issues in the communication layer.

## Overview

The NIFYA frontend, now deployed at https://main-page-415554190254.us-central1.run.app, needs comprehensive testing to identify where frontend-backend communication is failing. Based on our analysis of the codebase, we've designed several testing approaches to isolate and fix these issues.

## Testing Strategy

We'll implement a multi-layered approach to test the frontend-backend communication:

1. **Debug Dashboard**: Create a dedicated debug UI for real-time API monitoring
2. **Network Interceptors**: Implement monitoring for all API calls
3. **API Testing Components**: Individual components to test specific API endpoints
4. **User Journey Simulation**: Automated testing of complete user flows

## Implementation Plan

### 1. Debug Dashboard

Create a dedicated debug dashboard page that shows:

```jsx
// src/pages/Debug.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { backendClient } from '@/lib/api/clients/backend';

export default function DebugDashboard() {
  const [authStatus, setAuthStatus] = useState({ status: 'unknown', token: null, userId: null });
  const [apiRequests, setApiRequests] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  
  // Test authentication
  const testAuth = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    
    setAuthStatus({
      status: accessToken ? 'authenticated' : 'unauthenticated',
      token: accessToken ? `${accessToken.substring(0, 15)}...` : null,
      userId
    });
    
    // Test /api/auth/me endpoint
    if (accessToken) {
      const result = await backendClient({
        endpoint: '/api/auth/me',
        method: 'GET'
      });
      
      setLastResponse(result);
    }
  };
  
  // Test subscription listing
  const testSubscriptionList = async () => {
    const result = await backendClient({
      endpoint: '/api/v1/subscriptions',
      method: 'GET'
    });
    
    setLastResponse(result);
  };
  
  // Test notification listing
  const testNotificationList = async () => {
    const result = await backendClient({
      endpoint: '/api/v1/notifications',
      method: 'GET'
    });
    
    setLastResponse(result);
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">API Debug Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Status: {authStatus.status}</p>
              {authStatus.token && <p>Token: {authStatus.token}</p>}
              {authStatus.userId && <p>User ID: {authStatus.userId}</p>}
              <Button onClick={testAuth}>Test Authentication</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>API Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button onClick={testSubscriptionList}>Test Subscription List</Button>
              <Button onClick={testNotificationList}>Test Notification List</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Last API Response</CardTitle>
        </CardHeader>
        <CardContent>
          {lastResponse ? (
            <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          ) : (
            <p>No API response yet. Click a test button above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. API Request Logger Service

Implement a global API request logger:

```jsx
// src/lib/api/logger.ts
class ApiLogger {
  private requests: Array<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    timestamp: Date;
    duration?: number;
    status?: number;
    response?: any;
    error?: any;
  }> = [];
  
  private listeners: Array<(requests: any[]) => void> = [];
  
  logRequest(url: string, method: string, headers: Record<string, string>, body?: any) {
    const request = {
      url,
      method,
      headers: this.sanitizeHeaders(headers),
      body,
      timestamp: new Date(),
    };
    
    const requestId = this.requests.length;
    this.requests.push(request);
    this.notifyListeners();
    
    return requestId;
  }
  
  logResponse(requestId: number, status: number, response: any, duration: number) {
    if (this.requests[requestId]) {
      this.requests[requestId] = {
        ...this.requests[requestId],
        status,
        response,
        duration
      };
      
      this.notifyListeners();
    }
  }
  
  logError(requestId: number, error: any, duration: number) {
    if (this.requests[requestId]) {
      this.requests[requestId] = {
        ...this.requests[requestId],
        error,
        duration
      };
      
      this.notifyListeners();
    }
  }
  
  getRequests() {
    return [...this.requests];
  }
  
  clearRequests() {
    this.requests = [];
    this.notifyListeners();
  }
  
  subscribe(listener: (requests: any[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.requests]));
  }
  
  private sanitizeHeaders(headers: Record<string, string>) {
    const sanitized = {...headers};
    // Mask sensitive values
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer ***';
    }
    return sanitized;
  }
}

export const apiLogger = new ApiLogger();
```

### 3. Modify Backend Client to Use Logger

Update the backend client to log all requests:

```jsx
// Modify in src/lib/api/clients/backend.ts
import { apiLogger } from '../logger';

export async function backendClient<T>({
  endpoint,
  method = 'GET',
  body = undefined,
  headers = {}
}: RequestConfig): Promise<ApiResponse<T>> {
  let retryCount = 0;
  const maxRetries = 1;
  
  // Debug logging for request
  console.group(`🌐 API Request: ${method} ${endpoint}`);
  console.log('Request details:', { method, endpoint, headers: { ...headers, Authorization: headers.Authorization ? '***' : undefined } });
  if (body) console.log('Request body:', typeof body === 'string' ? body.substring(0, 100) + '...' : body);
  
  // Log the request using our logger
  const requestId = apiLogger.logRequest(
    `${BACKEND_URL}${endpoint}`, 
    method, 
    headers as Record<string, string>, 
    body
  );
  const startTime = Date.now();
  
  async function attemptRequest(): Promise<ApiResponse<T>> {
    try {
      // ... existing code ...
      
      // Log response
      const duration = Date.now() - startTime;
      apiLogger.logResponse(requestId, response.status, data, duration);
      
      // ... rest of existing code ...
    } catch (error: any) {
      // Log error
      const duration = Date.now() - startTime;
      apiLogger.logError(requestId, error, duration);
      
      // ... rest of existing code ...
    }
  }
  
  return attemptRequest();
}
```

### 4. API Request Monitor Component

Create a component to display API requests:

```jsx
// src/components/Debug/ApiMonitor.tsx
import { useState, useEffect } from 'react';
import { apiLogger } from '@/lib/api/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ApiMonitor() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  useEffect(() => {
    const unsubscribe = apiLogger.subscribe(setRequests);
    return unsubscribe;
  }, []);
  
  const clearLogs = () => {
    apiLogger.clearRequests();
    setSelectedRequest(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">API Request Monitor</h2>
        <Button onClick={clearLogs} variant="outline" size="sm">Clear Logs</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-auto">
              {requests.length === 0 ? (
                <p className="text-muted-foreground">No requests logged yet.</p>
              ) : (
                requests.map((req, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 border rounded cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <div className="flex justify-between">
                      <div className="font-mono">
                        <Badge variant={req.status >= 400 ? "destructive" : req.status >= 300 ? "outline" : "default"}>
                          {req.method}
                        </Badge> {req.url.split('/').slice(3).join('/')}
                      </div>
                      <div className="text-slate-500 text-sm">
                        {req.status ? req.status : req.error ? 'Error' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRequest ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Request</h3>
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify({
                      url: selectedRequest.url,
                      method: selectedRequest.method,
                      headers: selectedRequest.headers,
                      body: selectedRequest.body
                    }, null, 2)}
                  </pre>
                </div>
                
                {(selectedRequest.response || selectedRequest.error) && (
                  <div>
                    <h3 className="font-semibold">
                      {selectedRequest.error ? 'Error' : 'Response'}
                    </h3>
                    <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(
                        selectedRequest.error || selectedRequest.response, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                )}
                
                {selectedRequest.duration && (
                  <p className="text-sm text-slate-500">
                    Duration: {selectedRequest.duration}ms
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Select a request to view details.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 5. Subscription Testing Component

Create a component for testing subscription functionality:

```jsx
// src/components/Debug/SubscriptionTester.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backendClient } from '@/lib/api/clients/backend';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SubscriptionTester() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState('');
  
  const testCreateSubscription = async () => {
    setLoading(true);
    try {
      // Minimal subscription data
      const subscriptionData = {
        name: "Test BOE Subscription",
        type: "boe",
        prompts: ["Ayuntamiento Barcelona licitaciones"],
        frequency: "daily",
      };
      
      const result = await backendClient({
        endpoint: '/api/v1/subscriptions',
        method: 'POST',
        body: subscriptionData
      });
      
      setResult(result);
      
      if (result.data?.id) {
        setSubscriptionId(result.data.id);
      }
    } catch (error) {
      setResult({ error });
    } finally {
      setLoading(false);
    }
  };
  
  const testProcessSubscription = async () => {
    if (!subscriptionId) {
      setResult({ error: 'Please enter a subscription ID or create a subscription first' });
      return;
    }
    
    setLoading(true);
    try {
      const result = await backendClient({
        endpoint: `/api/v1/subscriptions/${subscriptionId}/process`,
        method: 'POST'
      });
      
      setResult(result);
    } catch (error) {
      setResult({ error });
    } finally {
      setLoading(false);
    }
  };
  
  const testDeleteSubscription = async () => {
    if (!subscriptionId) {
      setResult({ error: 'Please enter a subscription ID or create a subscription first' });
      return;
    }
    
    setLoading(true);
    try {
      const result = await backendClient({
        endpoint: `/api/v1/subscriptions/${subscriptionId}`,
        method: 'DELETE'
      });
      
      setResult(result);
      
      if (result.ok) {
        setSubscriptionId('');
      }
    } catch (error) {
      setResult({ error });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="col-span-3">
              <Label htmlFor="subscription-id">Subscription ID</Label>
              <Input 
                id="subscription-id" 
                value={subscriptionId} 
                onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="Enter subscription ID or create one"
              />
            </div>
            <Button 
              onClick={testCreateSubscription} 
              disabled={loading}
              className="w-full"
            >
              Create Subscription
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={testProcessSubscription} 
              disabled={loading || !subscriptionId}
              variant="outline"
            >
              Process Subscription
            </Button>
            <Button 
              onClick={testDeleteSubscription} 
              disabled={loading || !subscriptionId}
              variant="outline"
            >
              Delete Subscription
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-slate-100 p-3 rounded overflow-auto max-h-60 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6. Notification Testing Component

Create a component for testing notifications:

```jsx
// src/components/Debug/NotificationTester.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backendClient } from '@/lib/api/clients/backend';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function NotificationTester() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subId, setSubId] = useState('');
  const [endpoint, setEndpoint] = useState('/api/v1/notifications');
  
  const testEndpoints = [
    '/api/v1/notifications',
    '/api/notifications',
  ];
  
  const testNotifications = async () => {
    setLoading(true);
    try {
      const url = subId 
        ? `${endpoint}?subscriptionId=${subId}`
        : endpoint;
        
      const result = await backendClient({
        endpoint: url,
        method: 'GET',
      });
      
      setResult(result);
    } catch (error) {
      setResult({ error });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="endpoint-select">API Endpoint</Label>
              <Select 
                value={endpoint} 
                onValueChange={setEndpoint}
              >
                <SelectTrigger id="endpoint-select">
                  <SelectValue placeholder="Select endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {testEndpoints.map(ep => (
                    <SelectItem key={ep} value={ep}>{ep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subscription-filter">Subscription ID (Optional)</Label>
              <Input 
                id="subscription-filter" 
                value={subId} 
                onChange={(e) => setSubId(e.target.value)}
                placeholder="Filter by subscription ID"
              />
            </div>
            <Button 
              onClick={testNotifications} 
              disabled={loading}
              className="w-full"
            >
              Test Notifications
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-slate-100 p-3 rounded overflow-auto max-h-60 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7. Header Analysis Component

Create a component to test and visualize authentication headers:

```jsx
// src/components/Debug/HeaderAnalyzer.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AUTH_HEADER, USER_ID_HEADER, getAuthHeaders } from '@/lib/constants/headers';

export function HeaderAnalyzer() {
  const [headers, setHeaders] = useState(null);
  
  const analyzeHeaders = () => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    
    // Get headers using the app's utility function
    const authHeaders = getAuthHeaders(accessToken, userId);
    
    // Basic validation
    const issues = [];
    
    if (!authHeaders[AUTH_HEADER]) {
      issues.push('Missing Authorization header');
    } else if (!authHeaders[AUTH_HEADER].startsWith('Bearer ')) {
      issues.push('Authorization header missing "Bearer " prefix');
    }
    
    if (!authHeaders[USER_ID_HEADER]) {
      issues.push('Missing User ID header');
    }
    
    // Display token info if available
    let tokenInfo = null;
    if (accessToken) {
      try {
        // Parse JWT if possible
        const parts = accessToken.replace('Bearer ', '').split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          tokenInfo = {
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Not set',
            sub: payload.sub || 'Not set',
            expired: payload.exp ? (payload.exp * 1000 < Date.now()) : false
          };
        }
      } catch (e) {
        tokenInfo = { error: 'Could not parse token' };
      }
    }
    
    // Set analysis results
    setHeaders({
      authHeaders,
      issues,
      tokenInfo
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auth Header Analyzer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzeHeaders}>Analyze Headers</Button>
        
        {headers && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Headers:</h3>
              <pre className="bg-slate-100 p-3 rounded text-xs">
                {JSON.stringify(headers.authHeaders, null, 2)}
              </pre>
            </div>
            
            {headers.issues.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-red-500">Issues Found:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {headers.issues.map((issue, i) => (
                    <li key={i} className="text-red-500">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {headers.tokenInfo && (
              <div>
                <h3 className="font-semibold mb-2">Token Information:</h3>
                <div className="bg-slate-100 p-3 rounded">
                  {headers.tokenInfo.error ? (
                    <p className="text-red-500">{headers.tokenInfo.error}</p>
                  ) : (
                    <div className="space-y-1">
                      <p>Subject: {headers.tokenInfo.sub}</p>
                      <p>Expires: {headers.tokenInfo.exp}</p>
                      <p className={headers.tokenInfo.expired ? "text-red-500 font-bold" : ""}>
                        Status: {headers.tokenInfo.expired ? "EXPIRED" : "Valid"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 8. Enhanced Debug Page

Update the debug page to include all the components:

```jsx
// src/pages/Debug.tsx (updated)
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ApiMonitor } from '@/components/Debug/ApiMonitor';
import { SubscriptionTester } from '@/components/Debug/SubscriptionTester';
import { NotificationTester } from '@/components/Debug/NotificationTester';
import { HeaderAnalyzer } from '@/components/Debug/HeaderAnalyzer';

export default function DebugDashboard() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">NIFYA API Debug Dashboard</h1>
      
      <Tabs defaultValue="monitor">
        <TabsList className="mb-6">
          <TabsTrigger value="monitor">API Monitor</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitor">
          <ApiMonitor />
        </TabsContent>
        
        <TabsContent value="subscriptions">
          <SubscriptionTester />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationTester />
        </TabsContent>
        
        <TabsContent value="auth">
          <HeaderAnalyzer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 9. Backend Diagnostic Endpoints

Create diagnostic endpoints on the backend server that can be called from the frontend debug dashboard:

```javascript
// In the backend API server
app.get('/api/diagnostics/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    services: {
      backend: { status: 'up' },
      database: { status: 'up' },
      auth: { status: 'up' }
    }
  });
});

app.get('/api/diagnostics/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get subscription directly from database
    const subscription = await db.subscriptions.findUnique({
      where: { id }
    });
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found in database'
      });
    }
    
    // Return detailed information including raw DB record
    res.json({
      status: 'success',
      subscription,
      // Add any additional diagnostic info
      metadata: {
        lastProcessed: subscription.processed_at || 'never',
        totalNotifications: await db.notifications.count({
          where: { subscriptionId: id }
        })
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/diagnostics/notifications/test-payload', (req, res) => {
  // Return a sample notification payload for testing the frontend
  res.json({
    id: 'test-notification-123',
    title: 'Test Notification',
    content: 'This is a test notification for debugging purposes.',
    created_at: new Date().toISOString(),
    subscription_id: req.query.subscriptionId || 'test-subscription-123',
    read: false,
    entity_type: 'boe_document',
    data: {
      document_id: 'BOE-A-2023-12345',
      summary: 'Test document summary',
      url: 'https://boe.es/test-document'
    }
  });
});
```

## Implementation Steps

1. **Create the core logger service**:
   - Implement the `ApiLogger` class
   - Modify the backend client to use it

2. **Create Debug components**:
   - Implement API Monitor component
   - Build Subscription Tester
   - Develop Notification Tester
   - Create Header Analyzer

3. **Add Debug Route**:
   - Add route to application router
   - Create debug-focused layout

4. **Add Backend Diagnostics**:
   - Implement diagnostic endpoints
   - Create test fixtures

## Expected Outcomes

By implementing this testing approach, we expect to:

1. **Identify Authentication Issues**:
   - Token formatting problems
   - Missing or incorrect headers
   - Expiration-related issues

2. **Pinpoint API Communication Failures**:
   - Request format errors
   - Response parsing problems
   - Endpoint mismatches

3. **Isolate Database Issues**:
   - Schema mismatches
   - JSON format handling problems
   - Missing columns

## Usage Guide

1. **For Developers**:
   - Navigate to `/debug` route in the deployed frontend
   - Use the API Monitor to watch real-time requests/responses
   - Test specific endpoints with the domain-specific testers
   - Analyze auth headers for format issues

2. **For QA Testing**:
   - Use the subscription tester to verify end-to-end flow
   - Check notification delivery through the notification tester
   - Validate proper header/auth setup with the header analyzer

3. **For Automated Testing**:
   - Use the diagnostic endpoints for automated health checks
   - Export logs for CI/CD pipeline analysis

## Conclusion

This implementation plan provides a comprehensive approach to testing frontend-backend communication in the NIFYA platform. By focusing on real-time monitoring, component-specific testing, and diagnostic tools, we can quickly identify and resolve issues in the communication layer.

The modular approach allows for easy maintenance and extension, while providing both developers and testers with the tools they need to ensure robust integration between frontend and backend components.