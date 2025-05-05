# NIFYA Admin Frontend-Backend Integration Plan

This document outlines the process for connecting the NIFYA admin frontend interface with the newly implemented backend API endpoints, replacing mock data with real data from the server.

## Table of Contents

- [Overview](#overview)
- [API Services Structure](#api-services-structure)
- [Authentication Integration](#authentication-integration)
- [Component Refactoring Strategy](#component-refactoring-strategy)
- [Data Fetching Implementation](#data-fetching-implementation)
- [Error Handling](#error-handling)
- [Implementation Steps](#implementation-steps)

## Overview

The existing admin frontend implementation currently uses mock data as defined in the Admin Implementation Plan. We will replace this mock data with real data fetched from the backend API endpoints documented in the Admin API Documentation.

### Key Goals

1. Maintain the same UI/UX while replacing data sources
2. Implement proper authentication flow for admin access
3. Handle loading states, errors, and edge cases
4. Ensure type safety and data consistency
5. Provide appropriate feedback to users during API operations

## API Services Structure

We will create a dedicated API services layer for the admin functionality. This will separate API concerns from component logic and provide a clean interface for data fetching.

### Folder Structure

```
src/
├── api/
│   ├── core/
│   │   ├── apiClient.ts       # Base API client with authentication and error handling
│   │   └── types.ts           # Shared API types
│   │
│   ├── admin/
│   │   ├── auth.ts            # Admin authentication utilities
│   │   ├── dashboard.ts       # Dashboard statistics and activity endpoints
│   │   ├── users.ts           # User management endpoints
│   │   ├── subscriptionTypes.ts  # Subscription type management endpoints
│   │   ├── subscriptions.ts   # Subscription management endpoints
│   │   └── notifications.ts   # Notification management endpoints
```

### API Client Implementation

The core `apiClient.ts` will provide:

1. A base axios instance with proper configuration
2. Authentication header injection
3. Error handling and standardization
4. Response transformation and type checking

Example implementation:

```typescript
// apiClient.ts
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-415554190254.us-central1.run.app';

// Create base axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getFirebaseToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle errors based on status codes and provide standardized error format
    const errorResponse = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'An unexpected error occurred',
      details: error.response?.data || {},
    };
    
    return Promise.reject(errorResponse);
  }
);

export default apiClient;
```

## Authentication Integration

The admin area requires specialized authentication with admin role verification. We will:

1. Use Firebase Authentication for the initial auth
2. Verify admin role through the backend middleware
3. Handle unauthorized access and redirects

```typescript
// auth.ts
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import apiClient from '../core/apiClient';

// Check if user has admin access
export const verifyAdminAccess = async (): Promise<boolean> => {
  try {
    // Make a simple API call to an admin endpoint
    await apiClient.get('/admin/dashboard/stats');
    return true;
  } catch (error) {
    return false;
  }
};

// Higher-order component for admin route protection
export const withAdminAuth = (Component) => {
  return (props) => {
    // Component logic to check admin access and redirect if needed
    // ...
  };
};
```

## Component Refactoring Strategy

We will refactor each admin component to fetch real data while maintaining UI consistency. The general pattern will be:

1. Replace mock data with API calls
2. Add loading states
3. Implement error handling
4. Ensure type compatibility

Example refactoring for a component:

### Before (With Mock Data)

```typescript
// UsersManagement.tsx (before)
import React from 'react';
import UserTable from '../components/admin/UserTable';

// Mock data
const MOCK_USERS = [
  {
    id: 'user123',
    email: 'user@example.com',
    name: 'John Doe',
    isActive: true,
    lastLogin: '2023-03-15T10:30:00.000Z',
    registeredAt: '2023-01-01T00:00:00.000Z'
  },
  // More mock users...
];

const UserManagement = () => {
  return <UserTable users={MOCK_USERS} />;
};

export default UserManagement;
```

### After (With API Data)

```typescript
// UsersManagement.tsx (after)
import React, { useState, useEffect } from 'react';
import UserTable from '../components/admin/UserTable';
import { LoadingSpinner, ErrorAlert } from '../components/ui';
import { getUsers } from '../api/admin/users';
import { User } from '../api/admin/types';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getUsers({ page, limit });
        setUsers(response.users);
        setTotal(response.pagination.total);
        setError(null);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, limit]);

  if (loading && users.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && users.length === 0) {
    return <ErrorAlert message={error} />;
  }

  return (
    <>
      {error && <ErrorAlert message={error} />}
      <UserTable 
        users={users} 
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (newPage) => setPage(newPage)
        }}
      />
    </>
  );
};

export default UserManagement;
```

## Data Fetching Implementation

For each admin section, we will implement API service functions that correspond to the backend endpoints. For example:

### Dashboard API Service

```typescript
// dashboard.ts
import apiClient from '../core/apiClient';

export interface DashboardStats {
  users: {
    total_users: number;
    regular_users: number;
    admin_users: number;
    new_users_last_7_days: number;
    new_users_last_30_days: number;
  };
  subscriptions: {
    total_subscriptions: number;
    active_subscriptions: number;
    inactive_subscriptions: number;
    subscription_type_counts: Record<string, number>;
  };
  notifications: {
    total_notifications: number;
    unread_notifications: number;
    read_notifications: number;
    email_sent_notifications: number;
    notifications_last_7_days: number;
  };
  timestamp: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  entity_type: string | null;
  entity_name: string | null;
  created_at: string;
  details: Record<string, any>;
}

export interface ActivityResponse {
  activities: ActivityItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/admin/dashboard/stats');
  return response.data;
};

export const getRecentActivity = async (
  params: { limit?: number; offset?: number } = {}
): Promise<ActivityResponse> => {
  const response = await apiClient.get('/admin/dashboard/activity', { params });
  return response.data;
};
```

### User Management API Service

```typescript
// users.ts
import apiClient from '../core/apiClient';

export interface User {
  id: string;
  display_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  subscription_count: number;
  notification_count: number;
}

export interface UserResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface UserDetail extends User {
  first_name: string | null;
  last_name: string | null;
  profile: {
    bio: string | null;
    interests: string[];
  };
  preferences: {
    language: string;
    theme: string;
  };
  notifications: {
    email: {
      enabled: boolean;
      useCustomEmail: boolean;
      customEmail: string | null;
      digestTime: string;
    };
  };
  subscriptions: Array<{
    id: string;
    name: string;
    type_id: string;
    type_name: string;
    active: boolean;
    created_at: string;
  }>;
}

export const getUsers = async (
  params: { 
    page?: number; 
    limit?: number;
    sort_by?: 'display_name' | 'email' | 'created_at' | 'role';
    sort_order?: 'asc' | 'desc';
  } = {}
): Promise<UserResponse> => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

export const getUserDetails = async (userId: string): Promise<UserDetail> => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data.user;
};

export const setUserStatus = async (
  userId: string, 
  status: 'active' | 'inactive'
): Promise<{ success: boolean; message: string; timestamp: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/set-status`, { status });
  return response.data;
};

export const setUserRole = async (
  userId: string,
  role: 'user' | 'admin'
): Promise<{ success: boolean; message: string; timestamp: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/set-role`, { role });
  return response.data;
};

export const resetUserPassword = async (
  userId: string
): Promise<{ success: boolean; message: string; timestamp: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/reset-password`);
  return response.data;
};

export const searchUsers = async (
  params: {
    term: string;
    field?: 'display_name' | 'email' | 'both';
    page?: number;
    limit?: number;
  }
): Promise<UserResponse> => {
  const response = await apiClient.get('/admin/users/search', { params });
  return response.data;
};
```

Similar service files would be implemented for subscription types, subscriptions, and notifications.

## Error Handling

We will implement consistent error handling across the admin interface:

1. **User-facing errors**: Display toast notifications or inline error messages
2. **Developer errors**: Log detailed errors to the console
3. **Recovery strategies**: Retry mechanisms, fallbacks to cached data

Example error handling component:

```typescript
// ErrorHandler.tsx
import React from 'react';
import { Alert, AlertTitle } from '../ui';

interface ApiError {
  status: number;
  message: string;
  details?: any;
}

interface ErrorHandlerProps {
  error: ApiError | null;
  onRetry?: () => void;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({ error, onRetry }) => {
  if (!error) return null;

  // Map status codes to user-friendly messages
  const getErrorMessage = () => {
    switch (error.status) {
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  return (
    <Alert severity="error">
      <AlertTitle>Error</AlertTitle>
      {getErrorMessage()}
      {onRetry && (
        <button onClick={onRetry}>
          Retry
        </button>
      )}
    </Alert>
  );
};

export default ErrorHandler;
```

## Implementation Steps

We'll take a direct approach to implement the API integration:

1. Create the base API client with authentication
2. Implement all admin API service files with proper TypeScript interfaces
3. Refactor admin components to use real API data
4. Add proper loading and error states to components
5. Implement admin route protection

This approach allows us to quickly integrate the backend API without unnecessary complexity. 