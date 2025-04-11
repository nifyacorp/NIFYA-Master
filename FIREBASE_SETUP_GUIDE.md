# Firebase Project Setup Guide

This guide outlines the steps to create a new Firebase project and configure Authentication for our application.

## 1. Create a Firebase Project

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Click on "Add project" or "Create a project"
3. Enter a project name (e.g., "NIFYA")
4. Choose whether to enable Google Analytics (recommended)
5. Follow the prompts to complete project creation

## 2. Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Enable the following sign-in methods:
   - **Email/Password**: Click on it, toggle "Enable", and click "Save"
   - **Google**: Click on it, toggle "Enable", add support email, and click "Save"
   - (Optional) Enable other providers as needed (Facebook, Twitter, etc.)

## 3. Register Your App

### 3.1 Add Web App

1. From the project overview page, click the web icon (</>) to add a web app
2. Enter a nickname for your app (e.g., "NIFYA Web")
3. (Optional) Check "Also set up Firebase Hosting" if you plan to use it
4. Click "Register app"
5. Firebase will show your configuration - save it for later use
   
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

6. Click "Continue to console"

## 4. Create a Service Account

For backend integration, you need a Firebase Admin SDK service account:

1. Go to Project Settings (gear icon near top of sidebar)
2. Click on the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely - it contains sensitive credentials

## 5. Store Configuration in Secret Manager

### 5.1 Frontend Configuration

Store the Firebase configuration variables in Secret Manager:

1. Go to Google Cloud Console > Secret Manager
2. Create the following secrets:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

### 5.2 Backend Service Account

Store the Firebase Admin SDK service account credentials:

1. Create a secret called `FIREBASE_SERVICE_ACCOUNT`
2. Upload the JSON file you downloaded earlier

## 6. Configure Local Development

For local development, create a `.env` file in your frontend project:

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

## 7. Security Rules

### 7.1 Authentication Rules

By default, Firebase Authentication is secure. However, review the following settings:

1. In Authentication > Settings:
   - Email verification: Enable email verification (recommended)
   - Password requirements: Set minimum password length and complexity
   - Multi-factor authentication: Consider enabling for additional security

### 7.2 CORS Configuration

If your app is hosted on different domains:

1. Go to Authentication > Settings
2. In the "Authorized domains" section, add your app domains
   - e.g., `localhost`, `your-app.netlify.app`, `your-production-domain.com`

## 8. Testing

Test your Firebase Authentication setup:

1. Create a test user via the Firebase Console:
   - Go to Authentication > Users
   - Click "Add user" and provide an email and password
   
2. Try signing in with the test user credentials in your application

## 9. Next Steps

After setting up Firebase, follow these integration plans:

1. Frontend integration: See `frontend/src/auth/FIREBASE_INTEGRATION_PLAN.md`
2. Backend integration: See `backend/FIREBASE_AUTH_INTEGRATION_PLAN.md`
3. Authentication service: See `authentication-service/FIREBASE_INTEGRATION_PLAN.md` 