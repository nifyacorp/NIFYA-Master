# Firebase Authentication Backend Proxy - Deployment Guide

This document outlines the steps needed to deploy the updated authentication system that moves Firebase authentication from the frontend to the backend.

## Overview of Changes

1. **Backend Changes**
   - Added authentication proxy endpoints
   - Modified Firebase API key handling to use Secret Manager
   - Created helper functions for authentication

2. **Frontend Changes**
   - Removed direct Firebase authentication
   - Created a mock Firebase auth implementation
   - Updated authentication hooks to use backend proxy
   - Simplified environment variable requirements

## Prerequisites

1. Ensure you have the Firebase API key stored in Secret Manager:
   - Secret name: `FIREBASE_API_KEY`
   - Project: Same Google Cloud project where backend is deployed

## Deployment Steps

### 1. Backend Deployment

1. Verify Secret Manager integration:
   ```bash
   # In backend directory
   grep -r "getSecret" src/
   ```

2. Update and commit backend changes:
   ```bash
   git add .
   git commit -m "Move Firebase authentication to backend proxy"
   git push
   ```

3. Deploy backend to Cloud Run:
   ```bash
   # Wait for Cloud Build to complete automatically
   # Monitor build status in Google Cloud Console
   ```

4. Verify backend deployment and API endpoints:
   ```bash
   curl -i https://backend-415554190254.us-central1.run.app/v1/health
   ```

### 2. Frontend Deployment

1. Verify Firebase proxy implementation:
   ```bash
   # In frontend directory
   grep -r "MockFirebaseAuth" src/
   ```

2. Update and commit frontend changes:
   ```bash
   git add .
   git commit -m "Replace Firebase auth with backend proxy implementation"
   git push
   ```

3. Deploy frontend to Cloud Run:
   ```bash
   # Wait for Cloud Build to complete automatically
   # Monitor build status in Google Cloud Console
   ```

4. Verify frontend deployment and auth flow:
   - Visit `https://main-page-415554190254.us-central1.run.app/`
   - Try logging in with test credentials

### 3. Environment Variable Setup

1. Update Cloud Run frontend service:
   - Remove all `FIREBASE_*` environment variables
   - Keep only `AUTH_SERVICE_URL` and `BACKEND_SERVICE_URL`

2. Update Cloud Run backend service:
   - Add access to Secret Manager (verify IAM permissions)
   - Add Secret Manager binding for `FIREBASE_API_KEY`

### 4. Testing Authentication

1. Test Authentication Flow:
   - User Registration
   - User Login
   - Password Reset
   - Profile Access (authenticated requests)

### 5. Troubleshooting

If you encounter issues:

1. **Frontend can't connect to backend**:
   - Check CORS settings in backend
   - Verify `BACKEND_SERVICE_URL` is correct

2. **Backend can't access Firebase**:
   - Check Secret Manager permissions 
   - Verify Firebase API key in Secret Manager

3. **Authentication fails**:
   - Check backend logs for detailed error messages
   - Verify network requests in browser developer tools

## Rollback Plan

If needed, reverse the changes:

1. **Frontend Rollback**:
   - Revert to direct Firebase authentication
   - Re-add Firebase environment variables to Cloud Run

2. **Backend Rollback**:
   - Disable authentication proxy endpoints

## Conclusion

After successful deployment:
- The frontend no longer needs Firebase credentials
- All authentication flows through the backend
- System is more secure with credentials stored in Secret Manager 