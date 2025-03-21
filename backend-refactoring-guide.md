# Backend Refactoring Guide

This guide provides detailed recommendations for refactoring the backend code to address the issues identified in the code audit. The examples provided should serve as a reference for implementing these changes.

## 1. Route Structure Consolidation

### Current Issue
The subscription routes are defined in multiple files with duplicated endpoints:
- `/backend/src/interfaces/http/routes/subscription.routes.js` (main file)
- `/backend/src/interfaces/http/routes/subscription/*.routes.js` (modular files)

### Solution
We've already updated `subscription.routes.js` to be a wrapper that imports the modular route files:

```javascript
/**
 * Subscription Routes - Main Entry Point
 */
import { registerTypeRoutes } from './subscription/types.routes.js';
import { registerCrudRoutes } from './subscription/crud.routes.js';
import { registerProcessRoutes } from './subscription/process.routes.js';
import { registerSharingRoutes } from './subscription/sharing.routes.js';

export async function subscriptionRoutes(fastify, options) {
  // Register all modular route groups
  await registerTypeRoutes(fastify, options);
  await registerCrudRoutes(fastify, options);
  await registerProcessRoutes(fastify, options);
  await registerSharingRoutes(fastify, options);
  
  // Add API Explorer metadata
  // ...
}
```

## 2. Standardized Error Handling

### Current Issue
Error handling is inconsistent across routes, mixing direct AppError usage with various response formats.

### Solution
We've updated the `process.routes.js` file to use the ErrorResponseBuilder consistently:

```javascript
try {
  // Route logic...
} catch (error) {
  logError(requestContext, error);
  
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send(
      buildErrorResponse(request, {
        code: error.code,
        message: error.message,
        status: error.statusCode,
        details: error.details || {}
      })
    );
  }
  
  return reply.code(500).send(
    errorBuilders.serverError(request, error)
  );
}
```

This pattern should be applied to ALL route handlers for consistency.

## 3. Service Layer Refactoring

### Current Issue
The subscription service has duplicated logic for validation, creation, and updates.

### Proposed Solution
Create utility methods for common operations:

```javascript
/**
 * Validates subscription data and prepares it for creation
 * @private
 */
async _validateAndPrepareSubscription(userId, subscriptionData, context) {
  // Validation logic...
  
  // Return the prepared subscription object
  return {
    ...defaults,
    ...subscriptionData,
    user_id: userId,
    created_at: new Date(),
    updated_at: new Date()
  };
}

/**
 * Create a new subscription
 */
async createSubscription(userId, subscriptionData, context) {
  logRequest(context, 'Creating new subscription', { userId, subscriptionData });
  
  try {
    const subscription = await this._validateAndPrepareSubscription(userId, subscriptionData, context);
    
    // Database operations...
  } catch (error) {
    // Error handling...
  }
}

/**
 * Create a subscription from a template
 */
async createSubscriptionFromTemplate(userId, templateId, customizations, context) {
  logRequest(context, 'Creating subscription from template', { userId, templateId });
  
  try {
    // Get template...
    
    // Prepare subscription data
    const subscriptionData = {
      name: template.name,
      type_id: template.type_id,
      // Other properties...
      ...customizations  // Apply any user customizations
    };
    
    const subscription = await this._validateAndPrepareSubscription(userId, subscriptionData, context);
    
    // Database operations...
  } catch (error) {
    // Error handling...
  }
}
```

## 4. Repository Pattern Implementation

### Current Issue
Some services bypass the repository pattern and directly access the database.

### Proposed Solution
Create repository methods for all database operations:

```javascript
// In subscription.repository.js
async getSubscriptionById(userId, subscriptionId) {
  const result = await query(
    'SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2',
    [subscriptionId, userId]
  );
  return result.rows[0];
}

// In subscription.service.js
async getSubscriptionById(userId, subscriptionId, context) {
  try {
    // Use the repository method
    const subscription = await subscriptionRepository.getSubscriptionById(userId, subscriptionId);
    
    if (!subscription) {
      throw new AppError(
        SUBSCRIPTION_ERRORS.NOT_FOUND.code,
        'Subscription not found',
        404
      );
    }
    
    return subscription;
  } catch (error) {
    // Error handling...
  }
}
```

## 5. Validation Standardization

### Current Issue
Multiple validation approaches are used throughout the codebase.

### Proposed Solution
Adopt schema validation with Joi or Zod for all validation:

```javascript
// In subscription.schema.js
import Joi from 'joi';

export const createSubscriptionSchema = Joi.object({
  name: Joi.string().required(),
  type_id: Joi.string().uuid().required(),
  description: Joi.string().allow('').default(''),
  // Other fields...
});

// In subscription.service.js
async createSubscription(userId, subscriptionData, context) {
  // Validate against schema
  const { error, value } = createSubscriptionSchema.validate(subscriptionData);
  
  if (error) {
    throw new AppError(
      SUBSCRIPTION_ERRORS.VALIDATION_ERROR.code,
      error.message,
      400
    );
  }
  
  // Proceed with validated data...
}
```

## Implementation Strategy

1. Start with route consolidation (already done)
2. Standardize error handling across all routes
3. Refactor the service layer to use utility methods
4. Implement the repository pattern consistently
5. Standardize validation approaches

Each change should be implemented incrementally and tested thoroughly to ensure functionality is preserved.