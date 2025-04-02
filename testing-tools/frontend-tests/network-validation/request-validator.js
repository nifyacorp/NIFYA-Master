/**
 * Request Validator for NIFYA Frontend
 * 
 * This utility validates API requests from the frontend to ensure they
 * conform to expected schemas and formats before being sent to the backend.
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the validation passed
 * @property {Array<string>} errors - List of validation errors
 * @property {Object} [fixedRequest] - Fixed request if auto-fix is enabled
 */

/**
 * @typedef {Object} ValidationSchema
 * @property {Object} headers - Required headers and their format
 * @property {Object} [body] - Expected body schema
 * @property {Array<string>} [requiredFields] - Required fields in the body
 * @property {boolean} [allowExtraFields] - Whether to allow extra fields not in schema
 */

// Common HTTP request schema validation
const commonSchema = {
  headers: {
    'Content-Type': /^application\/json(;.*)?$/,
    'Accept': /^application\/json(,.*)?$/
  }
};

// Authentication request validation schema
const authRequestSchema = {
  headers: {
    'Content-Type': /^application\/json(;.*)?$/,
    'Accept': /^application\/json(,.*)?$/
  },
  body: {
    email: {
      type: 'string',
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
      type: 'string',
      minLength: 8
    }
  },
  requiredFields: ['email', 'password']
};

// Authenticated request validation schema
const authenticatedRequestSchema = {
  headers: {
    'Content-Type': /^application\/json(;.*)?$/,
    'Accept': /^application\/json(,.*)?$/,
    'Authorization': /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/
  }
};

// Subscription creation schema
const subscriptionCreationSchema = {
  headers: {
    'Content-Type': /^application\/json(;.*)?$/,
    'Accept': /^application\/json(,.*)?$/,
    'Authorization': /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/
  },
  body: {
    name: {
      type: 'string',
      minLength: 1
    },
    description: {
      type: 'string'
    },
    prompts: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    logo: {
      type: 'string'
    },
    frequency: {
      type: 'string',
      enum: ['immediate', 'daily']
    },
    type: {
      type: 'string'
    },
    active: {
      type: 'boolean'
    }
  },
  requiredFields: ['name', 'type'],
  allowExtraFields: true
};

// Named schema registry
const schemas = {
  common: commonSchema,
  auth: authRequestSchema,
  authenticated: authenticatedRequestSchema,
  subscriptionCreation: subscriptionCreationSchema
};

/**
 * Validate a request against a schema
 * 
 * @param {Object} request - The request object to validate
 * @param {ValidationSchema|string} schema - Schema to validate against or schema name
 * @param {boolean} [autoFix=false] - Whether to attempt to fix issues
 * @returns {ValidationResult} Validation result
 */
