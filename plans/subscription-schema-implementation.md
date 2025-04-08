# Subscription Endpoints Standardization Plan

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

### Step 1: Create Shared Subscription Schemas

Create the following files in the new shared schema directory:

#### File: `shared/schemas/subscription/base.schema.ts`

```typescript
import { z } from 'zod';

// Common enums for subscriptions
export const SubscriptionFrequency = z.enum(['immediate', 'daily']);
export type SubscriptionFrequencyType = z.infer<typeof SubscriptionFrequency>;

export const SubscriptionType = z.enum(['boe', 'real-estate', 'custom']);
export type SubscriptionTypeType = z.infer<typeof SubscriptionType>;

// Base subscription schema (fields common to all operations)
export const BaseSubscriptionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  type: SubscriptionType,
  frequency: SubscriptionFrequency,
});
export type BaseSubscription = z.infer<typeof BaseSubscriptionSchema>;

// Prompts validation (array with 1-3 strings)
export const PromptsSchema = z.array(z.string())
  .min(1, 'At least one prompt is required')
  .max(3, 'Maximum 3 prompts allowed');
export type Prompts = z.infer<typeof PromptsSchema>;
```

#### File: `shared/schemas/subscription/create.schema.ts`

```typescript
import { z } from 'zod';
import { BaseSubscriptionSchema, PromptsSchema } from './base.schema';

// Schema for creating a subscription
export const CreateSubscriptionSchema = BaseSubscriptionSchema.extend({
  prompts: PromptsSchema,
  metadata: z.record(z.any()).optional(),
});
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;

// Request schema
export const CreateSubscriptionRequestSchema = CreateSubscriptionSchema;
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;
```

#### File: `shared/schemas/subscription/update.schema.ts`

```typescript
import { z } from 'zod';
import { BaseSubscriptionSchema, PromptsSchema } from './base.schema';

// Schema for updating a subscription
export const UpdateSubscriptionSchema = BaseSubscriptionSchema
  .partial() // All fields are optional for updates
  .extend({
    prompts: PromptsSchema.optional(),
    active: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  });
export type UpdateSubscription = z.infer<typeof UpdateSubscriptionSchema>;

// Request schema
export const UpdateSubscriptionRequestSchema = UpdateSubscriptionSchema;
export type UpdateSubscriptionRequest = z.infer<typeof UpdateSubscriptionRequestSchema>;
```

#### File: `shared/schemas/subscription/response.schema.ts`

```typescript
import { z } from 'zod';
import { BaseSubscriptionSchema, PromptsSchema } from './base.schema';

// Schema for subscription data in responses
export const SubscriptionResponseSchema = BaseSubscriptionSchema.extend({
  id: z.string().uuid('Invalid subscription ID format'),
  prompts: PromptsSchema,
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  typeName: z.string(),
  userId: z.string().uuid('Invalid user ID format'),
});
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

// List response
export const SubscriptionListResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    subscriptions: z.array(SubscriptionResponseSchema),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  }),
});
export type SubscriptionListResponse = z.infer<typeof SubscriptionListResponseSchema>;

// Get single subscription response
export const SubscriptionGetResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    subscription: SubscriptionResponseSchema,
  }),
});
export type SubscriptionGetResponse = z.infer<typeof SubscriptionGetResponseSchema>;

// Create/Update subscription response
export const SubscriptionCreateUpdateResponseSchema = SubscriptionGetResponseSchema;
export type SubscriptionCreateUpdateResponse = z.infer<typeof SubscriptionCreateUpdateResponseSchema>;

// Delete subscription response
export const SubscriptionDeleteResponseSchema = z.object({
  status: z.literal('success'),
  message: z.string(),
  details: z.object({
    id: z.string().uuid(),
    alreadyRemoved: z.boolean().optional(),
  }),
});
export type SubscriptionDeleteResponse = z.infer<typeof SubscriptionDeleteResponseSchema>;
```

### Step 2: Create Adapter Functions for Legacy Formats

#### File: `shared/schemas/subscription/adapters.ts`

