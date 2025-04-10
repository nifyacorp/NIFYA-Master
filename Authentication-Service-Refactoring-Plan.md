# Authentication Service Refactoring Plan

## Current Issues

1. **Error Handling Issues**: 
   - Frontend fails to properly handle error responses from the authentication service
   - Direct rendering of error objects causing React error #31

2. **Code Organization Problems**:
   - Scattered logic across multiple files makes flow difficult to follow
   - Validation logic mixed with controller logic
   - Complex error building patterns

## Proposed Structure Improvements

### 1. Centralized Authentication Module

```
Authentication-Service/
├── src/
│   ├── auth/                        # All auth logic in one place
│   │   ├── controllers/             # Controller methods only
│   │   ├── services/                # Business logic 
│   │   ├── validation/              # All validation schemas
│   │   ├── models/                  # Data models
│   │   └── errors/                  # Error definitions
│   ├── database/                    # Database connection and queries
│   ├── middleware/                  # Express middleware
│   ├── utils/                       # Utility functions
│   └── api/                         # API routes
```

### 2. Standardized Error Handling

1. Create a consistent error response format:

```typescript
// errors/types.ts
export interface ErrorResponse {
  code: string;        // Machine-readable error code
  message: string;     // User-friendly message
  details?: unknown;   // Optional additional information
  status: number;      // HTTP status code
}
```

2. Central error factory:

```typescript
// errors/factory.ts
export const createError = (code: string, message: string, status = 400, details?: unknown): ErrorResponse => ({
  code,
  message,
  status,
  details
});

export const AUTH_ERRORS = {
  EMAIL_EXISTS: createError('EMAIL_EXISTS', 'This email is already registered', 400),
  INVALID_CREDENTIALS: createError('INVALID_CREDENTIALS', 'Invalid email or password', 401),
  // More predefined errors...
};
```

### 3. Cleaner Controller Methods

Simplify controllers to basic request handling:

```typescript
// auth/controllers/user.controller.ts
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    
    // Validation moved to middleware
    
    // Call service layer
    const result = await authService.createUser(email, password, name);
    
    return res.status(201).json(result);
  } catch (error) {
    // Centralized error handling
    next(error);
  }
};
```

### 4. Middleware-Based Validation

Move validation to middleware:

```typescript
// auth/middleware/validation.middleware.ts
export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    signupSchema.parse({ email, password, name });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert validation errors to standard format
      next(new ValidationError(error));
    } else {
      next(error);
    }
  }
};
```

### 5. Business Logic in Services

```typescript
// auth/services/auth.service.ts
export const createUser = async (email: string, password: string, name: string) => {
  // Check if email exists
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw AUTH_ERRORS.EMAIL_EXISTS;
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await userRepository.create(email, hashedPassword, name);
  
  return {
    message: 'User created successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  };
};
```

## Frontend Error Handling Improvements

1. Create a utility for parsing API errors:

```typescript
// api/errorHandling.ts
export const parseApiError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data) {
    // Handle standard API error format
    const { code, message } = error.response.data;
    return { 
      code: code || 'UNKNOWN_ERROR',
      message: message || 'An unexpected error occurred'
    };
  }
  // Fallback for unexpected errors
  return { 
    code: 'UNEXPECTED_ERROR', 
    message: 'An unexpected error occurred'
  };
};
```

2. Wrap API calls with error handling:

```typescript
// auth/authApi.ts
export const signup = async (credentials) => {
  try {
    const response = await api.post('/auth/signup', credentials);
    return response.data;
  } catch (error) {
    const parsedError = parseApiError(error);
    // Return a standardized error object, don't throw
    return { error: parsedError };
  }
};
```

3. Component-level error handling:

```tsx
// Signup.tsx
const signup = async (credentials) => {
  setLoading(true);
  setError(null);
  
  const result = await authApi.signup(credentials);
  
  if (result.error) {
    setError(result.error.message); // Now we have a string, not an object
    setLoading(false);
    return;
  }
  
  // Success handling
};
```

## Implementation Plan

1. **Phase 1: Error Response Standardization**
   - Create error response types and factory
   - Update controllers to use standard errors
   - Fix frontend error handling

2. **Phase 2: Code Reorganization**
   - Move validation to middleware
   - Extract business logic to service layer
   - Refactor controllers to be more concise

3. **Phase 3: Testing**
   - Test all auth flows with the new structure
   - Verify error handling works as expected

Each phase should be implemented and tested separately to ensure a smooth transition with minimal disruption to the production service. 