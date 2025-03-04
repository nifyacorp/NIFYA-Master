# Backend Resilience Implementation Guide

This guide provides practical implementation steps for adding self-documenting API capabilities to the NIFYA backend services. It focuses on making APIs more resilient and helpful when handling errors or malformed requests.

## Directory Structure

Add the following files to your backend project:

```
backend/
├── src/
│   ├── middleware/
│   │   ├── errorHandler.js     # Enhanced error handling middleware
│   │   └── apiDocumenter.js    # Self-documenting API middleware
│   ├── utils/
│   │   ├── apiMetadata.js      # API endpoint definitions
│   │   └── errorResponseBuilder.js  # Standard error response builder
│   ├── core/
│   │   └── apiExplorer/        # API discovery and documentation service
│   └── interfaces/http/routes/
│       └── apiExplorer.routes.js  # Routes for API exploration
```

## 1. API Metadata Definition

First, let's create a central repository of API metadata:

```javascript
// src/utils/apiMetadata.js

/**
 * API Metadata repository that describes all endpoints
 * This serves as the source of truth for API documentation and self-documenting errors
 */
export const apiDefinitions = {
  "/api/v1/subscriptions": {
    "GET": {
      "description": "List all subscriptions for the authenticated user",
      "auth_required": true,
      "required_headers": [
        { "name": "Authorization", "description": "Bearer token" }
      ],
      "query_parameters": [
        { "name": "page", "type": "integer", "description": "Page number", "default": 1 },
        { "name": "limit", "type": "integer", "description": "Items per page", "default": 10 },
        { "name": "type", "type": "string", "description": "Filter by subscription type" }
      ],
      "responses": {
        "200": {
          "description": "List of subscriptions",
          "example": {
            "subscriptions": [
              {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "BOE Ayudas",
                "type": "boe",
                "prompts": ["ayudas emprendedores", "subvenciones pymes"]
              }
            ],
            "pagination": {
              "page": 1,
              "limit": 10,
              "total": 1
            }
          }
        }
      }
    },
    "POST": {
      "description": "Create a new subscription",
      "auth_required": true,
      "required_headers": [
        { "name": "Authorization", "description": "Bearer token" },
        { "name": "Content-Type", "description": "application/json" }
      ],
      "body_parameters": [
        { "name": "name", "type": "string", "description": "Subscription name", "required": true },
        { "name": "type", "type": "string", "description": "Subscription type (boe, doga)", "required": true },
        { "name": "prompts", "type": "array", "description": "Array of search prompts (max 3)", "required": true }
      ],
      "responses": {
        "201": {
          "description": "Created subscription",
          "example": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "BOE Ayudas",
            "type": "boe",
            "prompts": ["ayudas emprendedores", "subvenciones pymes"]
          }
        }
      }
    }
  },
  "/api/v1/subscriptions/:id": {
    "GET": {
      "description": "Get a specific subscription by ID",
      "auth_required": true,
      "path_parameters": [
        { "name": "id", "type": "uuid", "description": "Subscription ID", "required": true }
      ],
      "responses": {
        "200": {
          "description": "Subscription details",
          "example": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "BOE Ayudas",
            "type": "boe",
            "prompts": ["ayudas emprendedores", "subvenciones pymes"]
          }
        }
      }
    },
    "PUT": {
      "description": "Update a subscription",
      "auth_required": true,
      "path_parameters": [
        { "name": "id", "type": "uuid", "description": "Subscription ID", "required": true }
      ],
      "body_parameters": [
        { "name": "name", "type": "string", "description": "Subscription name" },
        { "name": "prompts", "type": "array", "description": "Array of search prompts (max 3)" }
      ],
      "responses": {
        "200": {
          "description": "Updated subscription",
          "example": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "BOE Ayudas Updated",
            "type": "boe",
            "prompts": ["ayudas emprendedores 2023", "subvenciones pymes"]
          }
        }
      }
    },
    "DELETE": {
      "description": "Delete a subscription",
      "auth_required": true,
      "path_parameters": [
        { "name": "id", "type": "uuid", "description": "Subscription ID", "required": true }
      ],
      "responses": {
        "200": {
          "description": "Deletion confirmation",
          "example": {
            "success": true,
            "message": "Subscription deleted successfully"
          }
        }
      }
    }
  },
  "/api/v1/subscriptions/:id/process": {
    "POST": {
      "description": "Trigger immediate processing of a subscription",
      "auth_required": true,
      "path_parameters": [
        { "name": "id", "type": "uuid", "description": "Subscription ID", "required": true }
      ],
      "query_parameters": [
        { "name": "force", "type": "boolean", "description": "Force processing even if recently processed", "default": false }
      ],
      "responses": {
        "200": {
          "description": "Processing initiated",
          "example": {
            "success": true,
            "message": "Processing initiated",
            "processing_id": "abc123def456"
          }
        }
      }
    }
  },
  // Add more endpoint definitions here...
};

/**
 * Get metadata for a specific endpoint and method
 */
export function getEndpointMetadata(path, method) {
  // Normalize path to handle parameter matching
  const endpointKey = Object.keys(apiDefinitions).find(key => {
    // Convert path params pattern (:id) to regex pattern ([^/]+)
    const pattern = key.replace(/:[^/]+/g, '[^/]+');
    return path.match(new RegExp(`^${pattern}$`));
  });
  
  if (endpointKey && apiDefinitions[endpointKey][method]) {
    return {
      path: endpointKey,
      method,
      ...apiDefinitions[endpointKey][method]
    };
  }
  
  return null;
}

/**
 * Find related endpoints based on resource path
 */
export function findRelatedEndpoints(path) {
  // Extract the resource type from the path
  const resource = path.split('/')[2]; // e.g., "subscriptions" from "/api/v1/subscriptions/:id"
  
  // Find all endpoints related to this resource
  return Object.keys(apiDefinitions)
    .filter(key => key.includes(`/${resource}`))
    .map(key => ({
      path: key,
      methods: Object.keys(apiDefinitions[key])
    }));
}

/**
 * Get all available endpoints
 */
export function getAllEndpoints() {
  return Object.keys(apiDefinitions).map(path => ({
    path,
    methods: Object.keys(apiDefinitions[path]),
    description: apiDefinitions[path][Object.keys(apiDefinitions[path])[0]].description.split('.')[0]
  }));
}
```

