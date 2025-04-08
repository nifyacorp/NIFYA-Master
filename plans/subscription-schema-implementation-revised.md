# Subscription Endpoints Standardization Plan (Revised)

## Current Issues

1. **Multiple Input Formats:**
   - Standard: `{ name, type, prompts }`
   - Alternative 1: `{ name, source, keywords }`
   - Alternative 2: `{ name, type, prompts: { value } }`

2. **Inconsistent Field Names:**
   - `type` vs `source`
   - `prompts` vs `keywords`
   - `active` vs `isActive`

3. **Schema Duplication:**
   - Frontend and backend maintain separate Zod schemas
   - No shared type definitions

4. **Inconsistent Error Handling:**
   - Different error formats across endpoints
   - Inadequate validation error details

## Implementation Plan

### Step 1: Create Subscription Schemas in Both Microservices

Create identical schema files in both frontend and backend to maintain microservice independence while ensuring consistent data structures:

#### Frontend Schemas (TypeScript)
Located in `frontend/src/lib/schemas/subscription/`:
- `base.schema.ts`: Common types, enums, and base schemas
- `create.schema.ts`: Creation request schemas
- `update.schema.ts`: Update request schemas
- `response.schema.ts`: Response schemas for all endpoints
- `index.ts`: Exports all schemas

#### Backend Schemas (JavaScript)
Located in `backend/src/schemas/subscription/`:
- `base.schema.js`: Common types, enums, and base schemas
- `create.schema.js`: Creation request schemas
- `update.schema.js`: Update request schemas
- `response.schema.js`: Response schemas for all endpoints
- `index.js`: Exports all schemas

### Step 2: Update Backend Controllers

Update backend controllers to use the standardized schemas:

```javascript
// Import schemas
const { 
  CreateSubscriptionSchema, 
  UpdateSubscriptionSchema,
} = require('../../../schemas/subscription');

// Create subscription handler
fastify.post('/', {
  schema: {
    body: {
      // Basic Fastify schema for quick validation
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string' },
        prompts: { type: 'array', items: { type: 'string' } },
        frequency: { type: 'string' },
        metadata: { type: 'object' }
      }
    }
  }
}, async (request, reply) => {
  const context = {
    requestId: request.id,
    path: request.url,
    method: request.method
  };

  try {
    if (!request.user?.id) {
      throw new AppError('UNAUTHORIZED', 'No user ID available', 401);
    }
    
    // Validate with Zod schema
    const validationResult = CreateSubscriptionSchema.safeParse(request.body);
    
    if (!validationResult.success) {
      // Extract error details for better error messages
      const errors = validationResult.error.format();
      
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid subscription data',
        400,
        { validationErrors: errors }
      );
    }
    
    // Add user ID to validated data
    const subscriptionData = {
      ...validationResult.data,
      userId: request.user.id
    };
    
    // Process the request using service
    const result = await subscriptionService.createSubscription(
      subscriptionData,
      context
    );
    
    return {
      status: 'success',
      data: {
        subscription: result
      }
    };
  } catch (error) {
    // Error handling
    reply.code(error.statusCode || 500);
    return {
      status: 'error',
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error.details || {}
      }
    };
  }
});

// Similar changes for GET, PUT, and DELETE handlers
```

### Step 3: Update Frontend API Clients

Update frontend API clients to use the standardized schemas:

```typescript
import { backendClient } from '../clients/backend';
import type { ApiResponse } from '../types';
import { 
  CreateSubscriptionSchema, 
  UpdateSubscriptionSchema,
  SubscriptionListResponse,
  SubscriptionGetResponse,
  SubscriptionCreateUpdateResponse,
  SubscriptionDeleteResponse,
  CreateSubscription,
  UpdateSubscription
} from '../../schemas/subscription';
import { validateWithZod } from '../../utils/validation';

export const subscriptionService = {
  list: (): Promise<ApiResponse<SubscriptionListResponse>> => {
    console.group('📋 Subscription List Request');
    console.log('Fetching subscriptions...');
    
    return backendClient<SubscriptionListResponse>({
      endpoint: '/api/v1/subscriptions'
    }).finally(() => console.groupEnd());
  },
  
  create: (data: CreateSubscription): Promise<ApiResponse<SubscriptionCreateUpdateResponse>> => {
    console.group('📝 Create Subscription');
    console.log('Creating subscription:', data);
    
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
    console.log('Validation passed, sending to backend');
    
    return backendClient<SubscriptionCreateUpdateResponse>({
      endpoint: '/api/v1/subscriptions',
      method: 'POST',
      body: validation.data,
    }).finally(() => console.groupEnd());
  },
  
  // Similar updates for other methods
};
```

### Step 4: Update Error Handling

Create standardized error handling in both frontend and backend:

#### Backend Error Handling:

```javascript
// Standardized API error handler
function handleApiError(error, request, reply) {
  const errorResponse = {
    status: 'error',
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      request_id: request.id,
      timestamp: new Date().toISOString(),
      details: error.details || {}
    }
  };
  
  // Log error details
  request.log.error({
    error: errorResponse,
    stack: error.stack,
    url: request.url,
    method: request.method,
    userId: request.user?.id
  });
  
  reply.code(error.statusCode || 500).send(errorResponse);
}

// Use in routes
fastify.setErrorHandler(handleApiError);
```

## Testing Plan

### 1. Unit Tests for Schema Validation

Create unit tests to validate schema behavior:

```javascript
describe('Subscription Schema Validation', () => {
  describe('CreateSubscriptionSchema', () => {
    test('validates valid data', () => {
      const validData = {
        name: 'Test Subscription',
        description: 'Test description',
        type: 'boe',
        prompts: ['test prompt'],
        frequency: 'daily'
      };
      
      const result = CreateSubscriptionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
    
    test('rejects missing required fields', () => {
      const invalidData = {
        name: 'Test Subscription'
      };
      
      const result = CreateSubscriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
    
    // More test cases...
  });
});
```

### 2. Integration Tests

Create integration tests for the API endpoints:

```javascript
describe('Subscription API Endpoints', () => {
  describe('POST /api/v1/subscriptions', () => {
    test('creates subscription with standardized format', async () => {
      const response = await request(app)
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .set('X-User-ID', userId)
        .send({
          name: 'Test Subscription',
          description: 'Test description',
          type: 'boe',
          prompts: ['test prompt'],
          frequency: 'daily'
        });
        
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.subscription).toBeDefined();
    });
    
    // More test cases...
  });
});
```

## Success Metrics

- Zero schema validation errors in production
- Consistent error responses across all subscription endpoints
- 100% test coverage for schema validation
- Improved development experience with better type safety 