# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`, `npm run preview` (preview build)
- Backend: `npm run dev` (development with nodemon), `npm run start` (production)
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
- Running single test: `npm test -- -t "test name"` (Authentication service)
- Subscription worker: `npm run dev` (development), `npm run start` (production)
- Notification worker: `npm run dev` (development), `npm run start` (production)
- Email notification: `npm run dev` (development), `npm run start` (production)

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces for all data models
- **Imports**: Group imports by source (React, libraries, local)
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: PascalCase for components/classes, camelCase for functions/variables
- **Error Handling**: Use AppError for backend errors with proper status codes and ErrorResponseBuilder
- **Components**: Keep small and reusable with clear props interfaces
- **Architecture**: Follow domain-driven design with clear separation of concerns
- **API**: Document endpoints with JSDoc comments for auto-generated docs
- **Testing**: Write unit tests for critical service logic
- **Environment**: Use dotenv for environment variables, check required variables at startup

## Key Architectural Patterns
- Use AuthContext for authentication in frontend components
- Follow API resilience patterns as documented in shared/README-API-RESILIENCE.md
- Use proper database client from infrastructure/database for database access
- Implement proper error handling with ErrorResponseBuilder for consistent API responses
- For microservices, use PubSub for async communication between services