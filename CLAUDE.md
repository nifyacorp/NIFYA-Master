# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
- Backend: `npm run dev` (development), `npm run start` (production)
- BOE/DOGA Parser: `npm run dev` (development), `npm run test` (Vitest), `npm run lint`
- Running single test: `npm test -- -t "test name"` (Authentication service) or `vitest run -t "test name"` (services using Vitest)

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces for all data models, Zod for validation
- **Imports**: Group imports by source (React, libraries, local)
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: PascalCase for components/classes, camelCase for functions/variables
- **Error Handling**: Use AppError with ErrorResponseBuilder for consistent API errors with codes and context
- **Logging**: Structured logging with request IDs and consistent emoji prefixes (📝, ❌, 📨, ⚙️, 🔒)
- **Components**: Small, reusable with React Query for data, Context API for global state
- **Architecture**: Domain-driven design with clear service/repository separation
- **API Resilience**: Implement retry patterns with exponential backoff for critical operations
- **API Docs**: Document endpoints with JSDoc comments for auto-generated documentation

Always use the AuthContext for user authentication. Follow existing patterns in each module when making changes.