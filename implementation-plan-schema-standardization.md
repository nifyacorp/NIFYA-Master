# Revised Implementation Plan: Completing API Schema Standardization

## Current State Analysis

The codebase already has a partially implemented schema standardization with:

1. **Existing TypeScript interfaces** in the frontend
2. **Partial standardization** with `{status: 'success', data: {...}}` pattern
3. **Complex normalization logic** to handle inconsistent implementations
4. **Multiple response formats** across different services

Instead of creating a new standard, this plan focuses on completing and enforcing the existing standard.

## Target Standard

Based on the code analysis **and the new Supabase schema** (see `backend/supabase/new_schema.sql`), the intended standard should be **generic enough to work for every entity**: subscriptions, subscription types, notifications, users, etc.

### Universal Response Envelope

```typescript
// Generic envelope (all endpoints MUST return this)
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;             // the payload (can be list or single item)
  pagination?: PaginationMeta; // present only for list endpoints
  filters?: Record<string, any>; // optional filter echo-back
  error?: ErrorData;   // present only when status = 'error'
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorData {
  code?: string;       // machine readable error code (optional)
  message: string;     // human readable description
  details?: any;       // optional extra information (stack, validation errors, etc.)
}
```

#### Guidelines
1. **`status` is mandatory** – `'success'` or `'error'` only.
2. **`data` is mandatory**. When an error occurs `data` **SHOULD** still be present (can be `null`).
3. **`pagination`** is present **only** on list endpoints.
4. **`filters`** is optional – echo back whatever filter parameters were applied.
5. **`error`** is required when `status === 'error'`.

### Entity-specific Payload Shapes

Using the DB schema as source-of-truth:

```typescript
// 1) Subscription Type (from table: subscription_types)
export interface SubscriptionType {
  id: string;            // PK
  name: string;
  displayName: string;   // `display_name`
  description?: string;
  icon?: string;         // lucide icon name
  parserUrl?: string;    // `parser_url`
  logoUrl?: string;      // `logo_url`
  isSystem: boolean;     // `is_system`
  metadata: Record<string, any>; // JSONB
  createdAt: string;
  updatedAt: string;
}

// 2) Subscription (table: subscriptions)
export interface Subscription {
  id: string;            // uuid PK
  name: string;
  description?: string;
  userId: string;        // `user_id`
  typeId: string;        // FK to subscription_types
  prompts: string[];     // stored as JSONB array
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>; // JSONB (keywords, regions, etc.)
}

// 3) Notification (table: notifications)
export interface Notification {
  id: string;
  userId: string;
  subscriptionId?: string;
  title: string;
  content?: string;
  sourceUrl?: string;
  read: boolean;
  readAt?: string;
  entityType: string;  // e.g. 'notification:generic'
  source?: string;     // e.g. 'boe'
  data: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  emailSent: boolean;
  emailSentAt?: string;
}
```

### Example Endpoints

| Endpoint                     | HTTP | Description                       | `data` payload shape                      |
|------------------------------|------|-----------------------------------|-------------------------------------------|
| `/api/v1/subscriptions`      | GET  | List subscriptions                | `{ subscriptions: Subscription[] }`       |
| `/api/v1/subscriptions/:id`  | GET  | Get single subscription           | `{ subscription: Subscription }`          |
| `/api/v1/subscription-types` | GET  | List subscription types           | `{ types: SubscriptionType[] }`           |
| `/api/v1/notifications`      | GET  | List notifications (paged)        | `{ notifications: Notification[] }`       |
| `/api/v1/notifications/:id`  | GET  | Get single notification           | `{ notification: Notification }`          |

All of the above still share the **same ApiResponse envelope**.

## Implementation Plan

### Phase 1: Documentation and Audit (2-3 days)

1. **Document the Current Standard**
   - Extract and document the intended API response format from existing interfaces
   - Define clear specifications for all API responses
   - Create a reference document for developers

2. **Audit API Services**
   - Identify all API endpoints and their current response formats
   - Categorize each endpoint as:
     - Compliant with the standard
     - Partially compliant
     - Non-compliant
   - Priority rank non-compliant endpoints based on usage

3. **Map Frontend Normalization Logic**
   - Identify all locations in the frontend where response normalization occurs
   - Document the expected response formats in each case
   - Create a mapping of services to their expected formats

### Phase 1.b: Extend Interface Library (1 day)

* **Create /packages/shared-types** workspace (or `frontend/src/types/shared`).
* Export the `ApiResponse` generic and each entity interface shown above.
* Configure **path alias** so backend (TypeScript) and frontend can import the same interfaces.
* Generate Zod schemas from these interfaces (can be manual or via `ts-to-zod`).

### Phase 2: Backend Standardization (3-4 days)

1. **Create Helper Utilities**
   - Implement or enhance response formatter utilities
   ```javascript
   // Response utility for consistent formatting
   function formatSuccessResponse(data, meta = {}) {
     return {
       status: 'success',
       data,
       ...meta
     };
   }

   function formatErrorResponse(error, message = null) {
     return {
       status: 'error',
       error: {
         message: message || error.message || 'An unexpected error occurred',
         ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
       }
     };
   }
   ```

