# Cloud Run Deployment Guide for NIFYA Frontend

## Overview

This guide describes how to deploy the NIFYA frontend to Google Cloud Run. The setup is designed to be flexible and handle different repository structures.

## Files Included

1. **Root Dockerfile**: Flexible Docker build that detects your project structure 
2. **cloudbuild.yaml**: Cloud Build configuration for continuous deployment
3. **frontend/Dockerfile**: Specialized Docker configuration if using the frontend subfolder structure
4. **frontend/nginx.conf**: NGINX configuration for the frontend

## Quick Start

The easiest way to deploy is directly from Google Cloud Console:

1. Go to Cloud Run in your Google Cloud Console
2. Click "Create Service"
3. Choose "Continuously deploy from a repository"
4. Connect your GitHub repository
5. Set up the build trigger to use the provided cloudbuild.yaml

## Manual Deployment

To deploy manually:

```bash
# Clone your repository
git clone https://github.com/nifyacorp/main_e.git
cd main_e

# Build the Docker image
docker build -t gcr.io/your-project-id/nifya-frontend:latest .

# Push to Container Registry
docker push gcr.io/your-project-id/nifya-frontend:latest

# Deploy to Cloud Run
gcloud run deploy nifya-frontend \
  --image gcr.io/your-project-id/nifya-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "AUTH_SERVICE_URL=https://authentication-service-415554190254.us-central1.run.app,BACKEND_SERVICE_URL=https://backend-415554190254.us-central1.run.app"
```

## Customizing Environment Variables

Set the environment variables to point to your backend services:

- **AUTH_SERVICE_URL**: URL for authentication service
- **BACKEND_SERVICE_URL**: URL for main backend service

These are used by the NGINX configuration to proxy API requests.

## Debugging Deployment Issues

If you encounter issues with the deployment:

1. **Check Docker Build Locally**:
   ```bash
   docker build -t nifya-frontend-test .
   docker run -p 8080:8080 nifya-frontend-test
   ```

2. **Examine Cloud Build Logs**:
   Go to Cloud Build history in Google Cloud Console to view detailed logs.

3. **Verify Repository Structure**:
   - If you have a monorepo with frontend in a subdirectory, use the frontend/Dockerfile
   - If frontend is at the root, use the root Dockerfile

4. **Check NGINX Configuration**:
   Make sure the nginx.conf file is correctly set up for your application's routing needs.

## Post-Deployment Testing

After deploying, test the following:

1. Navigation through the application
2. Authentication/login flow
3. API connectivity to backend services
4. Proper handling of routes by the SPA router

## Continuous Deployment

For continuous deployment:

1. Go to Cloud Build > Triggers in Google Cloud Console
2. Create a new trigger pointing to your repository
3. Set up the trigger to use the cloudbuild.yaml file
4. Set the trigger to run on commits to your main branch