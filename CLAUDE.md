# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NIFYA Project Guidelines

## Build Commands
- **Frontend**: `npm run dev` (development), `npm run build` (production), `npm run lint` (lint), `npm run type-check` (TS check)
- **Backend**: `npm run dev` (development with nodemon), `NODE_ENV=development SKIP_DB_VALIDATION=true npm run dev` (without DB)
- **Authentication**: `npm run build` (compile TS), `npm run dev` (development with tsx watch)
- **Services**: `npm start` (run service), `npm run lint` (lint code), `npm run format` (format code)
- **Testing**: `npm test` (run all tests), `npm test -- --testNamePattern="test name"` (single test), `vitest` (notification worker)

## Code Style Guidelines
- **Architecture**: Domain-driven with feature-based organization
- **TypeScript**: Strict mode, explicit type annotations, no `any` types
- **JavaScript**: ES modules, async/await for asynchronous code
- **Imports**: Sort external→internal, group by functionality (dependencies, internal modules, UI components)
- **Naming**: PascalCase (components/classes), camelCase (functions/variables/hooks), UPPER_CASE (constants)
- **Components**: Feature-based organization, shared UI components in `/ui` directory
- **State**: Context + custom hooks, React Query for API data
- **Error Handling**: ErrorBoundary components, consistent API error handling, Zod for validation
- **Formatting**: 2-space indentation, max 80-100 chars per line
- **Styling**: TailwindCSS with utility-first approach, shadcn/ui component patterns

## Authentication Headers
- **Format**: Always use `Bearer {token}` format (with space after "Bearer") for Authorization header
- **User ID**: Include `x-user-id` header with user's ID in all authenticated requests
- **Error Check**: `MISSING_HEADERS` (401) error indicates incorrect Authorization header format
- **Utilities**: Use `useAuth()` hook for auth state and methods

## CI/CD
- When changes are synced, cloud builds start automatically
- Each subservice has its own build/deployment pipeline
- Always let builds complete before testing again

## Services/URLs
| Service | URL |
|---------|-----|
| Frontend | https://clever-kelpie-60c3a6.netlify.app |
| Authentication | https://authentication-service-415554190254.us-central1.run.app |
| Backend | https://backend-415554190254.us-central1.run.app |

## Security
- NEVER USE MOCKUP DATA, IF YOU FIND MOCKUP DATA OR TRACES OF MOCKUP DATA REMOVE THE CODE AND THE DATA ASAP
- All API requests must include proper authentication headers
- Sensitive data should never be committed to the repository