```typescript
import { CreateSubscription, UpdateSubscription } from './index';

/**
 * Adapts legacy frontend request formats to the standardized format
 */
export function adaptLegacyCreateRequest(data: any): CreateSubscription {
  // Deep clone to avoid modifying original
  const adapted = { ...data };
  
  // Handle source -> type conversion
  if (!adapted.type && adapted.source) {
    adapted.type = adapted.source;
    delete adapted.source;
  }
  
  // Handle keywords -> prompts conversion
  if (!adapted.prompts && adapted.keywords) {
    adapted.prompts = Array.isArray(adapted.keywords) ? 
      adapted.keywords : [adapted.keywords];
    delete adapted.keywords;
  }
  
  // Handle prompts object format
  if (adapted.prompts && typeof adapted.prompts === 'object' && !Array.isArray(adapted.prompts)) {
    adapted.prompts = adapted.prompts.value ? [adapted.prompts.value] : [];
  }
  
  return adapted as CreateSubscription;
}

/**
 * Adapts legacy update request formats to the standardized format
 */
export function adaptLegacyUpdateRequest(data: any): UpdateSubscription {
  // Deep clone to avoid modifying original
  const adapted = { ...data };
  
  // Handle isActive -> active conversion
  if (adapted.isActive !== undefined && adapted.active === undefined) {
    adapted.active = adapted.isActive;
    delete adapted.isActive;
  }
  
  // Other conversions from adaptLegacyCreateRequest apply here too
  if (!adapted.type && adapted.source) {
    adapted.type = adapted.source;
    delete adapted.source;
  }
  
  if (!adapted.prompts && adapted.keywords) {
    adapted.prompts = Array.isArray(adapted.keywords) ? 
      adapted.keywords : [adapted.keywords];
    delete adapted.keywords;
  }
  
  if (adapted.prompts && typeof adapted.prompts === 'object' && !Array.isArray(adapted.prompts)) {
    adapted.prompts = adapted.prompts.value ? [adapted.prompts.value] : [];
  }
  
  return adapted as UpdateSubscription;
}
```

### Step 3: Update Backend Controllers

#### Update `backend/src/interfaces/http/routes/subscription/crud.routes.js`:

```javascript
// Import shared schemas
import { 
  CreateSubscriptionSchema, 
  UpdateSubscriptionSchema,
  adaptLegacyCreateRequest,
  adaptLegacyUpdateRequest
} from '../../../../../shared/schemas/subscription/index';

// Create subscription handler
fastify.post('/', {
  // Schema validation using shared schemas
  schema: {
    body: {
      // We'll keep Fastify's schema validation as a first pass
      // but we'll use Zod for more detailed validation
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string' },
        source: { type: 'string' }, // Allow for legacy support
        prompts: { 
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'object' },
            { type: 'string' }
          ]
        },
        keywords: { // Allow for legacy support 
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'string' }
          ]
        },
        frequency: { type: 'string' },
        metadata: { type: 'object' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              subscription: subscriptionSchema
            }
          }
        }
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
    
    // Adapt request to standard format
    const adaptedData = adaptLegacyCreateRequest(request.body);
    
    // Log if adaptation was necessary (to track legacy format usage)
    if (JSON.stringify(adaptedData) !== JSON.stringify(request.body)) {
      console.log('Legacy subscription format detected:', {
        originalKeys: Object.keys(request.body),
        adaptedKeys: Object.keys(adaptedData),
        userId: request.user.id,
        requestId: request.id
      });
    }
    
    // Validate with Zod schema
    const validationResult = CreateSubscriptionSchema.safeParse(adaptedData);
    
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
    // Error handling (will be updated in a separate step)
    // ...existing error handling code...
  }
});

// Similar changes for GET, PUT, and DELETE handlers...
```

### Step 4: Update Frontend API Clients

#### Update `frontend/src/lib/api/services/subscriptions.ts`:

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
} from '../../../../shared/schemas/subscription';
import { validateWithZod } from '../../utils/validation';
import { z } from 'zod';
import { UuidSchema } from '../schemas';

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
  
  // Similar updates for other methods...
};
```

### Step 5: Update Error Handling

#### Create `shared/schemas/error/error.schema.ts`:

```typescript
import { z } from 'zod';

// Standard error schema
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  request_id: z.string(),
  timestamp: z.string().datetime(),
  details: z.record(z.any()).optional(),
});
export type ErrorType = z.infer<typeof ErrorSchema>;

// Error response schema
export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  error: ErrorSchema,
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Validation error details schema
export const ValidationErrorDetailsSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.record(z.string(), z.any())])
);
export type ValidationErrorDetails = z.infer<typeof ValidationErrorDetailsSchema>;
```

### Step 6: Implement Conversion Utilities in Backend

#### Create `backend/src/shared/utils/schema-conversion.js`:

```javascript
/**
 * Utility for converting between different request formats
 * and logging usage of deprecated formats
 */
