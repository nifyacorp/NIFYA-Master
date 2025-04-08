# Subscription Type System Enhancement

This document describes the changes made to support dynamic parser resolution in the NIFYA subscription system.

## Overview

The subscription system has been enhanced to dynamically retrieve parser information from the `subscription_types` table. This allows different parsers to be used based on subscription type without hardcoding parser URLs.

## Changes Made

### 1. Database Changes

Added new columns to the `subscription_types` table:
- `parser_url`: URL to the parser service
- Description and logo_url columns, if they didn't already exist

Migration file created:
- `backend/supabase/migrations/20250409000000_add_parser_url_to_types.sql`

### 2. Subscription Worker Changes

#### `SubscriptionRepository.js`
- Updated the `findById` method to join with `subscription_types` table
- Included parser_url, type_description, type_logo_url in the query results

#### `ParserClient.js`
- Added `updateBaseURL` method to allow changing the parser URL dynamically
- Modified initialization to handle variable parser types

#### `SubscriptionService.js`
- Updated `_fetchParserResults` to use the parser_url from the subscription type
- Added fallback logic if parser_url is not available

#### `parser-protocol.js`
- Added support for updating the baseURL in the underlying Axios client
- Reorganized client creation for better reusability

### 3. Backend Service Changes

- Updated subscription service to include parser_url and other type fields in responses

## Usage

The system now automatically determines which parser to use based on the subscription type. When a subscription is processed:

1. The subscription worker fetches the subscription details, including the parser URL from the subscription_types table
2. The parser client is dynamically configured with the correct URL
3. The request is sent to the appropriate parser service

## Default Parser Types

Default parser types with their URLs have been added:

| Name | Parser URL |
|------|------------|
| boe  | https://boe-parser-415554190254.us-central1.run.app |
| doga | https://doga-parser-415554190254.us-central1.run.app |

## Adding New Parser Types

To add a new parser type:

1. Insert a new row into the `subscription_types` table with appropriate values
2. Ensure the `parser_url` is set to the new parser service URL

Example SQL:
```sql
INSERT INTO subscription_types (id, name, display_name, parser_url, description, icon, is_system)
VALUES (
  'new-parser-type', 
  'new-parser', 
  'New Parser Display Name', 
  'https://new-parser-service-url.example.com',
  'Description of the new parser service',
  'IconName', 
  true
);
``` 