function validateRequest(request, schema, autoFix = false) {
  // If schema is a string, look it up in the registry
  if (typeof schema === 'string') {
    if (!schemas[schema]) {
      return {
        valid: false,
        errors: [`Unknown schema: ${schema}`]
      };
    }
    schema = schemas[schema];
  }
  
  const result = {
    valid: true,
    errors: []
  };
  
  // Create a copy for fixes if auto-fix is enabled
  const fixedRequest = autoFix ? JSON.parse(JSON.stringify(request)) : null;
  
  // Validate headers
  if (schema.headers) {
    for (const [header, pattern] of Object.entries(schema.headers)) {
      const headerValue = request.headers?.[header] || request.headers?.[header.toLowerCase()];
      
      if (!headerValue) {
        result.valid = false;
        result.errors.push(`Missing required header: ${header}`);
        
        if (autoFix) {
          fixedRequest.headers = fixedRequest.headers || {};
          
          // Apply default values for common headers
          if (header === 'Content-Type') {
            fixedRequest.headers[header] = 'application/json';
          } else if (header === 'Accept') {
            fixedRequest.headers[header] = 'application/json';
          }
        }
      } else if (pattern instanceof RegExp && !pattern.test(headerValue)) {
        result.valid = false;
        result.errors.push(`Invalid format for header ${header}: ${headerValue}`);
        
        if (autoFix && header === 'Authorization' && headerValue.indexOf('Bearer') !== 0 && headerValue.length > 10) {
          // Fix Authorization header missing Bearer prefix
          fixedRequest.headers[header] = `Bearer ${headerValue}`;
        }
      }
    }
  }
  
  // Validate body
  if (schema.body && request.body) {
    // Check required fields
    if (schema.requiredFields) {
      for (const field of schema.requiredFields) {
        if (request.body[field] === undefined) {
          result.valid = false;
          result.errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Validate body fields if present
    for (const [field, validation] of Object.entries(schema.body)) {
      const value = request.body[field];
      
      if (value !== undefined) {
        // Type validation
        if (validation.type && typeof value !== validation.type && 
            !(validation.type === 'array' && Array.isArray(value))) {
          result.valid = false;
          result.errors.push(`Invalid type for field ${field}: expected ${validation.type}, got ${typeof value}`);
        }
        
        // String validation
        if (validation.type === 'string' && typeof value === 'string') {
          // Min length
          if (validation.minLength !== undefined && value.length < validation.minLength) {
            result.valid = false;
            result.errors.push(`Field ${field} is too short: minimum length is ${validation.minLength}`);
          }
          
          // Pattern
          if (validation.pattern && !validation.pattern.test(value)) {
            result.valid = false;
            result.errors.push(`Field ${field} does not match required pattern`);
          }
        }
        
        // Array validation
        if (validation.type === 'array' && Array.isArray(value)) {
          // Item validation
          if (validation.items && value.length > 0) {
            for (let i = 0; i < value.length; i++) {
              const item = value[i];
              
              if (validation.items.type && typeof item !== validation.items.type) {
                result.valid = false;
                result.errors.push(`Invalid type for item ${i} in array ${field}: expected ${validation.items.type}`);
              }
            }
          }
        }
        
        // Enum validation
        if (validation.enum && !validation.enum.includes(value)) {
          result.valid = false;
          result.errors.push(`Invalid value for field ${field}: must be one of [${validation.enum.join(', ')}]`);
          
          if (autoFix && validation.enum.length > 0) {
            // Default to first enum value
            fixedRequest.body[field] = validation.enum[0];
          }
        }
      }
    }
    
    // Check for unexpected fields
    if (schema.allowExtraFields === false) {
      const allowedFields = Object.keys(schema.body);
      const actualFields = Object.keys(request.body);
      
      for (const field of actualFields) {
        if (!allowedFields.includes(field)) {
          result.valid = false;
          result.errors.push(`Unexpected field: ${field}`);
        }
      }
    }
  }
  
  // Add fixed request if auto-fix was enabled
  if (autoFix) {
    result.fixedRequest = fixedRequest;
  }
  
  return result;
}

/**
 * Validate a specific request type
 * @param {string} requestType - Type of request to validate (e.g., 'auth', 'subscriptionCreation')
 * @param {Object} request - Request object to validate
 * @param {boolean} [autoFix=false] - Whether to attempt to fix issues
 * @returns {ValidationResult} Validation result
 */
function validateRequestType(requestType, request, autoFix = false) {
  if (!schemas[requestType]) {
    return {
      valid: false,
      errors: [`Unknown request type: ${requestType}`]
    };
  }
  
  return validateRequest(request, schemas[requestType], autoFix);
}

/**
 * Register a new schema
 * @param {string} name - Name for the schema
 * @param {ValidationSchema} schema - The schema definition
 */
function registerSchema(name, schema) {
  schemas[name] = schema;
}

/**
 * Get a registered schema by name
 * @param {string} name - Name of the schema
 * @returns {ValidationSchema|null} The schema or null if not found
 */
function getSchema(name) {
  return schemas[name] || null;
}

// Export the API
module.exports = {
  validateRequest,
  validateRequestType,
  registerSchema,
  getSchema,
  schemas
};