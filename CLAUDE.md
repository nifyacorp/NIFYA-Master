# NIFYA Project Guidelines

## Build Commands
- **Frontend**: `npm run dev` (development), `npm run build` (production), `npm run lint` (lint), `npm run type-check` (TS check)
- **Backend**: `npm run dev` (development with nodemon), `NODE_ENV=development SKIP_DB_VALIDATION=true npm run dev` (without DB)
- **Authentication**: `npm run build` (compile TS), `npm run dev` (development with tsx watch)
- **Services**: `npm start` (run service), `npm run lint` (lint code), `npm run format` (format code)
- **Testing**: `npm test` (run all tests), `npm test -- --testNamePattern="test name"` (single test), `vitest` (notification worker)

## Code Style Guidelines
- **Architecture**: Domain-driven with core/infrastructure/interfaces layers
- **TypeScript**: Strict mode, proper type annotations, no `any` types
- **JavaScript**: ES modules, async/await for asynchronous code
- **Imports**: Sort external->internal, group by functionality
- **Naming**: PascalCase (classes), camelCase (functions/variables), UPPER_CASE (constants)
- **Error Handling**: AppError with standardized codes, Zod for validation
- **Formatting**: 2-space indentation, max 80-100 chars per line
- **API**: Standard response structure with status and data
- **Database**: Parameterized queries, respect Row-Level Security
- **Logging**: Include context with requestId, path, and method

## CI/CD
- When changes are synced, cloud builds start automatically
- Each subservice has its own build/deployment pipeline
- Always let builds complete before testing again
- Use the same testing script for consistent results

## Services/URLs
| Service | URL |
|---------|-----|
| Frontend | https://clever-kelpie-60c3a6.netlify.app |
| Authentication | https://authentication-service-415554190254.us-central1.run.app |
| Backend | https://backend-415554190254.us-central1.run.app |
| Others | See deployment documentation |