# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`, `npm run preview` (preview build), `npm run build:netlify` (Netlify deploy)
- Backend: `npm run dev` (development with nodemon), `npm run start` (production)
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
- BOE/DOGA Parser: `npm run dev` (development), `npm test` (Vitest), `npm run lint`
- Subscription worker: `npm run dev` (development), `npm run start` (production)
- Notification worker: `npm run dev` (development), `npm run start` (production), `npm test`, `npm run format` (prettier)
- Email notification: `npm run dev` (development), `npm run start` (production), `npm test`
- Running single test: `npm test -- -t "test name"` (Authentication service) or `vitest run -t "test name"` (services using Vitest)
- Debug specific service: `node --inspect=9229 src/index.js` (use Chrome devtools at chrome://inspect)
- Type checking: `tsc --noEmit` (TypeScript verification without emitting files)

## Code Style Guidelines
- **TypeScript**: Strict typing with interfaces/types, Zod for validation, ES2020+ target, noUnusedLocals/Parameters
- **Imports**: Group imports (React, libraries, local), sort alphabetically within groups, use path aliases (@/* in frontend)
- **Formatting**: 2-space indentation, semicolons required, 100-char line limit, Prettier for consistent formatting
- **Naming**: PascalCase for components/classes, camelCase for functions/variables, UPPER_CASE for constants
- **Error Handling**: Use AppError with ErrorResponseBuilder for consistent API errors with codes and context
- **Logging**: Structured logging with request IDs and consistent emoji prefixes (📝, ❌, 📨, ⚙️, 🔒)
- **Components**: Small, reusable with React Query for data, Context API for global state
- **Testing**: Write unit tests for critical service logic, use Vitest where applicable
- **Environment**: Use dotenv for environment variables, check required variables at startup
- **Comments**: Use JSDoc for functions/components, TODO/FIXME tags for pending work

## Key Architectural Patterns
- **API Resilience**: Use standardized metadata, error building, and documentation via apiMetadata.js and ErrorResponseBuilder
- **Authentication**: Use AuthContext for frontend components, auth.middleware for backend routes
- **Database Access**: Use proper database client from infrastructure/database
- **Microservices**: Use PubSub for async communication between services
- **Domain-Driven Design**: Maintain clear service/repository separation with domain-specific modules
- **Notifications**: Use worker services for processing, respect user preferences, implement real-time and digest delivery