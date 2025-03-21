# Zod Validation Implementation

This document describes the implementation of Zod validation in the NIFYA application to make frontend-backend communication more robust.

## Overview

We've implemented a comprehensive validation system using Zod that works on both frontend and backend. This approach ensures:

1. **Consistent validation** across the stack
2. **Type safety** with TypeScript integration
3. **Self-documenting** API contracts
4. **Better error handling** with detailed validation feedback

## Frontend Implementation

### Validation Utils (`/frontend/src/lib/utils/validation.ts`)

The frontend validation utility provides functions to validate data against schemas:

```typescript
import { z } from 'zod';

// Generic validation function that returns a structured result
export function validateWithZod<T>(schema: z.ZodType<T>, data: unknown) {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData, error: null };
  } catch (error) {
    // Format Zod errors into a user-friendly structure
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {} as Record<string, string>);
      
      return { 
        success: false, 
        data: null as unknown as T, 
        error: {
          message: 'Validation failed',
          details: formattedErrors
        }
      };
    }
    
    return { 
      success: false, 
      data: null as unknown as T, 
      error: {
        message: 'Validation error',
        details: { _error: 'Unknown validation error' }
      }
    };
  }
}

// Helper to create a typed validator for a specific schema
export function createValidator<T>(schema: z.ZodType<T>) {
  return (data: unknown) => validateWithZod<T>(schema, data);
}
```

### Schemas (`/frontend/src/lib/api/schemas.ts`)

Centralized schema definitions with custom error messages:

```typescript
import { z } from 'zod';

// Reusable schema components
export const UuidSchema = z.string().uuid({
  message: 'Invalid UUID format'
});

export const EmailSchema = z.string().email({
  message: 'Invalid email address format'
});

// Domain-specific schemas
export const CreateSubscriptionSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long' }).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['boe', 'real-estate', 'custom']),
  // ... more fields
});

// Type exports for TypeScript integration
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionSchema>;
```

### API Service Integration (`/frontend/src/lib/api/services/subscriptions.ts`)

API service methods now validate inputs before sending:

```typescript
export const subscriptionService = {
  create: (data: CreateSubscriptionInput): Promise<ApiResponse<{ subscription: Subscription }>> => {
    // Validate input data against schema
    const validation = validateWithZod(CreateSubscriptionSchema, data);
    
    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      console.groupEnd();
      
      // Return a rejected promise with validation errors
      return Promise.resolve({
        status: 400,
        ok: false,
        error: 'Validation failed',
        data: { 
          validationErrors: validation.error?.details || {},
          message: 'Please correct the errors and try again'
        } as any
      });
    }
    
    // Proceed with valid data
    return backendClient({
      endpoint: '/api/v1/subscriptions',
      method: 'POST',
      body: validation.data,
    });
  },
  // ... other methods
}
```

## Backend Implementation

### Validation Middleware (`/backend/src/shared/utils/validation.js`)

Middleware that integrates with Express/Fastify:

```javascript
import { z } from 'zod';
import { errorBuilders } from '../errors/ErrorResponseBuilder.js';

export function validateZod(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      req[source] = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          details[path] = err.message;
        });
        
        const validationError = errorBuilders.validationError(req, details);
        next(validationError);
      } else {
        const serverError = errorBuilders.serverError(req, error);
        next(serverError);
      }
    }
  };
}
```

### Backend Schemas (`/backend/src/core/subscription/schemas.js`)

Domain-specific schemas:

```javascript
import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long' }).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['boe', 'real-estate', 'custom']),
  // ... more fields
});
```

### Route Integration (`/backend/src/interfaces/http/routes/subscription/crud.routes.js`)

Route handlers with Zod validation:

```javascript
import { validateZod } from '../../../../shared/utils/validation.js';
import { createSubscriptionSchema } from '../../../../core/subscription/schemas.js';

// POST / - Create a new subscription
fastify.post('/', {
  // ... schema definition for documentation ...
  preHandler: validateZod(createSubscriptionSchema)
}, async (request, reply) => {
  // Request body is already validated and typed
  const { name, type, prompts } = request.body;
  
  // Business logic...
});
```

## Benefits

1. **Early validation** catches errors before they hit services
2. **Consistent error format** across the application
3. **Type safety** with TypeScript integration
4. **Self-documenting** schemas that serve as API contracts
5. **Improved developer experience** with better error messages

## Usage Guidelines

1. Define schemas in central locations (`schemas.ts` / `schemas.js`)
2. Use `validateWithZod` in frontend services before API calls
3. Use `validateZod` middleware in backend routes
4. Share schema type definitions between components with TypeScript

---

By implementing Zod validation throughout the application, we've significantly improved the robustness of frontend-backend communication, providing clearer error messages and ensuring data consistency across the stack.

## Extending to Backend-Only Services

We've also extended Zod validation to backend-only services that don't communicate directly with the frontend, improving internal API robustness:

### Notification Service

The notification service handles user notifications and includes:

- Comprehensive validation for notification queries with proper type coercion
- Validation for notification ID parameters
- WebSocket notification data validation

```javascript
// Query parameters schema with type coercion
export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  unread: z.union([
    z.literal('true').transform(() => true),
    z.literal('false').transform(() => false),
    z.boolean()
  ]).optional().default(false),
  subscriptionId: z.string().uuid().optional().nullable()
});
```

### User Service

The user service manages user profiles and settings:

- Profile update validation with specific constraints
- Dedicated notification settings schema
- Response type validation

```javascript
// User profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['es', 'en', 'ca']).optional()
});

// Notification settings schemas
export const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  notificationEmail: z.string().email().nullable().optional(),
  emailFrequency: z.enum(['daily']).optional(),
  instantNotifications: z.boolean().optional()
});
```

## Benefits for Backend-Only Services

Extending Zod validation to backend-only services brings several advantages:

1. **Consistent validation** across all services, not just frontend-facing ones
2. **Type safety** for JavaScript services without TypeScript
3. **Self-documenting APIs** internally, making it easier for developers to understand expected inputs
4. **Runtime type checking** to prevent hard-to-debug issues in production
5. **Improved error reporting** with detailed validation feedback

This comprehensive validation approach ensures data integrity throughout the entire application ecosystem, not just at the frontend-backend boundary.