export function convertRequestFormat(originalData, targetSchema, context) {
  // First, check if any conversion is needed
  const needsConversion = detectLegacyFormat(originalData);
  
  // If no conversion needed, return original
  if (!needsConversion) {
    return {
      data: originalData,
      converted: false
    };
  }
  
  // Apply conversions
  const convertedData = applyFormatConversions(originalData);
  
  // Log usage of legacy format
  logLegacyFormatUsage(originalData, convertedData, context);
  
  return {
    data: convertedData,
    converted: true
  };
}

/**
 * Detect if request uses legacy format
 */
function detectLegacyFormat(data) {
  // Check for source instead of type
  if (data.source && !data.type) return true;
  
  // Check for keywords instead of prompts
  if (data.keywords && !data.prompts) return true;
  
  // Check for prompts object format
  if (data.prompts && typeof data.prompts === 'object' && !Array.isArray(data.prompts)) return true;
  
  // Check for isActive instead of active
  if (data.isActive !== undefined && data.active === undefined) return true;
  
  return false;
}

/**
 * Apply format conversions
 */
function applyFormatConversions(data) {
  // Clone to avoid modifying original
  const converted = { ...data };
  
  // source -> type
  if (converted.source && !converted.type) {
    converted.type = converted.source;
    delete converted.source;
  }
  
  // keywords -> prompts
  if (converted.keywords && !converted.prompts) {
    converted.prompts = Array.isArray(converted.keywords) ? 
      converted.keywords : [converted.keywords];
    delete converted.keywords;
  }
  
  // prompts object -> array
  if (converted.prompts && typeof converted.prompts === 'object' && !Array.isArray(converted.prompts)) {
    converted.prompts = converted.prompts.value ? [converted.prompts.value] : [];
  }
  
  // isActive -> active
  if (converted.isActive !== undefined && converted.active === undefined) {
    converted.active = converted.isActive;
    delete converted.isActive;
  }
  
  return converted;
}

/**
 * Log usage of legacy format
 */
function logLegacyFormatUsage(original, converted, context) {
  console.warn('Legacy format detected', {
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    userId: context.userId,
    originalKeys: Object.keys(original),
    convertedKeys: Object.keys(converted),
    timestamp: new Date().toISOString()
  });
}
```

## Testing Plan

### 1. Unit Tests for Schema Validation

#### File: `shared/schemas/subscription/__tests__/validation.test.ts`

```typescript
import { 
  CreateSubscriptionSchema, 
  UpdateSubscriptionSchema,
  adaptLegacyCreateRequest,
  adaptLegacyUpdateRequest
} from '../index';

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
  
  describe('Legacy Format Adapters', () => {
    test('adapts source to type', () => {
      const legacyData = {
        name: 'Test Subscription',
        source: 'boe',
        prompts: ['test prompt'],
        frequency: 'daily'
      };
      
      const adapted = adaptLegacyCreateRequest(legacyData);
      expect(adapted.type).toBe('boe');
      expect(adapted.source).toBeUndefined();
    });
    
    // More test cases...
  });
});
```

### 2. Integration Tests

#### File: `backend/tests/api/subscription-endpoints.test.js`

```javascript
describe('Subscription API Endpoints', () => {
  describe('POST /api/v1/subscriptions', () => {
    test('creates subscription with standard format', async () => {
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
    
    test('creates subscription with legacy format', async () => {
      const response = await request(app)
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .set('X-User-ID', userId)
        .send({
          name: 'Test Subscription',
          description: 'Test description',
          source: 'boe',
          keywords: ['test prompt'],
          frequency: 'daily'
        });
        
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.subscription).toBeDefined();
      
      // Verify conversion happened correctly
      expect(response.body.data.subscription.type).toBe('boe');
      expect(response.body.data.subscription.prompts).toEqual(['test prompt']);
    });
    
    // More test cases...
  });
});
```

## Migration Timeline

1. **Week 1**: Implement shared schemas and adapters
2. **Week 2**: Update backend controllers with format conversion
3. **Week 3**: Update frontend API clients
4. **Week 4**: Add comprehensive tests
5. **Week 5-8**: Monitor legacy format usage
6. **After 2 months**: Begin deprecation warnings
7. **After 3 months**: Remove legacy format support

## Success Metrics

- Zero schema validation errors in production for standard formats
- Decreasing usage of legacy formats over time
- Consistent error responses across all subscription endpoints
- 100% test coverage for schema validation
- Improved development experience with better type safety 