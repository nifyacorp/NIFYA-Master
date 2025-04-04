# Debug Filter Endpoint Implementation Guide

## Overview

This guide provides implementation details for the `/api/v1/subscriptions/debug-filter` diagnostic endpoint based on testing findings.

## Current Status

Testing reveals the debug filter endpoint is returning a 404 "SUBSCRIPTION_NOT_FOUND" error for all parameter combinations, suggesting it's incorrectly treating the route as a subscription detail endpoint that requires an ID.

## Implementation Requirements

The debug filter endpoint should:

1. Allow all query parameters that the subscription list endpoint accepts
2. Return a 200 status with details on how parameters are processed
3. Show what SQL would be generated (without executing it)
4. Be accessible to authenticated users only

## Route Configuration

The endpoint should be registered with this exact pattern:

```javascript
// Example Express.js route registration
router.get('/api/v1/subscriptions/debug-filter', authMiddleware, subscriptionController.debugFilter);
```

**Important**: Ensure this route is registered BEFORE any dynamic routes like `/api/v1/subscriptions/:id` to prevent route conflicts.

## Controller Implementation

Here's a suggested implementation for the controller function:

```javascript
/**
 * Debug filter parameters for subscription queries
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Analysis of how filter parameters would be applied
 */
async function debugFilter(req, res) {
  try {
    // Extract all query parameters
    const {
      type,
      status,
      search,
      createdAfter,
      createdBefore,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      ...otherParams
    } = req.query;
    
    // Convert pagination params to numbers
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    // Build where clauses (similar to the actual list endpoint)
    const whereConditions = [];
    const params = [];
    
    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }
    
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    
    if (search) {
      whereConditions.push('(name ILIKE ? OR description ILIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (createdAfter) {
      whereConditions.push('created_at >= ?');
      params.push(createdAfter);
    }
    
    if (createdBefore) {
      whereConditions.push('created_at <= ?');
      params.push(createdBefore);
    }
    
    // Add user_id filter (always present in actual queries)
    whereConditions.push('user_id = ?');
    params.push(req.userId);
    
    // Valid sort fields
    const validSortFields = ['createdAt', 'name', 'type', 'status', 'updatedAt'];
    const actualSortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    // Valid sort orders
    const actualSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';
    
    // Generate sample SQL
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
      
    const sampleSQL = `
SELECT * FROM subscriptions 
${whereClause}
ORDER BY ${actualSortField} ${actualSortOrder}
LIMIT ${limitNum} OFFSET ${offset};
    `.trim();
    
    // Expected formatting of response
    return res.status(200).json({
      status: 'success',
      data: {
        parsedParams: {
          type,
          status,
          search,
          createdAfter,
          createdBefore,
          sortBy: actualSortField,
          sortOrder: actualSortOrder,
          page: pageNum,
          limit: limitNum,
          offset,
          otherParams: Object.keys(otherParams).length > 0 ? otherParams : null
        },
        whereConditions,
        parameters: params,
        sqlQuery: sampleSQL,
        expectedRowCount: null, // Optional - could be added if you want to do a COUNT query
        unknownParams: Object.keys(otherParams).length > 0 ? Object.keys(otherParams) : []
      }
    });
  } catch (error) {
    console.error('Error in debug filter endpoint:', error);
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing filter parameters'
    });
  }
}
```

## TypeScript Implementation

If using TypeScript, here's a type-safe implementation:

```typescript
interface DebugFilterRequest extends Express.Request {
  query: {
    type?: string;
    status?: string;
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
  };
  userId: string; // Added by auth middleware
}

interface DebugFilterResponse {
  status: string;
  data: {
    parsedParams: {
      type?: string;
      status?: string;
      search?: string;
      createdAfter?: string;
      createdBefore?: string;
      sortBy: string;
      sortOrder: string;
      page: number;
      limit: number;
      offset: number;
      otherParams: Record<string, string> | null;
    };
    whereConditions: string[];
    parameters: (string | number)[];
    sqlQuery: string;
    expectedRowCount: number | null;
    unknownParams: string[];
  };
}

async function debugFilter(req: DebugFilterRequest, res: Express.Response): Promise<void> {
  // Implementation as above, with type safety
}
```

## Testing the Endpoint

After implementation, you should:

1. Test the endpoint with various query parameter combinations
2. Verify it returns a 200 status with the detailed information
3. Confirm the SQL query shown matches what would be executed in the list endpoint
4. Check that unknown parameters are identified in the response

## Security Considerations

The endpoint should:

1. Require authentication to prevent exposing query structure to unauthenticated users
2. Never include sensitive information like database credentials
3. Only show sample SQL, not execute actual database queries
4. Sanitize inputs to prevent SQL injection, even in the sample query

## Recommendations for Frontend Debugging

The frontend team can use this endpoint to debug parameter issues by:

1. Making a request to the debug filter endpoint with the same parameters as the list endpoint
2. Comparing the parsed parameters with what was intended
3. Examining the SQL query to understand how parameters affect filtering

## Example API Response

```json
{
  "status": "success",
  "data": {
    "parsedParams": {
      "type": "boe",
      "status": "active",
      "search": null,
      "createdAfter": null,
      "createdBefore": null,
      "sortBy": "createdAt",
      "sortOrder": "desc",
      "page": 1,
      "limit": 10,
      "offset": 0,
      "otherParams": null
    },
    "whereConditions": [
      "type = ?",
      "status = ?",
      "user_id = ?"
    ],
    "parameters": [
      "boe",
      "active",
      "65c6074d-dbc4-4091-8e45-b6aecffd9ab9"
    ],
    "sqlQuery": "SELECT * FROM subscriptions WHERE type = ? AND status = ? AND user_id = ? ORDER BY createdAt desc LIMIT 10 OFFSET 0;",
    "expectedRowCount": null,
    "unknownParams": []
  }
}
```

## Conclusion

Implementing this debug filter endpoint will help diagnose subscription filtering issues by providing transparency into how query parameters are processed. This is especially valuable for complex queries with multiple filter conditions.

Please implement this endpoint and let the testing team know when it's available for verification.