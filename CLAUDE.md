<<<<<<< HEAD
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
=======
# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`, `npm run preview` (preview build), `npm run build:netlify` (Netlify deploy)
- Backend: `npm run dev` (development with nodemon), `npm run start` (production), `npm run lint`
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
- BOE/DOGA Parser: `npm run dev` (development), `npm test` (Vitest), `npm run lint`
- Subscription worker: `npm run dev` (development), `npm run start` (production), `npm run lint`
- Notification worker: `npm run dev` (development), `npm run start` (production), `npm test`, `npm run format` (prettier)
- Email notification: `npm run dev` (development), `npm run start` (production), `npm test`
- Running single test: `npm test -- -t "test name"` (Authentication service) or `vitest run -t "test name"` (services using Vitest)
- Debug specific service: `node --inspect=9229 src/index.js` (use Chrome devtools at chrome://inspect)
- Type checking: `tsc --noEmit` (TypeScript verification without emitting files)

## Code Style Guidelines
- **TypeScript**: Strict typing with interfaces/types, Zod for validation, ES2020+ target, noUnusedLocals/Parameters
- **Imports**: Group imports (React, libraries, local), alphabetically within groups, use path aliases (@/* in frontend)
- **Formatting**: 2-space indent, semicolons required, 100-char line limit, Prettier for consistent formatting
- **Naming**: PascalCase for components/classes, camelCase for functions/variables, UPPER_CASE for constants
- **Error Handling**: Use AppError with ErrorResponseBuilder for consistent API errors with codes and context
- **Logging**: Structured logging with request IDs and emoji prefixes (📝, ❌, 📨, ⚙️, 🔒)
- **State Management**: Context API for global state, React Query for server state, avoid prop drilling
- **Testing**: Unit tests for service logic, integration tests for APIs, mock external dependencies
- **Environment**: Use dotenv for environment variables, check required variables at startup
- **Security**: Never expose secrets in client code, validate all inputs, sanitize outputs

## Key Architectural Patterns
- **API Resilience**: Standardized metadata, error handling via apiMetadata.js and ErrorResponseBuilder
- **Authentication**: AuthContext for frontend components, auth.middleware for backend routes
- **Database Access**: Use proper database client from infrastructure/database
- **Microservices**: PubSub for async communication between services
- **Domain-Driven Design**: Service/repository separation with domain-specific modules
- **Notifications**: Worker services for processing, respect user preferences, real-time and digest delivery
>>>>>>> d39d002b04a0715f45e9cadbbd5015f2a1d4d047
