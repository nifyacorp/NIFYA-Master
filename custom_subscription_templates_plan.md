# Custom Subscription Templates Implementation Plan - Minimal Version

## Overview
This plan outlines the minimal viable implementation to allow users to create their own custom subscription templates using the existing `subscription_types` table. Each user will be limited to creating a maximum of 2 custom subscription templates.

## 1. Database Modifications

### Update `subscription_types` Table
Add the following fields to the existing table:
- `user_id` (UUID, nullable) - References the user who created the template (null for system templates)
- `is_custom` (boolean, default false) - Distinguishes between system templates and user-created ones

Any additional template-specific data can be stored in the existing `metadata` JSON column.

## 2. API Endpoint Modifications

### Enhanced Endpoints
- `GET /subscriptions/types`
  - Return both system and user-created templates
  - Add optional filter parameter to show only system templates if needed
  
- `POST /subscriptions/types`
  - Enable user creation of templates
  - Validate input data (URL format, required fields)
  - Enforce limit of 2 custom templates per user
  - Store additional configuration in metadata field
  
- `GET /subscriptions/types/:id`
  - Return template details regardless of creator
  
- `PUT /subscriptions/types/:id`
  - Add permission check (creator only)
  
- `DELETE /subscriptions/types/:id`
  - Add permission check (creator only)

## 3. Backend Implementation

### User Limit Enforcement
- Create middleware or service to check user's current template count
- Return appropriate error when limit reached
- Consider adding a user setting to control this limit for future flexibility

### Validation Service
- Basic template name uniqueness check
- Simple URL validation (format checking only)
- Required fields validation

### Parser Integration
- Ensure parser can handle custom template URLs
- Use standardized metadata format for parser configuration

## 4. User Interface Updates

### Template Creation UI
- Add "Create Custom Template" button in subscription management
- Create form with fields:
  - Template name
  - Description (visible to other users)
  - Target URL (address for the parser to check)
  - Any additional parameters needed by the parser (stored in metadata)
- Display remaining template allowance (e.g., "You can create 1 more custom template")

### Template Management
- Add "My Templates" section showing user's custom templates
- Allow editing/deleting own templates
- Show clear indication of the 2-template limit

### Template Discovery
- Show all templates (both system and user-created) in subscription selection
- No differentiation needed in the UI between system and user templates 