## 2. Error Response Builder

Next, create a utility for building standardized error responses:

```javascript
// src/utils/errorResponseBuilder.js

import { getEndpointMetadata, findRelatedEndpoints } from './apiMetadata.js';

/**
 * Build a standardized error response that includes self-documenting information
 */
export function buildErrorResponse(req, options) {
  const {
    code = 'UNKNOWN_ERROR',
    message = 'An error occurred while processing your request.',
    statusCode = 500,
    details = [],
    error = null
  } = options;
  
  // Basic error structure
  const errorResponse = {
    error: {
      code,
      message,
      request_id: req.id || 'unknown',
      timestamp: new Date().toISOString()
    }
  };
  
  // Add validation details if provided
  if (details && details.length > 0) {
    errorResponse.error.details = details;
  }
  
  // Add the original error stack in development
  if (process.env.NODE_ENV === 'development' && error) {
    errorResponse.error.stack = error.stack;
  }
  
  // Add self-documenting help information
  const path = req.route ? req.route.path : req.path;
  const method = req.method;
  
  // Get endpoint metadata
  const endpointMetadata = getEndpointMetadata(path, method);
  
  if (endpointMetadata) {
    // If we have metadata for this endpoint, include it
    errorResponse.error.help = {
      endpoint_info: endpointMetadata,
      related_endpoints: findRelatedEndpoints(path),
      documentation_url: `https://docs.nifya.app/api/v1/${path.split('/').slice(2).join('/')}`
    };
    
    // Add example request if available
    if (endpointMetadata.example_request) {
      errorResponse.error.help.example_request = endpointMetadata.example_request;
    }
  } else {
    // If we don't have specific metadata, provide general API info
    errorResponse.error.help = {
      message: "We couldn't find specific documentation for this endpoint. Here are some available endpoints:",
      available_endpoints: findRelatedEndpoints(path).slice(0, 5),
      documentation_url: "https://docs.nifya.app"
    };
  }
  
  return {
    statusCode,
    body: errorResponse
  };
}

