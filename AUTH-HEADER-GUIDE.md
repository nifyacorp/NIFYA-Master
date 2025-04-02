# Authentication Headers Guide

## Overview

This document provides critical guidance on handling authentication headers in the NIFYA application. Proper header formatting is essential for successful API requests.

## Required Headers Format

All authenticated requests to the NIFYA backend services **MUST** include these headers in the exact format:

```
Authorization: Bearer {token}
x-user-id: {userId}
```

**Critical requirements:**
- The `Authorization` header must start with `Bearer ` (note the space after "Bearer")
- The `x-user-id` header must contain the user ID that matches the subject in the JWT token

## Common Authentication Errors

### 1. MISSING_HEADERS Error (401)

This error occurs when:
- The `Authorization` header is missing
- The `Authorization` header doesn't have the required `Bearer ` prefix
- The `x-user-id` header is missing

Example error response:
```json
{
  "error": "MISSING_HEADERS",
  "message": "Invalid Authorization header format. Must be: Bearer <token>",
  "status": 401,
  "details": {
    "providedHeader": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-04-02T06:50:46.946Z"
}
```

### 2. USER_MISMATCH Error (401)

This error occurs when the user ID in the `x-user-id` header doesn't match the subject (`sub`) claim in the JWT token.

Example error response:
```json
{
  "error": "USER_MISMATCH",
  "message": "User ID in header does not match token subject",
  "status": 401,
  "details": {
    "tokenUserId": "65c6074d-dbc4-4091-8e45-b6aecffd9ab9",
    "headerUserId": "incorrect-user-id"
  },
  "timestamp": "2025-04-02T06:50:46.946Z"
}
```

## Best Practices

### 1. Always Use the Auth Utilities

Never construct authentication headers manually. Always use the provided utility functions:

```typescript
// In frontend/src/lib/utils/auth-recovery.ts
import { verifyAuthHeaders } from '../../lib/utils/auth-recovery';

// Call this before making API requests
verifyAuthHeaders();
```

### 2. Check Authentication State After Login

After login, verify that authentication state has been properly set:

```typescript
const token = localStorage.getItem('accessToken');
console.log('Token format check:', {
  hasToken: !!token,
  hasBearer: token?.startsWith('Bearer '),
  tokenLength: token?.length
});
```

### 3. Proper Bearer Token Storage

When storing tokens, always ensure they have the Bearer prefix:

```typescript
// Correct way to store tokens
const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
localStorage.setItem('accessToken', formattedToken);
```

### 4. Debug Authentication Issues

If you encounter authentication issues:

1. Check browser console for auth-related errors
2. Verify token format in localStorage
3. Check network requests to see the exact headers being sent
4. Verify the user ID matches between the token and the header

## Authentication Flow

The authentication flow in NIFYA works as follows:

1. User logs in via the Authentication Service
2. Service returns a JWT token
3. Frontend stores token with `Bearer ` prefix in localStorage
4. Frontend extracts user ID from token and stores it
5. All subsequent API requests include both the Authorization and x-user-id headers

## Implementation Details

The auth middleware in the backend (in `auth.middleware.js`) validates:

1. That the Authorization header is present and has the Bearer prefix
2. That the x-user-id header is present
3. That the user ID in the x-user-id header matches the sub claim in the JWT

Any mismatch results in a 401 Unauthorized response.