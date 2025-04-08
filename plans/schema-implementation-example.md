# Shared Schema Implementation Example

## Shared Schema Directory Structure

```
shared/
  schemas/
    index.ts                # Main export file
    base.ts                 # Base shared types and utilities
    subscription/
      index.ts              # Subscription schema exports
      base.schema.ts        # Base subscription schema
      create.schema.ts      # Creation schema
      update.schema.ts      # Update schema
      response.schema.ts    # Response schema
      adapters.ts           # Legacy format adapters
    user/
      index.ts              # User schema exports
      profile.schema.ts     # User profile schema
      preferences.schema.ts # User preferences schema
    notification/
      index.ts              # Notification schema exports
      ...
    error/
      index.ts              # Error schema exports
      error.schema.ts       # Standard error schema
```

## Sample Implementation of Main Index Files

### `shared/schemas/index.ts`

```typescript
/**
 * Main export file for all shared schemas
 */

// Export subscription schemas
export * from './subscription';

// Export user schemas
export * from './user';

// Export notification schemas
export * from './notification';

// Export error schemas
export * from './error';

// Export base types and utilities
export * from './base';
```

### `shared/schemas/subscription/index.ts`

```typescript
/**
 * Subscription schema exports
 */

// Export base schemas
export * from './base.schema';

// Export create schemas
export * from './create.schema';

// Export update schemas
export * from './update.schema';

// Export response schemas
export * from './response.schema';

// Export adapters
export * from './adapters';
```

### `shared/schemas/base.ts`

```typescript
/**
 * Base shared types and utilities
 */
import { z } from 'zod';

// Common validation patterns
export const UuidSchema = z.string().uuid('Invalid UUID format');
export type UuidType = z.infer<typeof UuidSchema>;

export const EmailSchema = z.string().email('Invalid email format');
export type EmailType = z.infer<typeof EmailSchema>;

export const ISO8601DateSchema = z.string().datetime('Invalid date format');
export type ISO8601DateType = z.infer<typeof ISO8601DateSchema>;

// Common response status
export const ResponseStatus = z.enum(['success', 'error']);
export type ResponseStatusType = z.infer<typeof ResponseStatus>;

// Base success response
export const BaseSuccessResponseSchema = z.object({
  status: z.literal('success'),
});
export type BaseSuccessResponse = z.infer<typeof BaseSuccessResponseSchema>;

// Base error response
export const BaseErrorResponseSchema = z.object({
  status: z.literal('error'),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type BaseErrorResponse = z.infer<typeof BaseErrorResponseSchema>;

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// Helper for creating paginated responses
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    status: z.literal('success'),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationSchema,
    }),
  });
}
```

## Using Shared Schemas in Backend and Frontend

### Backend Example

```javascript
// backend/src/interfaces/http/routes/subscription/crud.routes.js
import { 
  CreateSubscriptionSchema, 
  adaptLegacyCreateRequest 
} from '../../../../../shared/schemas';

// In the route handler
const adaptedData = adaptLegacyCreateRequest(req.body);
const validationResult = CreateSubscriptionSchema.safeParse(adaptedData);

if (!validationResult.success) {
  // Handle validation error with details from Zod
  const formattedErrors = validationResult.error.format();
  throw new AppError('VALIDATION_ERROR', 'Invalid data', 400, { details: formattedErrors });
}

// Use validated data
const validData = validationResult.data;
```

### Frontend Example

```typescript
// frontend/src/lib/api/services/subscriptions.ts
import { 
  CreateSubscriptionSchema, 
  CreateSubscription,
  SubscriptionCreateUpdateResponse 
} from '../../../../shared/schemas';

// In the API client
create: (data: CreateSubscription): Promise<ApiResponse<SubscriptionCreateUpdateResponse>> => {
  // Validate with shared schema
  const validationResult = CreateSubscriptionSchema.safeParse(data);
  
  if (!validationResult.success) {
    // Handle validation error client-side
    return Promise.resolve({
      status: 400,
      ok: false,
      error: 'Validation failed',
      data: { 
        validationErrors: validationResult.error.format(),
        message: 'Please correct the errors and try again'
      } as any
    });
  }
  
  // Send validated data to backend
  return backendClient<SubscriptionCreateUpdateResponse>({
    endpoint: '/api/v1/subscriptions',
    method: 'POST',
    body: validationResult.data,
  });
}
```

## Benefits of This Approach

1. **Single Source of Truth**: Schema definitions are defined once and shared between frontend and backend
2. **Type Safety**: TypeScript provides type checking for all schema usage
3. **Runtime Validation**: Zod provides runtime validation with detailed error messages
4. **Code Reuse**: Adapter functions are used in both environments
5. **Simplified Maintenance**: Changes to schemas only need to be made in one place
6. **Better Documentation**: Schema definitions serve as living documentation
7. **Consistent Error Handling**: Standardized error responses based on shared schemas 