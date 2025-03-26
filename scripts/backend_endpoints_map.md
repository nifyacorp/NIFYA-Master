# NIFYA Backend API Endpoint Map

This document provides a comprehensive map of all backend endpoints across NIFYA services.

## Summary

- **Total endpoints discovered:** 12
- **Unique endpoints:** 12
- **Frontend endpoints referenced:** 0
- **Endpoints matched between frontend and backend:** 0
- **Endpoints missing in backend:** 0
- **Unused backend endpoints:** 12

## Endpoints by Service

### Authentication Service

**Endpoints:** 12

| Endpoint | Methods | Description | Source |
|----------|---------|-------------|--------|
| `/api/auth/change-password` | POST | Change password for authenticated user | api-explorer |
| `/api/auth/forgot-password` | POST | Request a password reset link | api-explorer |
| `/api/auth/google/callback` | GET | Handle Google OAuth callback | api-explorer |
| `/api/auth/google/login` | POST | Get Google OAuth login URL | api-explorer |
| `/api/auth/login` | POST | Authenticate a user and receive JWT tokens | api-explorer |
| `/api/auth/logout` | POST | Logout the current user by invalidating their refresh token | api-explorer |
| `/api/auth/me` | GET | Get the current authenticated user's profile | api-explorer |
| `/api/auth/refresh` | POST | Get a new access token using a refresh token | api-explorer |
| `/api/auth/reset-password` | POST | Reset password using a reset token | api-explorer |
| `/api/auth/revoke-all-sessions` | POST | Revoke all active sessions for the current user | api-explorer |
| `/api/auth/signup` | POST | Register a new user account | api-explorer |
| `/api/auth/verify-email` | POST | Verify a user's email address using a verification token | api-explorer |

## Frontend-Backend Comparison

### Missing Endpoints (Referenced in Frontend but not found in Backend)

No missing endpoints! 🎉


### Unused Backend Endpoints


- `POST /api/auth/login` (Authentication Service)
- `POST /api/auth/signup` (Authentication Service)
- `GET /api/auth/me` (Authentication Service)
- `POST /api/auth/verify-email` (Authentication Service)
- `POST /api/auth/logout` (Authentication Service)
- `POST /api/auth/refresh` (Authentication Service)
- `POST /api/auth/revoke-all-sessions` (Authentication Service)
- `POST /api/auth/forgot-password` (Authentication Service)
- `POST /api/auth/reset-password` (Authentication Service)
- `POST /api/auth/change-password` (Authentication Service)
- `POST /api/auth/google/login` (Authentication Service)
- `GET /api/auth/google/callback` (Authentication Service)

## Potential Issues


- Some backend endpoints are not being used by the frontend


## Next Steps


- Review unused endpoints to determine if they should be removed or documented


