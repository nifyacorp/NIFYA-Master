# Subscription Schema Documentation

This document explains the standardized subscription schemas used in both the frontend and backend of the NIFYA application. These schemas ensure consistent data validation, improved type safety, and clear error messages across the entire application.

## Overview

The subscription schemas are implemented using Zod, a TypeScript-first schema validation library. The schemas are duplicated (with the same structure) in both the frontend and backend to maintain microservice independence while ensuring data consistency.

## Schema Locations

- **Frontend**: `frontend/src/lib/schemas/subscription/`
- **Backend**: `backend/src/schemas/subscription/`

## Schema Files

### 1. Base Schema (`base.schema.ts/js`)

Contains fundamental types and validation rules used by all other schemas:

```typescript
// Frontend (TypeScript)
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

```javascript
// Backend (JavaScript)
const { z } = require('zod');

// Common enums for subscriptions
const SubscriptionFrequency = z.enum(['immediate', 'daily']);

const SubscriptionType = z.enum(['boe', 'real-estate', 'custom']);

// Base subscription schema (fields common to all operations)
const BaseSubscriptionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  type: SubscriptionType,
  frequency: SubscriptionFrequency,
});

// Prompts validation (array with 1-3 strings)
const PromptsSchema = z.array(z.string())
  .min(1, 'At least one prompt is required')
  .max(3, 'Maximum 3 prompts allowed');

module.exports = {
  SubscriptionFrequency,
  SubscriptionType,
  BaseSubscriptionSchema,
  PromptsSchema
};
```

### 2. Create Schema (`create.schema.ts/js`)

Defines validation rules for creating new subscriptions:

```typescript
// Frontend (TypeScript)
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

```javascript
// Backend (JavaScript)
const { z } = require('zod');
const { BaseSubscriptionSchema, PromptsSchema } = require('./base.schema');

// Schema for creating a subscription
const CreateSubscriptionSchema = BaseSubscriptionSchema.extend({
  prompts: PromptsSchema,
  metadata: z.record(z.any()).optional(),
});

// Request schema
const CreateSubscriptionRequestSchema = CreateSubscriptionSchema;

module.exports = {
  CreateSubscriptionSchema,
  CreateSubscriptionRequestSchema
};
```

### 3. Update Schema (`update.schema.ts/js`)

Defines validation rules for updating existing subscriptions:

```typescript
// Frontend (TypeScript)
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

```javascript
// Backend (JavaScript)
const { z } = require('zod');
const { BaseSubscriptionSchema, PromptsSchema } = require('./base.schema');

// Schema for updating a subscription
const UpdateSubscriptionSchema = BaseSubscriptionSchema
  .partial() // All fields are optional for updates
  .extend({
    prompts: PromptsSchema.optional(),
    active: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  });

// Request schema
const UpdateSubscriptionRequestSchema = UpdateSubscriptionSchema;

module.exports = {
  UpdateSubscriptionSchema,
  UpdateSubscriptionRequestSchema
};
```

### 4. Response Schema (`response.schema.ts/js`)

Defines structures for API responses:

```typescript
// Frontend (TypeScript)
import { z } from 'zod';
import { BaseSubscriptionSchema, PromptsSchema } from './base.schema';

// Schema for subscription data in responses
export const SubscriptionResponseSchema = BaseSubscriptionSchema.extend({
  id: z.string().uuid('Invalid subscription ID format'),
  prompts: PromptsSchema,
  active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
    }).optional(),
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

```javascript
// Backend (JavaScript) - Similar structure but uses module.exports
```

### 5. Index File (`index.ts/js`)

Exports all schemas for easier imports:

```typescript
// Frontend (TypeScript)
// Export all subscription schemas
export * from './base.schema';
export * from './create.schema';
export * from './update.schema';
export * from './response.schema';
```

```javascript
// Backend (JavaScript)
// Export all subscription schemas
const baseSchemas = require('./base.schema');
const createSchemas = require('./create.schema');
const updateSchemas = require('./update.schema');
const responseSchemas = require('./response.schema');

module.exports = {
  ...baseSchemas,
  ...createSchemas,
  ...updateSchemas,
  ...responseSchemas
};
```

## Usage Examples

### Frontend Usage

#### Validating Form Input

```typescript
import { validateWithZod } from '../../utils/validation';
import { CreateSubscriptionSchema } from '../../schemas/subscription';

// In a component or form handler
const handleSubmit = (formData) => {
  // Validate against schema
  const validation = validateWithZod(CreateSubscriptionSchema, formData);
  
  if (!validation.success) {
    // Handle validation errors
    console.error('Validation failed:', validation.error);
    return;
  }
  
  // Proceed with valid data
  const validData = validation.data;
  // Send to API...
};
```

#### Type-Safe API Calls

```typescript
import { 
  CreateSubscription,
  SubscriptionCreateUpdateResponse
} from '../../schemas/subscription';
import type { ApiResponse } from '../types';

// Type-safe API function
const createSubscription = (data: CreateSubscription): Promise<ApiResponse<SubscriptionCreateUpdateResponse>> => {
  return backendClient({
    endpoint: '/api/v1/subscriptions',
    method: 'POST',
    body: data,
  });
};
```

### Backend Usage

#### Route Handler Validation

```javascript
// Import schemas
const { CreateSubscriptionSchema } = require('../../../schemas/subscription');

// In a route handler
app.post('/api/v1/subscriptions', async (request, reply) => {
  try {
    // Validate request body
    const validationResult = CreateSubscriptionSchema.safeParse(request.body);
    
    if (!validationResult.success) {
      // Extract error details
      const errors = validationResult.error.format();
      
      return reply.code(400).send({
        status: 'error',
        message: 'Invalid subscription data',
        details: { validationErrors: errors }
      });
    }
    
    // Proceed with valid data
    const validData = validationResult.data;
    // Process the request...
  } catch (error) {
    // Handle other errors...
  }
});
```

## Field Definitions

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | String | Subscription name | 3-100 characters |
| `description` | String | Optional description | Up to 500 characters |
| `type` | Enum | Subscription type | 'boe', 'real-estate', 'custom' |
| `prompts` | Array | Search terms/instructions | 1-3 strings |
| `frequency` | Enum | Processing frequency | 'immediate', 'daily' |
| `active` | Boolean | Whether subscription is active | - |
| `metadata` | Object | Additional data | Optional |

## Benefits

1. **Consistent Validation**: The same validation rules are applied in both frontend and backend
2. **Better Error Messages**: Zod provides detailed error messages for each validation failure
3. **Type Safety**: TypeScript types are automatically inferred from the schemas
4. **Microservice Independence**: Each service maintains its own schema copies while ensuring consistency

## Best Practices

1. **Keep Schemas in Sync**: When making changes, update both frontend and backend schemas to ensure consistency
2. **Use Types in API Calls**: Leverage the types exported by the schemas for type-safe API interactions
3. **Extend Base Schemas**: When creating new features, extend the base schemas to maintain consistency
4. **Validate Early**: Validate data as early as possible to provide immediate feedback to users 