// Common error builders
export const errorBuilders = {
  badRequest: (req, message, details = []) => buildErrorResponse(req, {
    code: 'BAD_REQUEST',
    message,
    statusCode: 400,
    details
  }),
  
  notFound: (req, resource = 'Resource') => buildErrorResponse(req, {
    code: 'NOT_FOUND',
    message: `${resource} not found.`,
    statusCode: 404
  }),
  
  unauthorized: (req) => buildErrorResponse(req, {
    code: 'UNAUTHORIZED',
    message: 'Authentication required to access this resource.',
    statusCode: 401
  }),
  
  forbidden: (req) => buildErrorResponse(req, {
    code: 'FORBIDDEN',
    message: 'You do not have permission to access this resource.',
    statusCode: 403
  }),
  
  validationError: (req, details) => buildErrorResponse(req, {
    code: 'VALIDATION_ERROR',
    message: 'The request contains invalid parameters.',
    statusCode: 400,
    details
  }),
  
  serverError: (req, error) => buildErrorResponse(req, {
    code: 'SERVER_ERROR',
    message: 'An internal server error occurred.',
    statusCode: 500,
    error
  })
};
```

## 3. Error Handler Middleware

Now implement the error handling middleware that uses our error builder:

```javascript
// src/middleware/errorHandler.js

import { errorBuilders } from '../utils/errorResponseBuilder.js';

/**
 * Global error handling middleware that transforms errors into self-documenting responses
 */
export default function errorHandler(err, req, res, next) {
  // Log the error
  req.log.error({ err, req }, 'Request error');
  
  // Handle different types of errors
  if (err.name === 'ValidationError') {
    // Handle validation errors (e.g., from Joi or express-validator)
    const details = err.details || err.errors || [];
    const formattedDetails = Array.isArray(details) 
      ? details.map(d => ({ field: d.path || d.param, message: d.message }))
      : Object.keys(details).map(key => ({ field: key, message: details[key].message }));
    
    const { statusCode, body } = errorBuilders.validationError(req, formattedDetails);
    return res.status(statusCode).json(body);
  }
  
  if (err.name === 'UnauthorizedError') {
    // Handle JWT authentication errors
    const { statusCode, body } = errorBuilders.unauthorized(req);
    return res.status(statusCode).json(body);
  }
  
  if (err.statusCode === 404 || err.name === 'NotFoundError') {
    // Handle not found errors
    const { statusCode, body } = errorBuilders.notFound(req, err.resource || 'Resource');
    return res.status(statusCode).json(body);
  }
  
  if (err.statusCode === 403 || err.name === 'ForbiddenError') {
    // Handle forbidden errors
    const { statusCode, body } = errorBuilders.forbidden(req);
    return res.status(statusCode).json(body);
  }
  
  // Default to server error for unhandled errors
  const { statusCode, body } = errorBuilders.serverError(req, err);
  return res.status(statusCode).json(body);
}
```

## 4. API Documenter Middleware

Create a middleware that validates requests and adds self-documenting behavior:

```javascript
// src/middleware/apiDocumenter.js

import { getEndpointMetadata } from '../utils/apiMetadata.js';
import { errorBuilders } from '../utils/errorResponseBuilder.js';

/**
 * Middleware to validate requests against API metadata and provide self-documenting errors
 */
export default function apiDocumenter(req, res, next) {
  // Get metadata for this endpoint
  const path = req.route ? req.route.path : req.path;
  const method = req.method;
  const metadata = getEndpointMetadata(path, method);
  
  // If no metadata found, continue without validation
  if (!metadata) {
    return next();
  }
  
  // Validate required path parameters
  if (metadata.path_parameters) {
    const errors = [];
    
    metadata.path_parameters.forEach(param => {
      const paramValue = req.params[param.name];
      
      if (param.required && (paramValue === undefined || paramValue === null)) {
        errors.push({
          field: param.name,
          message: `Missing required path parameter: ${param.name}`
        });
      } else if (paramValue !== undefined && param.type === 'uuid') {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(paramValue)) {
          errors.push({
            field: param.name,
            message: `Invalid UUID format for parameter: ${param.name}`
          });
        }
      }
    });
    
    if (errors.length > 0) {
      const { statusCode, body } = errorBuilders.validationError(req, errors);
      return res.status(statusCode).json(body);
    }
  }
  
  // Validate required query parameters
  if (metadata.query_parameters) {
    const requiredParams = metadata.query_parameters.filter(p => p.required);
    const errors = [];
    
    requiredParams.forEach(param => {
      if (req.query[param.name] === undefined) {
        errors.push({
          field: param.name,
          message: `Missing required query parameter: ${param.name}`
        });
      }
    });
    
    if (errors.length > 0) {
      const { statusCode, body } = errorBuilders.validationError(req, errors);
      return res.status(statusCode).json(body);
    }
  }
  
  // Validate required body parameters for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method) && metadata.body_parameters) {
    const requiredParams = metadata.body_parameters.filter(p => p.required);
    const errors = [];
    
    requiredParams.forEach(param => {
      if (req.body === undefined || req.body[param.name] === undefined) {
        errors.push({
          field: param.name,
          message: `Missing required body parameter: ${param.name}`
        });
      }
    });
    
    if (errors.length > 0) {
      const { statusCode, body } = errorBuilders.validationError(req, errors);
      return res.status(statusCode).json(body);
    }
  }
  
  // If all validations pass, continue
  next();
}
```

## 5. API Explorer Service

Create a service for API documentation discovery:

```javascript
// src/core/apiExplorer/service.js