2. **Update Non-Compliant Services**
   - Focus on the highest priority services first
   - Update each service to use the formatter utilities
   - Ensure all endpoints return the standardized format
   
3. **Create Migration Schedule**
   - Schedule updates to minimize disruption
   - Prioritize endpoints with the most frontend handling complexity

### Phase 3: Frontend Simplification (2-3 days)

1. **Update API Client**
   - Refactor API client to expect the standardized format
   - Add type annotations to enforce the standard format
   - Add optional runtime validation during development

2. **Simplify Service Layer**
   - Refactor each service to handle only the standardized format
   - Keep compatibility code temporarily with deprecation warnings
   - Update service implementation logic

3. **Remove Redundant Normalization**
   - Identify all normalization logic in components
   - Gradually remove complex normalization from components
   - Update components to expect standardized data

### Phase 4: Code Cleanup (1-2 days)

1. **Remove Deprecated Code**
   - Identify all deprecated format handling code
   - Remove redundant normalization in `useSubscriptions` hook
   - Simplify data extraction in `Subscriptions.tsx`
   - Delete no longer needed compatibility code

2. **Update Type Definitions**
   - Ensure all type definitions match the standardized format
   - Remove no longer needed type variations
   - Update documentation in type files

3. **Add Format Enforcement**
   - Add runtime validation during development
   - Add appropriate error messages for unexpected formats

### Phase 5: Testing and Verification (1-2 days)

1. **Test Each Endpoint**
   - Verify all endpoints return the standardized format
   - Create tests to validate response formats
   - Document any remaining inconsistencies

2. **Test Frontend Components**
   - Verify components properly handle the standardized format
   - Test with actual backend responses
   - Ensure no regressions in functionality

3. **Create Documentation**
   - Update API documentation to reflect the standardized format
   - Create a template for new API endpoints
   - Document the standard for future reference

## Migration Example

### Before (Backend): Non-standard format

```javascript
// Some endpoints return direct data
router.get('/api/v1/subscriptions', async (req, res) => {
  try {
    const subscriptions = await getSubscriptions(req.user.id);
    return res.json(subscriptions); // Returns direct array
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### After (Backend): Standardized format

```javascript
router.get('/api/v1/subscriptions', async (req, res) => {
  try {
    const subscriptions = await getSubscriptions(req.user.id);
    return res.json({
      status: 'success',
      data: {
        subscriptions,
        pagination: {
          total: subscriptions.length,
          page: 1,
          limit: 100,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: {
        message: error.message
      }
    });
  }
});
```

### Before (Frontend): Complex normalization

```typescript
// Complex data extraction in useSubscriptions hook
const getSubscriptionsArray = useCallback(() => {
  if (!data) return [];
  
  let subscriptions = [];
  
  // Handle different data formats
  if (data.subscriptions && Array.isArray(data.subscriptions)) {
    subscriptions = data.subscriptions;
  } else if (data.data) {
    if (Array.isArray(data.data)) {
      subscriptions = data.data;
    } else if (data.data.subscriptions && Array.isArray(data.data.subscriptions)) {
      subscriptions = data.data.subscriptions;
    }
  } else if (Array.isArray(data)) {
    subscriptions = data;
  } else if (data.status === 'success' && data.data?.subscriptions) {
    subscriptions = data.data.subscriptions;
  }
  
  return subscriptions;
}, [data]);
```

### After (Frontend): Simplified data access

```typescript
// Simplified data extraction with standard format
const getSubscriptionsArray = useCallback(() => {
  if (!data || !data.status) return [];
  
  if (data.status === 'success' && data.data?.subscriptions) {
    return data.data.subscriptions;
  }
  
  // Log unexpected format
  console.warn('Unexpected API response format:', data);
  return [];
}, [data]);
```

## Timeline

- Total estimated time: 7-12 days
- Critical path: Backend standardization → Frontend simplification → Code cleanup

## Success Criteria

1. All API endpoints follow the standardized format
2. All frontend code uses a simplified, consistent data access pattern
3. No redundant normalization logic exists in the codebase
4. Clear documentation of the API response format is available
5. Type safety is enforced throughout the application

## Benefits

1. **Reduced complexity** in frontend code
2. **Improved type safety** across the application
3. **Fewer bugs** related to data format inconsistencies
4. **Faster development** for new features
5. **Cleaner codebase** without redundant normalization logic 

## Additional Notes

1. **Supabase RLS** – Envelope does **not** change RBAC, only the JSON returned.
2. **Pagination** – List endpoints *must* include `pagination` metadata; single-record endpoints *must not*.
3. **Filters Echo** – Optional but useful for debugging; backend should echo validated filters.
4. **Versioning** – Consider a top-level `version` field inside `data` for future breaking changes.

## Revised Timeline

No change: 7-12 days total (the extra work is offset by reusing shared typing across entities).

## Expected Outcome

* One response envelope for **all** endpoints.
* Shared typings and schemas imported by both backend & frontend.
* Frontend code greatly simplified, no redundant normalization.
* Easier onboarding for new devs; fewer bugs related to data shapes. 