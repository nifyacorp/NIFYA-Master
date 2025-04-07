# Subscription Deletion Diagnostic Report

Generated: 2025-04-05T16:28:46.923Z

## Summary

Total subscriptions tested: 7
Successfully diagnosed: 7
Failed diagnoses: 0

## Test Results

| Subscription ID | Exists in API | Exists in DB | Diagnostic Status |
|-----------------|--------------|--------------|-------------------|
| df6a9027-3f5b-4c00-87a3-487b62ce5581 | Yes | No | Inconsistent |
| 393485a4-324a-4f42-8756-0d90022c9fc1 | Yes | No | Inconsistent |
| 4c5eeabd-fac8-4b75-b825-f23987baf12d | Yes | No | Inconsistent |
| 9811564b-99af-4749-8d68-1f050efb8753 | Yes | No | Inconsistent |
| 84429f15-60a8-4790-aeec-9bb144c18850 | Yes | No | Inconsistent |
| 8c950462-2c99-453b-a8df-6809dc5603da | Yes | No | Inconsistent |
| 63230a72-6cf6-4109-993b-5725aacb3e7f | Yes | No | Inconsistent |

## Detailed Findings

### Subscription: df6a9027-3f5b-4c00-87a3-487b62ce5581

- **Name**: Test BOE Subscription
- **Created**: Unknown
- **Exists in API**: Yes
- **Exists in Database**: No

**INCONSISTENCY DETECTED**: This subscription has an inconsistent state between the API and database.

### Subscription: 393485a4-324a-4f42-8756-0d90022c9fc1

- **Name**: Test BOE Subscription
- **Created**: Unknown
- **Exists in API**: Yes
- **Exists in Database**: No

**INCONSISTENCY DETECTED**: This subscription has an inconsistent state between the API and database.

### Subscription: 4c5eeabd-fac8-4b75-b825-f23987baf12d

- **Name**: Test BOE Subscription 2025-04-04T21:54:13.933Z
- **Created**: Unknown
- **Exists in API**: Yes
- **Exists in Database**: No

**INCONSISTENCY DETECTED**: This subscription has an inconsistent state between the API and database.

### Subscription: 9811564b-99af-4749-8d68-1f050efb8753

- **Name**: Test BOE Subscription
- **Created**: Unknown
- **Exists in API**: Yes
- **Exists in Database**: No

**INCONSISTENCY DETECTED**: This subscription has an inconsistent state between the API and database.

### Subscription: 84429f15-60a8-4790-aeec-9bb144c18850

- **Name**: Test BOE Subscription 2025-04-04T21:52:37.873Z
- **Created**: Unknown
- **Exists in API**: Yes
- **Exists in Database**: No

**INCONSISTENCY DETECTED**: This subscription has an inconsistent state between the API and database.

### Subscription: 8c950462-2c99-453b-a8df-6809dc5603da

- **Name**: Test BOE Subscription
- **Created**: Unknown
- **Exists in API**: Yes
- **Exists in Database**: No

**INCONSISTENCY DETECTED**: This subscription has an inconsistent state between the API and database.

### Subscription: 63230a72-6cf6-4109-993b-5725aacb3e7f

- **Name**: Test BOE Subscription 2025-04-04T15:32:16.272Z
- **Created**: Unknown
- **Exists in API**: Yes
- **Exists in Database**: No

**INCONSISTENCY DETECTED**: This subscription has an inconsistent state between the API and database.

## Recommendations

- **Database Cleanup Needed**: 7 subscriptions have inconsistencies between the API and database.
- Execute the deletion tool with the 'delete' operation on these subscriptions to attempt cleanup.

### Cleanup Command Examples

`node run-subscription-deletion-debug.js df6a9027-3f5b-4c00-87a3-487b62ce5581 delete`

`node run-subscription-deletion-debug.js 393485a4-324a-4f42-8756-0d90022c9fc1 delete`

`node run-subscription-deletion-debug.js 4c5eeabd-fac8-4b75-b825-f23987baf12d delete`

`node run-subscription-deletion-debug.js 9811564b-99af-4749-8d68-1f050efb8753 delete`

`node run-subscription-deletion-debug.js 84429f15-60a8-4790-aeec-9bb144c18850 delete`

`node run-subscription-deletion-debug.js 8c950462-2c99-453b-a8df-6809dc5603da delete`

`node run-subscription-deletion-debug.js 63230a72-6cf6-4109-993b-5725aacb3e7f delete`