import { getAllEndpoints, getEndpointMetadata, findRelatedEndpoints } from '../../utils/apiMetadata.js';

/**
 * API Explorer service provides endpoints for API discovery and documentation
 */
export default {
  /**
   * Get API health status and overview of available endpoints
   */
  getApiHealth() {
    const startTime = process.uptime();
    const uptime = formatUptime(startTime);
    
    return {
      status: 'healthy',
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      uptime,
      api: {
        base_url: process.env.API_BASE_URL || 'https://api.nifya.app',
        documentation_url: 'https://docs.nifya.app',
        endpoints_count: Object.keys(getAllEndpoints()).length,
        endpoint_groups: [
          { name: 'Authentication', base_path: '/api/v1/auth' },
          { name: 'Subscriptions', base_path: '/api/v1/subscriptions' },
          { name: 'Notifications', base_path: '/api/v1/notifications' },
          { name: 'Settings', base_path: '/api/v1/settings' },
        ]
      }
    };
  },
  
  /**
   * Get list of all available API endpoints
   */
  getAllEndpoints() {
    return {
      endpoints: getAllEndpoints(),
      count: getAllEndpoints().length,
      documentation_url: 'https://docs.nifya.app'
    };
  },
  
  /**
   * Get detailed documentation for a specific endpoint
   */
  getEndpointDocumentation(path, method) {
    const metadata = getEndpointMetadata(path, method);
    
    if (!metadata) {
      return {
        error: {
          message: 'Endpoint documentation not found',
          available_endpoints: findRelatedEndpoints(path)
        }
      };
    }
    
    return {
      documentation: metadata,
      related_endpoints: findRelatedEndpoints(path)
    };
  }
};

/**
 * Format uptime into a human-readable string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  
  return `${days}d ${hours}h ${minutes}m ${Math.floor(seconds)}s`;
}
```

## 6. API Explorer Routes

Create routes for the API explorer:

```javascript
// src/interfaces/http/routes/apiExplorer.routes.js

import apiExplorerService from '../../../core/apiExplorer/service.js';

export async function apiExplorerRoutes(fastify, options) {
  // Health check and API overview
  fastify.get('/api/health', async (request, reply) => {
    return apiExplorerService.getApiHealth();
  });
  
  // List all available endpoints
  fastify.get('/api/explorer', async (request, reply) => {
    return apiExplorerService.getAllEndpoints();
  });
  
  // Get documentation for a specific endpoint
  fastify.get('/api/explorer/:path', async (request, reply) => {
    const path = request.params.path.startsWith('/') 
      ? request.params.path 
      : `/${request.params.path}`;
    const method = request.query.method || 'GET';
    
    return apiExplorerService.getEndpointDocumentation(path, method.toUpperCase());
  });
}
```

## 7. Integration in Main Application

Finally, integrate these components into your main application:

```javascript
// src/index.js or src/app.js

import fastify from 'fastify';
import errorHandler from './middleware/errorHandler.js';
import apiDocumenter from './middleware/apiDocumenter.js';
import { apiExplorerRoutes } from './interfaces/http/routes/apiExplorer.routes.js';
// ... other imports

async function buildApp() {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          path: req.path,
          parameters: req.params,
          // Don't log headers/body for privacy and security
        }),
        res: (res) => ({
          statusCode: res.statusCode
        })
      }
    },
    genReqId: (req) => {
      // Generate unique request ID
      return req.headers['x-request-id'] || crypto.randomUUID();
    }
  });
  
  // Register middleware
  app.addHook('preHandler', apiDocumenter);
  
  // Register routes
  app.register(apiExplorerRoutes);
  // ... register other routes
  
  // Register error handler
  app.setErrorHandler(errorHandler);
  
  return app;
}

// Start the server
async function startServer() {
  try {
    const app = await buildApp();
    await app.listen({
      port: process.env.PORT || 3000,
      host: process.env.HOST || '0.0.0.0'
    });
    app.log.info(`Server listening on ${app.server.address().port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

startServer();
```

## 8. Example Controller with Self-Documenting Errors

Here's an example of a controller using the self-documenting error handling:

```javascript
// src/core/subscription/interfaces/http/subscription-controller.js

import { errorBuilders } from '../../../../utils/errorResponseBuilder.js';
import subscriptionService from '../../service/subscription-service.js';

/**
 * Process a subscription immediately
 */
