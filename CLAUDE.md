# NIFYA Project Guidelines

## Build/Test/Lint Commands
- Frontend: `npm run dev` (development), `npm run build` (production), `npm run lint`
- Authentication: `npm run dev` (development), `npm run build` (production), `npm test`
- Running single test: `npm test -- -t "test name"` (Authentication service)

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces for all data models
- **Imports**: Group imports by source (React, libraries, local)
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: PascalCase for components/classes, camelCase for functions/variables
- **Error Handling**: Use AppError for backend errors with proper status codes
- **Components**: Keep small and reusable with clear props interfaces
- **Architecture**: Follow domain-driven design with clear separation of concerns
- **API**: Document endpoints with JSDoc comments for auto-generated docs
- **Testing**: Write unit tests for critical service logic

Always use the AuthContext for user authentication. Follow existing patterns in each module when making changes.