# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`, `npm run preview` (preview build)
- Backend: `npm run dev` (development with nodemon), `npm run start` (production)
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
- BOE/DOGA Parser: `npm run dev` (development), `npm run test` (Vitest), `npm run lint`
- Subscription worker: `npm run dev` (development), `npm run start` (production)
- Notification worker: `npm run dev` (development), `npm run start` (production)
- Email notification: `npm run dev` (development), `npm run start` (production)
- Running single test: `npm test -- -t "test name"` (Authentication) or `vitest run -t "test name"` (Vitest services)

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces for data models, Zod for validation
- **Imports**: Group by source (React, libraries, local modules)
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: PascalCase for components/classes, camelCase for functions/variables
- **Error Handling**: Use AppError with ErrorResponseBuilder for consistent API errors with codes
- **Logging**: Structured logging with request IDs and emoji prefixes (📝, ❌, 📨, ⚙️, 🔒)
- **Components**: Small, reusable with React Query for data, Context API for global state
- **API**: Document endpoints with JSDoc comments for auto-generated documentation
- **Testing**: Write unit tests for critical service logic and use proper mocking

## Key Architectural Patterns
- Follow domain-driven design with clear service/repository separation
- Use AuthContext for authentication in frontend components
- Implement API resilience patterns with self-documenting errors (see shared/README-API-RESILIENCE.md)
- Use proper database client from infrastructure/database for data access
- For microservices, use PubSub for asynchronous communication between services
- Implement retry patterns with exponential backoff for critical operations