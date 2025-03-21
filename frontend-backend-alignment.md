# Frontend-Backend Alignment for NIFYA

This document outlines the alignment between frontend and backend components for the NIFYA application, with a focus on subscription-related functionality.

## Subscription Management

### Frontend Pages and Routes

| Page/Component | Route | Purpose |
|----------------|-------|---------|
| Dashboard | `/dashboard` | Overview of user activity and subscription stats |
| Subscriptions | `/subscriptions` | List and manage all user subscriptions |
| SubscriptionDetail | `/subscriptions/:id` | View detailed information about a specific subscription |
| NewSubscription | `/subscriptions/new` | Select template for a new subscription |
| SubscriptionCatalog | `/subscriptions/catalog` | Browse available subscription templates |
| SubscriptionPrompt | `/subscriptions/new/:typeId` | Configure subscription parameters based on template |
| EditSubscription | `/subscriptions/:id/edit` | Edit an existing subscription |

### Issues Identified

1. **Route Fragmentation**: Multiple routes lead to the same functionality, creating a confusing user journey.
2. **Component Duplication**: `SubscriptionPrompt` and `TemplateConfig` have similar functionality.
3. **Data Inconsistency**: Dashboard shows a different count than the subscriptions page.
4. **Missing Error Handling**: Some components lack proper error messages.

## API Endpoints Required by Frontend

### Subscription Management

| Endpoint | Method | Frontend Usage | Status |
|----------|--------|----------------|--------|
| `/api/v1/subscriptions` | GET | List user subscriptions | ✅ Implemented |
| `/api/v1/subscriptions` | POST | Create new subscription | ✅ Fixed |
| `/api/v1/subscriptions/:id` | GET | Get subscription details | ✅ Implemented |
| `/api/v1/subscriptions/:id` | PATCH | Update subscription | ✅ Implemented |
| `/api/v1/subscriptions/:id` | DELETE | Delete subscription | ✅ Implemented |
| `/api/v1/subscriptions/:id/toggle` | PATCH | Toggle subscription active status | ✅ Implemented |
| `/api/v1/subscriptions/:id/process` | POST | Process subscription immediately | ✅ Implemented |
| `/api/v1/subscriptions/stats` | GET | Get subscription statistics | ✅ Fixed |

### Template Management

| Endpoint | Method | Frontend Usage | Status |
|----------|--------|----------------|--------|
| `/api/v1/templates` | GET | List available templates | ✅ Implemented |
| `/api/v1/templates/:id` | GET | Get template details | ✅ Implemented |
| `/api/v1/templates/:id/subscribe` | POST | Create subscription from template | ✅ Implemented |

### Subscription Types

| Endpoint | Method | Frontend Usage | Status |
|----------|--------|----------------|--------|
| `/api/v1/subscriptions/types` | GET | List subscription types | ✅ Implemented |

## Data Model Alignment

### Frontend to Backend Data Mapping

#### Subscription Creation

| Frontend Field | Backend Field | Notes |
|----------------|--------------|-------|
| `type` | Maps to `type_id` via lookup | Fixed to handle different type formats |
| `typeId` | Used to lookup template info | Added fallback resolution logic |
| `name` | `name` | Direct mapping |
| `description` | `description` | Direct mapping |
| `prompts` | `prompts` | Direct mapping |
| `frequency` | `frequency` | Normalized to backend format |
| `logo` | `logo` | Direct mapping |

#### Subscription Response

| Backend Field | Frontend Field | Notes |
|--------------|----------------|-------|
| `id` | `id` | Direct mapping |
| `name` | `name` | Direct mapping |
| `description` | `description` | Direct mapping |
| `type_id` | Resolved to `type` | Added type name resolution |
| `prompts` | `prompts` | Direct mapping |
| `frequency` | `frequency` | Direct mapping |
| `logo` | `logo` | Direct mapping |
| `active` | `active` | Direct mapping |
| `created_at` | `createdAt` | Renamed for camelCase convention |
| `updated_at` | `updatedAt` | Renamed for camelCase convention |

## Fixes Implemented

### 1. Subscription Creation from Template
- Fixed issue with handling `type` vs `typeId` fields
- Implemented comprehensive type resolution with multiple fallbacks
- Added better error handling and logging
- Fixed issues with subscription type mapping

### 2. Subscription Statistics
- Replaced mock data with actual database statistics
- Fixed field name mismatch (`inactive` vs `pending`)
- Improved error handling

### 3. Subscription Listing
- Added pagination, sorting, and filtering support
- Enhanced response format to include pagination metadata
- Improved query performance with optimized database queries

### 4. Template-to-Subscription Flow
- Enhanced the template lookup process
- Added fallback logic for template type resolution
- Improved error messaging for template selection

## Recommended Frontend Improvements

1. **Consistent Routes**: Consolidate the subscription creation flow to a single path
2. **Unified Components**: Merge `SubscriptionPrompt` and `TemplateConfig` functionality
3. **Error Handling**: Add consistent error handling across all subscription-related pages
4. **Loading States**: Implement consistent loading indicators
5. **Pagination Controls**: Add UI for pagination in subscription listing

## Recommended Backend Improvements

1. **Input Validation**: Implement Zod for robust validation
2. **Soft Delete**: Add soft delete functionality for subscriptions
3. **Rate Limiting**: Add rate limiting for subscription processing
4. **Caching**: Implement caching for subscription types and templates
5. **Database Optimization**: Add indexes for common query patterns

## Database Access Patterns

| Endpoint | Database Tables Accessed | Access Pattern |
|----------|--------------------------|----------------|
| GET `/api/v1/subscriptions` | `subscriptions`, `subscription_types` | Read with filtering, pagination |
| POST `/api/v1/subscriptions` | `subscriptions`, `subscription_types`, `subscription_templates` | Read (type lookup), Write (create) |
| GET `/api/v1/subscriptions/:id` | `subscriptions`, `subscription_types` | Read with JOIN |
| PATCH `/api/v1/subscriptions/:id` | `subscriptions` | Read (validation), Write (update) |
| DELETE `/api/v1/subscriptions/:id` | `subscriptions` | Read (validation), Write (delete) |
| PATCH `/api/v1/subscriptions/:id/toggle` | `subscriptions` | Read (validation), Write (update) |
| POST `/api/v1/subscriptions/:id/process` | `subscriptions`, `subscription_processing` | Read (validation), Write (create processing record) |
| GET `/api/v1/subscriptions/stats` | `subscriptions`, `subscription_types` | Aggregation queries |
| GET `/api/v1/templates` | `subscription_templates` | Read with filtering |
| GET `/api/v1/templates/:id` | `subscription_templates` | Read by ID |
| POST `/api/v1/templates/:id/subscribe` | `subscription_templates`, `subscriptions`, `subscription_types` | Read (template), Write (subscription) |
| GET `/api/v1/subscriptions/types` | `subscription_types` | Read |

## Testing Notes

When testing the application:

1. Create subscriptions from different templates and verify they appear in the subscriptions list
2. Check subscription counts on dashboard match the actual number in the subscriptions list
3. Test pagination by creating 20+ subscriptions and verifying pagination controls work
4. Verify error messages appear correctly when invalid data is submitted
5. Test that subscription processing triggers notifications correctly
6. Verify that statistics update when subscriptions are created, toggled, or deleted