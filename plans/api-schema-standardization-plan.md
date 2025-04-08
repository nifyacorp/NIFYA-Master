# API Schema Standardization Implementation Plan

## Overview

This document outlines a plan to standardize schema definitions and API communication between the frontend and backend systems of the NIFYA application. The current implementation has several issues:

1. No shared schema definitions between frontend and backend
2. Multiple compatible formats for requests/responses
3. Inconsistent error response structures
4. Limited debugging capabilities
5. Lack of automated schema validation tests

## Goals

- Create shared schema definitions to ensure data consistency
- Standardize on one request/response format for each endpoint
- Implement consistent error handling
- Enhance logging and debugging
- Add schema validation tests for API endpoints

## Implementation Steps

### Phase 1: Setup Shared Schema Package (1-2 days)

1. **Create Shared Schema Package**
   - Create a new directory `shared/schemas` to house shared schema definitions
   - Use TypeScript for type safety and Zod for runtime validation
   - Implement initial schemas for core entities: Subscriptions, Users, Notifications

2. **Define Core Schemas**
   - Create base schema definitions:
     - `SubscriptionSchema.ts` - For subscription CRUD operations
     - `UserSchema.ts` - For user profile and preferences
     - `NotificationSchema.ts` - For notification operations
     - `ErrorSchema.ts` - For standardized error responses

3. **Add Build Configuration**
   - Configure TypeScript to generate type definitions
   - Add NPM scripts for building and validating schemas

### Phase 2: Standardize Backend API (2-3 days)

1. **Update Backend Validation**
   - Replace current backend schema definitions with shared schemas
   - Standardize on one format for each request/response
   - Update controllers to use shared schemas for validation
   - Implement graceful deprecation for legacy formats (warn but still accept)

2. **Standardize Error Responses**
   - Create utility function for generating consistent error responses
   - Update all endpoints to use standardized error response format
   - Ensure all errors include: code, message, details, requestId

3. **Add Enhanced Logging**
   - Implement request/response logging middleware
   - Log validation errors with detailed information
   - Create a debugging endpoint that shows received headers and payload

### Phase 3: Update Frontend API Clients (2-3 days)

1. **Refactor API Clients**
   - Update frontend API clients to use shared schemas
   - Implement consistent error handling across all clients
   - Add retry logic for transient errors

2. **Improve Error Handling**
   - Create central error handling service
   - Add better error visualization in UI
   - Implement user-friendly error messages

3. **Add Telemetry**
   - Implement API request/response tracking
   - Add performance monitoring for API calls
   - Create dashboard for API health

### Phase 4: Testing and Documentation (2-3 days)

1. **Implement Schema Validation Tests**
   - Create integration tests for all API endpoints
   - Validate request/response against schemas
   - Test error scenarios and response formats

2. **Update API Documentation**
   - Document standard request/response formats
   - Mark legacy formats as deprecated
   - Add examples for common operations

3. **Create Migration Guide**
   - Document changes for developers
   - Provide migration timeline for deprecated formats
   - Include code samples for updated API usage

## Detailed Implementation Specifications

### Shared Schema Structure

```
shared/
  schemas/
    base.ts                  # Base schema types
    subscription/
      create.schema.ts       # Creation schema
      update.schema.ts       # Update schema
      response.schema.ts     # Response schema
    user/
      profile.schema.ts      # User profile schema
      preferences.schema.ts  # User preferences schema
    notification/
      ...
    error/
      error.schema.ts        # Standard error schema
```

### Standard Format for Subscription Endpoints

#### Create Subscription

Request:
```typescript
{
  name: string;               // Required
  description?: string;       // Optional
  type: string;               // Required (boe, real-estate, etc.)
  prompts: string[];          // Required array of prompts
  frequency: 'immediate' | 'daily';  // Required
  metadata?: Record<string, any>;    // Optional
}
```

Response:
```typescript
{
  status: 'success';
  data: {
    subscription: {
      id: string;
      name: string;
      description: string;
      type: string;
      typeName: string;
      prompts: string[];
      frequency: string;
      active: boolean;
      created_at: string;
      updated_at: string;
    }
  }
}
```

#### Standardized Error Response

```typescript
{
  status: 'error';
  error: {
    code: string;           // Error code (e.g., VALIDATION_ERROR)
    message: string;        // Human-readable message
    request_id: string;     // Request ID for tracking
    timestamp: string;      // ISO timestamp
    details?: Record<string, any>;  // Optional error details
  }
}
```

## Migration Strategy

1. **Gradual Migration**
   - Implement shared schemas first
   - Update backend with dual support (new + legacy)
   - Update frontend to use new schemas only
   - Add deprecation warnings for legacy formats
   - Set timeline for removing legacy support

2. **Backward Compatibility**
   - Maintain support for legacy formats initially
   - Log usage of deprecated formats
   - Add version header to track client versions
   - Implement conversion between formats when needed

3. **Communication Plan**
   - Update documentation with new standards
   - Notify developers of changes
   - Provide migration examples
   - Schedule removal of legacy support

## Testing Strategy

1. **Unit Tests**
   - Test schema validation logic
   - Ensure correct conversion between formats
   - Validate error handling

2. **Integration Tests**
   - Test API endpoints with standard formats
   - Verify error responses
   - Test backward compatibility

3. **End-to-End Tests**
   - Test frontend components with new API
   - Verify user experience with error handling
   - Validate complete workflows

## Timeline and Milestones

| Milestone | Description | Timeline |
|-----------|-------------|----------|
| Setup Shared Schemas | Create initial schema structure | Day 1-2 |
| Backend Updates | Update validation and responses | Day 3-5 |
| Frontend Refactoring | Update API clients | Day 6-8 |
| Testing & Documentation | Create tests and update docs | Day 9-10 |
| Deprecation Warnings | Add warnings for legacy formats | Day 11 |
| Legacy Format Removal | Remove support for legacy formats | 30 days after completion |

## Risk Assessment and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking changes | High | Medium | Dual support period, thorough testing |
| Performance impact | Medium | Low | Optimize validation, benchmark critical paths |
| Developer adoption | Medium | Medium | Clear documentation, examples, support |
| Missed edge cases | High | Medium | Comprehensive testing, gradual rollout |

## Success Criteria

1. All API endpoints use standardized schemas
2. Error handling is consistent across all endpoints
3. Frontend and backend validation is aligned
4. Automated tests verify schema compliance
5. API documentation is updated with new formats
6. API-related bugs are reduced by 50%

## Next Steps

Upon approval of this plan:
1. Create the shared schema package structure
2. Implement core entity schemas
3. Update backend validation logic
4. Begin frontend refactoring 