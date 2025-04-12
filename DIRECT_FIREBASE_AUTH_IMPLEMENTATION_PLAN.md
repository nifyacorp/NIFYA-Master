# Direct Firebase Authentication Implementation Plan

## Overview

This document outlines the implementation plan for simplifying the current authentication architecture by using Firebase Authentication directly in the frontend rather than proxying requests through the backend. This approach will:

1. Reduce complexity by eliminating intermediary backend proxy endpoints
2. Improve reliability by removing potential points of failure
3. Maintain security through proper token verification on the backend
4. Follow Firebase best practices for authentication

## Current Architecture Issues

The current implementation has several issues:

1. **Unnecessary Complexity**: Authentication requests are proxied through backend endpoints rather than using Firebase directly
2. **Extra Network Hops**: Each authentication operation requires multiple HTTP requests
3. **Potential Points of Failure**: The backend proxy can fail even when Firebase is working correctly
4. **Maintenance Overhead**: Changes to Firebase Auth require updates to both frontend and backend

## Implementation Plan

### 1. Frontend Changes

#### 1.1 Install Firebase SDK

```bash
# In frontend directory
npm install firebase
```

#### 1.2 Create Firebase Configuration

Create a new file at `frontend/src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration - sourced from environment variables
const firebaseConfig = {
  apiKey: window.ENV?.FIREBASE_API_KEY,
  authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN,
  projectId: window.ENV?.FIREBASE_PROJECT_ID,
  storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.ENV?.FIREBASE_APP_ID,
  measurementId: window.ENV?.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
```

#### 1.3 Update Auth Context

Rewrite `frontend/src/auth/hooks/useAuth.ts` to use Firebase directly:

```typescript
/**
 * useAuth Hook
 * 
 * Provides authentication functionality using Firebase directly
 */

import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Type for user data
export class User {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;

  constructor(firebaseUser: FirebaseUser) {
    this.id = firebaseUser.uid;
    this.email = firebaseUser.email;
    this.displayName = firebaseUser.displayName;
    this.emailVerified = firebaseUser.emailVerified;
  }
}

// Credentials interfaces
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  name?: string;
}

/**
 * Hook to use Authentication
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        // Convert Firebase user to our User model
        setUser(new User(firebaseUser));
        
        // Sync user with backend (optional)
        syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  /**
   * Sync authenticated user with backend
   */
  const syncUserWithBackend = async (firebaseUser: FirebaseUser): Promise<void> => {
    try {
      // Get ID token from Firebase
      const token = await firebaseUser.getIdToken();
      
      // Call backend sync endpoint
      const backendUrl = window.ENV?.BACKEND_SERVICE_URL || 'https://backend-415554190254.us-central1.run.app';
      await axios.post(`${backendUrl}/v1/users/sync`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('User sync failed:', err);
      // Non-critical error, don't need to show to user
    }
  };

  /**
   * Sign in with email/password
   */
  const login = async (credentials: AuthCredentials): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Sign in directly with Firebase
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      return true;
    } catch (err: any) {
      // Handle Firebase Auth errors
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect email or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Google
   */
  const loginWithGoogle = async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return true;
    } catch (err: any) {
      // Handle errors
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in canceled. Please try again.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user
   */
  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Create user directly with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // Update profile if name is provided
      if (credentials.name && userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: credentials.name
        });
      }
      
      return true;
    } catch (err: any) {
      // Handle Firebase Auth errors
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or try to login.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please enter a valid email address.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send password reset email
   */
  const forgotPassword = async (email: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Send password reset email directly through Firebase
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      // For security reasons, don't expose whether the email exists
      // Just return success even if the email doesn't exist
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out
   */
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  /**
   * Clear any authentication errors
   */
  const clearErrors = () => {
    setError(null);
  };

  /**
   * Get authentication headers for API requests
   */
  const authHeaders = async () => {
    if (!user) return {};
    
    try {
      const token = await auth.currentUser?.getIdToken(true);
      return {
        Authorization: `Bearer ${token}`
      };
    } catch (err) {
      console.error('Error getting auth token:', err);
      return {};
    }
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string) => {
    // This can be expanded based on your permission model
    return !!user;
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    forgotPassword,
    logout,
    clearErrors,
    authHeaders,
    hasPermission
  };
}
```

#### 1.4 Create Auth Components

Create a new directory `frontend/src/auth/components` with:

1. LoginForm.tsx - Form for login
2. RegisterForm.tsx - Form for registration 
3. ResetPasswordForm.tsx - Form for password reset

### 2. Backend Changes

#### 2.1 Retain Token Verification

Keep the existing Firebase token verification middleware, as it's still needed to authenticate API requests:

```javascript
// src/interfaces/http/middleware/firebase-auth.middleware.js
```

#### 2.2 Remove Proxy Endpoints

Remove the following endpoints from `backend/src/interfaces/http/routes/firebase-sync.routes.js`:

- `/v1/auth/login`
- `/v1/auth/register`
- `/v1/auth/reset-password`

But keep the user synchronization endpoint:

- `/v1/users/sync`

#### 2.3 Update Backend Routes

Update `backend/src/index.js` to reflect these changes.

### 3. API Integration 

#### 3.1 Create API Client with Auth Headers

```typescript
// frontend/src/api/client.ts
import axios from 'axios';
import { auth } from '../config/firebase';

const apiClient = axios.create({
  baseURL: window.ENV?.BACKEND_SERVICE_URL || 'https://backend-415554190254.us-central1.run.app'
});

// Add auth token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});

export default apiClient;
```

### 4. Testing

#### 4.1 Testing Plan

1. Test user registration
2. Test user login
3. Test Google sign-in
4. Test password reset
5. Test token refresh
6. Test API access with token
7. Test token expiration handling

#### 4.2 Test Script

```javascript
// tests/auth.test.js - Example test outline
describe('Authentication', () => {
  test('User can register', async () => {
    // Test registration
  });
  
  test('User can login', async () => {
    // Test login
  });
  
  test('API calls include auth token', async () => {
    // Test API authorization
  });
});
```

### 5. Deployment

#### 5.1 Environment Variables

Ensure the following environment variables are set in the frontend build:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

#### 5.2 Update Build Process

Update `frontend/cloudbuild.yaml` to ensure Firebase variables are available during build.

## Benefits of This Approach

1. **Simplified Authentication Flow**: Direct Firebase integration in the frontend reduces complexity
2. **Improved Reliability**: Removes backend as a potential point of failure for authentication
3. **Better User Experience**: Faster authentication with fewer network requests
4. **Reduced Backend Load**: Authentication processing handled by Firebase instead of your backend
5. **Easier Maintenance**: Changes to authentication flow only need to be made in one place (frontend)
6. **Follows Best Practices**: Uses Firebase as intended by the Firebase team

## Migration Strategy

1. Implement the new Firebase direct integration in the frontend
2. Keep the backend proxy temporarily to support both methods
3. Gradually transition users to the new method
4. Once all users are migrated, remove the proxy endpoints

## Security Considerations

1. **Token Verification**: Backend still verifies Firebase tokens for all API requests
2. **Secrets Management**: Firebase config is stored in environment variables and runtime config
3. **CORS Settings**: Ensure Firebase Authentication domains are whitelisted in Firebase Console

## Timeline

1. Frontend Firebase SDK Integration: 1 day
2. Auth Context & Components Update: 2 days
3. Backend Changes & Testing: 1 day
4. Deployment & Monitoring: 1 day

Total Estimated Time: 5 days 