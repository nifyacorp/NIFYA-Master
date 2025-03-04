# NIFYA Frontend Implementation Plan

## Overview

This document outlines the complete implementation plan for integrating shadcn UI components with the New York theme into the NIFYA application, along with connecting all components to the backend API.

## Phase 1: Setup & Dependencies

### 1.1 Install Required Dependencies

```bash
# Core dependencies
npm install @radix-ui/react-icons lucide-react date-fns
npm install zod @hookform/resolvers react-hook-form
npm install axios react-query

# UI dependencies
npm install tailwindcss-animate @tailwindcss/typography
```

### 1.2 Set Up shadcn UI

```bash
# Initialize shadcn UI
npx shadcn-ui@latest init

# When prompted, configure with:
# - Style: New York
# - Base color: Slate
# - CSS variables for colors: Yes
# - Global CSS file: src/styles/globals.css
# - CSS import strategy: Import
# - Path for components: @/components/ui
# - Path for utils: @/lib/utils
# - Add React Server Components: No (unless using Next.js)
```

### 1.3 Install Required Components

```bash
# Install all required shadcn UI components
npx shadcn-ui@latest add button card badge avatar dropdown-menu sheet toast
npx shadcn-ui@latest add navigation-menu alert dialog form checkbox input
npx shadcn-ui@latest add select textarea tabs skeleton tooltip radio-group
npx shadcn-ui@latest add table popover calendar command switch separator
```

## Phase 2: API Integration

### 2.1 Create API Service Layer

Create a structured API service layer to handle all backend communications:

```bash
mkdir -p src/services/api
touch src/services/api/axios-config.ts
touch src/services/api/auth-service.ts
touch src/services/api/subscription-service.ts
touch src/services/api/notification-service.ts
```

### 2.2 Implement API Client Configuration

In `src/services/api/axios-config.ts`:
- Configure Axios instance with base URL and interceptors
- Set up request/response interceptors for authentication headers
- Implement error handling and token refresh logic

### 2.3 Implement Service Modules

For each service module (`auth-service.ts`, `subscription-service.ts`, `notification-service.ts`):
- Define TypeScript interfaces for request/response data
- Implement CRUD operations for respective entities
- Add error handling and response transformation

## Phase 3: State Management & Hooks

### 3.1 Create Custom Hooks

```bash
mkdir -p src/hooks
touch src/hooks/use-auth.ts
touch src/hooks/use-subscriptions.ts
touch src/hooks/use-notifications.ts
touch src/hooks/use-toast.ts
```

### 3.2 Implement React Query Integration

- Set up React Query for data fetching and caching
- Create query hooks for subscriptions and notifications
- Implement mutation hooks for creating/updating data

## Phase 4: Component Integration

### 4.1 Authentication Components

- Connect login/signup forms to auth API
- Implement token storage and refresh logic
- Add protected route logic

### 4.2 Subscription Components

#### `SubscriptionForm.tsx` Integration:
```typescript
// Update onSubmit function
const onSubmit = async (data: FormValues) => {
  setIsSubmitting(true);
  try {
    if (isEditing && initialData) {
      await subscriptionService.updateSubscription(initialData.id, data);
      toast({
        title: "Success",
        description: "Subscription updated successfully",
        variant: "success"
      });
    } else {
      await subscriptionService.createSubscription(data);
      toast({
        title: "Success",
        description: "Subscription created successfully",
        variant: "success"
      });
    }
    navigate('/subscriptions');
  } catch (error) {
    console.error("Error submitting form:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to save subscription",
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### 4.3 Notification Components

- Connect notification listing to API
- Implement read/unread functionality with API calls
- Add real-time updates with WebSockets (if applicable)

### 4.4 Dashboard Integration

- Connect statistics widgets to API endpoints
- Implement data visualization with real data
- Add refresh functionality for real-time updates

## Phase 5: Testing & Optimization

### 5.1 Unit Testing

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

- Create unit tests for critical components
- Test API integration with mock service workers
- Ensure form validation works correctly

### 5.2 End-to-End Testing

```bash
npm install --save-dev cypress
```

- Create E2E tests for main user flows
- Test authentication, subscription creation, and notification handling

### 5.3 Performance Optimization

- Implement code splitting for lazy-loaded routes
- Add proper React.memo for expensive components
- Optimize API calls with debounce and proper caching

## Phase 6: Enhancements & Polish

### 6.1 Error Handling

- Implement global error boundary
- Add toast notifications for API errors
- Create user-friendly error messages

### 6.2 Loading States

- Add skeleton loaders for all async operations
- Implement optimistic UI updates where appropriate
- Add proper disabled states during form submissions

### 6.3 Animations & Transitions

- Add page transition animations
- Implement micro-interactions for better UX
- Ensure smooth dark/light mode transitions

## Phase 7: Deployment

### 7.1 Build Configuration

- Optimize build process
- Configure environment variables
- Set up CI/CD pipeline

### 7.2 Deployment Environments

- Configure staging and production environments
- Set up proper API endpoints for each environment
- Implement feature flags for gradual rollout

## Implementation Timeline

| Phase | Estimated Duration | Dependencies |
|-------|-------------------|--------------|
| Phase 1: Setup | 1-2 days | None |
| Phase 2: API Integration | 3-4 days | Phase 1 |
| Phase 3: State Management | 2-3 days | Phase 2 |
| Phase 4: Component Integration | 4-5 days | Phase 3 |
| Phase 5: Testing | 3-4 days | Phase 4 |
| Phase 6: Enhancements | 2-3 days | Phase 5 |
| Phase 7: Deployment | 1-2 days | Phase 6 |

## API Endpoints Reference

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/auth/login` | POST | User login | To implement |
| `/api/auth/register` | POST | User registration | To implement |
| `/api/auth/refresh` | POST | Refresh token | To implement |
| `/api/subscriptions` | GET | List subscriptions | To implement |
| `/api/subscriptions` | POST | Create subscription | To implement |
| `/api/subscriptions/:id` | GET | Get subscription | To implement |
| `/api/subscriptions/:id` | PUT | Update subscription | To implement |
| `/api/subscriptions/:id` | DELETE | Delete subscription | To implement |
| `/api/subscriptions/:id/process` | POST | Process subscription | To implement |
| `/api/notifications` | GET | List notifications | To implement |
| `/api/notifications/:id/read` | PUT | Mark notification as read | To implement |
| `/api/notifications/read-all` | PUT | Mark all as read | To implement |

## Required Environment Variables

Create a `.env` file with the following variables:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AUTH_TOKEN_KEY=nifya_auth_token
VITE_REFRESH_TOKEN_KEY=nifya_refresh_token
```

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating the shadcn UI components with the backend API. Following this structured approach will ensure a smooth integration process and result in a fully functional, aesthetically pleasing application with proper API connectivity. 