export const processSubscription = async (request, reply) => {
  const { id } = request.params;
  const { force = false } = request.query;
  const userId = request.user.id;
  
  try {
    // Check if subscription exists and belongs to user
    const subscription = await subscriptionService.getSubscriptionById(id);
    
    if (!subscription) {
      const { statusCode, body } = errorBuilders.notFound(request, 'Subscription');
      return reply.status(statusCode).send(body);
    }
    
    if (subscription.user_id !== userId) {
      const { statusCode, body } = errorBuilders.forbidden(request);
      return reply.status(statusCode).send(body);
    }
    
    // Process the subscription
    const result = await subscriptionService.processSubscription(id, { force });
    
    return {
      success: true,
      message: 'Subscription processing initiated',
      processing_id: result.processing_id
    };
  } catch (error) {
    request.log.error({ error }, 'Error processing subscription');
    
    if (error.code === 'RATE_LIMITED') {
      const { statusCode, body } = errorBuilders.badRequest(request, 
        'This subscription was processed recently. Use force=true to override.',
        [{ field: 'force', message: 'Set to true to force processing' }]
      );
      return reply.status(statusCode).send(body);
    }
    
    const { statusCode, body } = errorBuilders.serverError(request, error);
    return reply.status(statusCode).send(body);
  }
};
```

## Example Error Responses

Here are examples of self-documenting error responses:

### 1. Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2023-04-01T12:34:56.789Z",
    "details": [
      {
        "field": "id",
        "message": "Invalid UUID format for parameter: id"
      }
    ],
    "help": {
      "endpoint_info": {
        "path": "/api/v1/subscriptions/:id/process",
        "method": "POST",
        "description": "Trigger immediate processing of a subscription",
        "auth_required": true,
        "path_parameters": [
          {
            "name": "id",
            "type": "uuid",
            "description": "Subscription ID",
            "required": true
          }
        ],
        "query_parameters": [
          {
            "name": "force",
            "type": "boolean",
            "description": "Force processing even if recently processed",
            "default": false
          }
        ]
      },
      "related_endpoints": [
        {
          "path": "/api/v1/subscriptions",
          "methods": ["GET", "POST"]
        },
        {
          "path": "/api/v1/subscriptions/:id",
          "methods": ["GET", "PUT", "DELETE"]
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/v1/subscriptions/:id/process"
    }
  }
}
```

### 2. Not Found Error

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Subscription not found.",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2023-04-01T12:34:56.789Z",
    "help": {
      "endpoint_info": {
        "path": "/api/v1/subscriptions/:id",
        "method": "GET",
        "description": "Get a specific subscription by ID",
        "auth_required": true,
        "path_parameters": [
          {
            "name": "id",
            "type": "uuid",
            "description": "Subscription ID",
            "required": true
          }
        ]
      },
      "related_endpoints": [
        {
          "path": "/api/v1/subscriptions",
          "methods": ["GET", "POST"]
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/v1/subscriptions/:id",
      "example_request": {
        "curl": "curl -X GET https://api.nifya.app/api/v1/subscriptions/123e4567-e89b-12d3-a456-426614174000 -H 'Authorization: Bearer YOUR_TOKEN'"
      }
    }
  }
}
```

## Conclusion

This implementation guide provides a comprehensive approach to making your NIFYA backend services more resilient and self-documenting. By implementing these patterns, your API will:

1. Provide clear guidance when errors occur
2. Help developers understand how to correctly use each endpoint
3. Make debugging easier when issues arise
4. Create a more consistent experience across all services

The key components are:

- **API Metadata Repository**: Central source of truth for endpoint documentation
- **Error Response Builder**: Standardized error format with self-documenting help
- **Validation Middleware**: Validates requests against metadata definitions
- **API Explorer**: Endpoints for discovering API capabilities

These improvements will significantly enhance the developer experience and make your system more resilient to communication issues between services. 