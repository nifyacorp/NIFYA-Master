# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`, `npm run preview` (preview build)
- Backend: `npm run dev` (development with nodemon), `npm run start` (production)
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
<<<<<<< HEAD
- Running single test: `npm test -- -t "test name"` (Authentication service)
- Subscription worker: `npm run dev` (development), `npm run start` (production)
- Notification worker: `npm run dev` (development), `npm run start` (production)
- Email notification: `npm run dev` (development), `npm run start` (production)
=======
- Backend: `npm run dev` (development), `npm run start` (production)
- BOE/DOGA Parser: `npm run dev` (development), `npm run test` (Vitest), `npm run lint`
- Running single test: `npm test -- -t "test name"` (Authentication service) or `vitest run -t "test name"` (services using Vitest)
>>>>>>> aa9d103fe778a33bfb4b06a47d08f00a81fc15e8

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces for all data models, Zod for validation
- **Imports**: Group imports by source (React, libraries, local)
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: PascalCase for components/classes, camelCase for functions/variables
<<<<<<< HEAD
- **Error Handling**: Use AppError for backend errors with proper status codes and ErrorResponseBuilder
- **Components**: Keep small and reusable with clear props interfaces
- **Architecture**: Follow domain-driven design with clear separation of concerns
- **API**: Document endpoints with JSDoc comments for auto-generated docs
- **Testing**: Write unit tests for critical service logic
- **Environment**: Use dotenv for environment variables, check required variables at startup
=======
- **Error Handling**: Use AppError with ErrorResponseBuilder for consistent API errors with codes and context
- **Logging**: Structured logging with request IDs and consistent emoji prefixes (📝, ❌, 📨, ⚙️, 🔒)
- **Components**: Small, reusable with React Query for data, Context API for global state
- **Architecture**: Domain-driven design with clear service/repository separation
- **API Resilience**: Implement retry patterns with exponential backoff for critical operations
- **API Docs**: Document endpoints with JSDoc comments for auto-generated documentation
>>>>>>> aa9d103fe778a33bfb4b06a47d08f00a81fc15e8

## Key Architectural Patterns
- Use AuthContext for authentication in frontend components
- Follow API resilience patterns as documented in shared/README-API-RESILIENCE.md
- Use proper database client from infrastructure/database for database access
- Implement proper error handling with ErrorResponseBuilder for consistent API responses
- For microservices, use PubSub for async communication between services