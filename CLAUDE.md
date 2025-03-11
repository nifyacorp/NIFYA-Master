# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`, `npm run preview` (preview build)
- Backend: `npm run dev` (development with nodemon), `npm run start` (production)
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
- BOE/DOGA Parser: `npm run dev` (development), `npm test` (Vitest), `npm run lint`
- Subscription worker: `npm run dev` (development), `npm run start` (production)
- Notification worker: `npm run dev` (development), `npm run start` (production), `npm test`
- Email notification: `npm run dev` (development), `npm run start` (production), `npm test`
- Running single test: `npm test -- -t "test name"` (Authentication service) or `vitest run -t "test name"` (services using Vitest)

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces for all data models, Zod for validation
- **Imports**: Group imports by source (React, libraries, local)
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: PascalCase for components/classes, camelCase for functions/variables
- **Error Handling**: Use AppError with ErrorResponseBuilder for consistent API errors with codes and context
- **Logging**: Structured logging with request IDs and consistent emoji prefixes (📝, ❌, 📨, ⚙️, 🔒)
- **Components**: Small, reusable with React Query for data, Context API for global state
- **Testing**: Write unit tests for critical service logic, use Vitest where applicable
- **Environment**: Use dotenv for environment variables, check required variables at startup

## Key Architectural Patterns
- **API Resilience**: Use standardized metadata, error building, and documentation via apiMetadata.js and ErrorResponseBuilder
- **Authentication**: Use AuthContext for frontend components, auth.middleware for backend routes
- **Database Access**: Use proper database client from infrastructure/database
- **Microservices**: Use PubSub for async communication between services
- **Domain-Driven Design**: Maintain clear service/repository separation with domain-specific modules