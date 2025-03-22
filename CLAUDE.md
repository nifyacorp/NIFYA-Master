# NIFYA Project Guidelines

## Build Commands
- Authentication Service: `npm run build` (compile TS), `npm run dev` (development)
- Frontend: `npm run build` (production build), `npm run lint` (lint code), `npm run type-check` (TS check)
- Backend: `npm run dev` (development with nodemon), `NODE_ENV=development SKIP_DB_VALIDATION=true npm run dev` (without DB)
- Single Test: No specific test command found. Add to package.json as needed.

## Code Style Guidelines
- **TypeScript**: Use strict mode, proper type annotations, and avoid `any` types
- **Imports**: Sort imports by external/internal, grouped by functionality
- **Naming**: PascalCase for classes, camelCase for functions/variables, UPPER_CASE for constants
- **Error Handling**: Use AppError with standardized codes and Zod for validation
- **Formatting**: 2-space indentation, max 80-100 chars per line
- **API Responses**: Standardized structure with status, data and clear error objects
- **Architecture**: Clean domain-driven architecture with separate controllers/services
- **Database**: Use parameterized queries and respect Row-Level Security context
- **Logging**: Consistent context object with requestId, path, and method
- **Fallbacks**: Always provide fallback responses for database operation failures

## API Resilience
- Self-documenting APIs with detailed metadata
- Helpful error messages with resolution hints
- Consistent error response structure across services
- Standard headers for authentication and request tracking

## Important Notes
- Push changes to respective repositories to trigger cloud builds
- Consult README-API-RESILIENCE.md for API documentation standards
- Test subscription endpoints with RLS context validation
- Ensure middleware contains both Fastify and Express implementations