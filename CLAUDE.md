# NIFYA Project Guidelines

## Build Commands
- **Backend**: `npm run dev` (development with nodemon), `NODE_ENV=development SKIP_DB_VALIDATION=true npm run dev` (without DB)
- **Authentication Service**: `npm run build` (compile TS), `npm run dev` (development)
- **Frontend**: `npm run build` (production build), `npm run lint` (lint code), `npm run type-check` (TS check)
- **Testing**: `npm test` (run all tests), `npm test -- --testNamePattern="test name"` (single test)
- **Notification Worker**: `npm start` (run service), `npm run lint` (lint code), `npm run format` (format code)

## Code Style Guidelines
- **Architecture**: Clean domain-driven architecture with core/infrastructure/interfaces layers
- **TypeScript**: Use strict mode, proper type annotations, avoid `any` types
- **JavaScript**: Use ES modules (import/export), async/await for asynchronous code
- **Imports**: Sort by external/internal, group by functionality
- **Naming**: PascalCase for classes, camelCase for functions/variables, UPPER_CASE for constants
- **Error Handling**: Use AppError with standardized codes, use Zod for validation
- **Formatting**: 2-space indentation, max 80-100 chars per line
- **API Responses**: Standardized structure with status, data and clear error objects
- **Database**: Use parameterized queries, respect Row-Level Security context
- **Logging**: Include consistent context object with requestId, path, and method
- **Fallbacks**: Always provide fallback responses for database operation failures

## API Resilience
- Self-documenting APIs with detailed metadata in apiMetadata.js
- Helpful error messages with resolution hints via ErrorResponseBuilder
- Consistent error response structure across services
- Standard headers for authentication and request tracking

## API Documentation
- Endpoints must include JSDoc comments for parameters and returns
- Error types must be documented with specific error codes
- API schemas should use Zod for validation and documentation
- Refer to README-API-RESILIENCE.md for complete standards