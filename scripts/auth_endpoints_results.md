# Authentication Service Endpoint Tests

## Endpoints Found (12)

- `POST /api/auth/login`: Authenticate a user and receive JWT tokens
- `POST /api/auth/signup`: Register a new user account
- `GET /api/auth/me`: Get the current authenticated user's profile
- `POST /api/auth/verify-email`: Verify a user's email address using a verification token
- `POST /api/auth/logout`: Logout the current user by invalidating their refresh token
- `POST /api/auth/refresh`: Get a new access token using a refresh token
- `POST /api/auth/revoke-all-sessions`: Revoke all active sessions for the current user
- `POST /api/auth/forgot-password`: Request a password reset link
- `POST /api/auth/reset-password`: Reset password using a reset token
- `POST /api/auth/change-password`: Change password for authenticated user
- `POST /api/auth/google/login`: Get Google OAuth login URL
- `GET /api/auth/google/callback`: Handle Google OAuth callback

## Test Results

### POST /api/auth/login

**Description:** Authenticate a user and receive JWT tokens

**Status:** ✅ 200

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWM2MDc0ZC1kYmM0LTQwOTEtOGU0NS1iNmFlY2ZmZDlhYjkiLCJlbWFpbCI6InJhdG9ueGlAZ21haWwuY29tIiwibmFtZSI6IlRlc3QiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc0Mjk5MDM3MywiZXhwIjoxNzQyOTkxMjczfQ.NYwkppTZT_unb_6MPI9gW61JIud6Nbu-RRYUtNXeTzk",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWM2MDc0ZC1kYmM0LTQwOTEtOGU0NS1iNmFlY2ZmZDlhYjkiLCJlbWFpbCI6InJhdG9ueGlAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NDI5OTAzNzMsImV4cCI6MTc0MzU5NTE3M30.2JxhIk3Zdo8MJGZWkFwFoflNRSuXjH1wzQRGs4TBSo0",
  "user": {
    "id": "65c6074d-dbc4-4091-8e45-b6aecffd9ab9",
    "email": "ratonxi@gmail.com",
    "name": "Test",
    "email_verified": true
  }
}
```

### POST /api/auth/signup

**Description:** Register a new user account

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "4287ccd0-32fe-4022-8e56-ff14810cb5dc",
    "timestamp": "2025-03-26T11:59:33.738Z",
    "details": {
      "email": "Missing required body parameter: email",
      "password": "Missing required body parameter: password",
      "name": "Missing required body parameter: name"
    },
    "help": {
      "endpoint_info": {
        "description": "Register a new user account",
        "auth_required": false,
        "method": "POST"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        },
        {
          "path": "/api/auth/logout",
          "methods": [
            "POST"
          ],
          "description": "Logout the current user by invalidating their refresh token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/signup",
      "required_parameters": [
        {
          "name": "email",
          "type": "string",
          "description": "User email"
        },
        {
          "name": "password",
          "type": "string",
          "description": "User password"
        },
        {
          "name": "name",
          "type": "string",
          "description": "User's full name"
        }
      ]
    }
  }
}
```

### GET /api/auth/me

**Description:** Get the current authenticated user's profile

**Status:** ✅ 200

**Response:**
```json
{
  "id": "65c6074d-dbc4-4091-8e45-b6aecffd9ab9",
  "email": "ratonxi@gmail.com",
  "name": "Test",
  "createdAt": "2025-03-06T23:05:16.661Z",
  "emailVerified": true,
  "preferences": {
    "theme": "light",
    "language": "en",
    "notifications": true
  }
}
```

### POST /api/auth/verify-email

**Description:** Verify a user's email address using a verification token

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "e80c0611-fe3b-4b58-b796-8825773a3ced",
    "timestamp": "2025-03-26T11:59:35.066Z",
    "details": {
      "token": "Missing required body parameter: token"
    },
    "help": {
      "endpoint_info": {
        "description": "Verify a user's email address using a verification token",
        "auth_required": false,
        "method": "POST"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/logout",
          "methods": [
            "POST"
          ],
          "description": "Logout the current user by invalidating their refresh token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/verify-email",
      "required_parameters": [
        {
          "name": "token",
          "type": "string",
          "description": "Email verification token"
        }
      ]
    }
  }
}
```

### POST /api/auth/logout

**Description:** Logout the current user by invalidating their refresh token

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "7ef2970a-e4b5-4e1b-bfda-0d9c2a167450",
    "timestamp": "2025-03-26T11:59:35.715Z",
    "details": {
      "refreshToken": "Missing required body parameter: refreshToken"
    },
    "help": {
      "endpoint_info": {
        "description": "Logout the current user by invalidating their refresh token",
        "auth_required": true,
        "method": "POST"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/logout",
          "methods": [
            "POST"
          ],
          "description": "Logout the current user by invalidating their refresh token"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/logout",
      "required_parameters": [
        {
          "name": "refreshToken",
          "type": "string",
          "description": "Refresh token to invalidate"
        }
      ]
    }
  }
}
```

### POST /api/auth/refresh

**Description:** Get a new access token using a refresh token

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "cdeb1647-2a6f-4113-8946-844a66729ccf",
    "timestamp": "2025-03-26T11:59:36.363Z",
    "details": {
      "refreshToken": "Missing required body parameter: refreshToken"
    },
    "help": {
      "endpoint_info": {
        "description": "Get a new access token using a refresh token",
        "auth_required": false,
        "method": "POST"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/refresh",
          "methods": [
            "POST"
          ],
          "description": "Get a new access token using a refresh token"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/refresh",
      "required_parameters": [
        {
          "name": "refreshToken",
          "type": "string",
          "description": "Refresh token"
        }
      ]
    }
  }
}
```

### POST /api/auth/revoke-all-sessions

**Description:** Revoke all active sessions for the current user

**Status:** ✅ 200

**Response:**
```json
{
  "message": "All sessions have been revoked successfully",
  "timestamp": "2025-03-26T11:59:37.059Z"
}
```

### POST /api/auth/forgot-password

**Description:** Request a password reset link

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "3cd80e7f-d740-4df2-9623-d15920e3b9d0",
    "timestamp": "2025-03-26T11:59:37.706Z",
    "details": {
      "email": "Missing required body parameter: email"
    },
    "help": {
      "endpoint_info": {
        "description": "Request a password reset link",
        "auth_required": false,
        "method": "POST"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/forgot-password",
          "methods": [
            "POST"
          ],
          "description": "Request a password reset link"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/forgot-password",
      "required_parameters": [
        {
          "name": "email",
          "type": "string",
          "description": "User email"
        }
      ]
    }
  }
}
```

### POST /api/auth/reset-password

**Description:** Reset password using a reset token

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "8e7c9eaf-9a62-4aa8-9cb1-8277bcf8ea9c",
    "timestamp": "2025-03-26T11:59:38.359Z",
    "details": {
      "token": "Missing required body parameter: token",
      "password": "Missing required body parameter: password"
    },
    "help": {
      "endpoint_info": {
        "description": "Reset password using a reset token",
        "auth_required": false,
        "method": "POST"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/reset-password",
          "methods": [
            "POST"
          ],
          "description": "Reset password using a reset token"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/reset-password",
      "required_parameters": [
        {
          "name": "token",
          "type": "string",
          "description": "Password reset token"
        },
        {
          "name": "password",
          "type": "string",
          "description": "New password"
        }
      ]
    }
  }
}
```

### POST /api/auth/change-password

**Description:** Change password for authenticated user

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "34218cbf-8700-4d3d-a349-9be16cbcd4c9",
    "timestamp": "2025-03-26T11:59:39.016Z",
    "details": {
      "currentPassword": "Missing required body parameter: currentPassword",
      "newPassword": "Missing required body parameter: newPassword"
    },
    "help": {
      "endpoint_info": {
        "description": "Change password for authenticated user",
        "auth_required": true,
        "method": "POST"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/change-password",
          "methods": [
            "POST"
          ],
          "description": "Change password for authenticated user"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/change-password",
      "required_parameters": [
        {
          "name": "currentPassword",
          "type": "string",
          "description": "Current password"
        },
        {
          "name": "newPassword",
          "type": "string",
          "description": "New password"
        }
      ]
    }
  }
}
```

### POST /api/auth/google/login

**Description:** Get Google OAuth login URL

**Status:** ✅ 200

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=openid%20email%20profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&state=c1141b81d172120adb9b49267758e1439e9217975ab9395bd0f8981d0b1333f1&prompt=consent&response_type=code&client_id=415554190254-qh4svnthbmvo9v846do5i5gu88aagj92.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fgoogle%2Fcallback",
  "state": "c1141b81d172120adb9b49267758e1439e9217975ab9395bd0f8981d0b1333f1",
  "nonce": "49d9d92d7caffe66b79f2a616a039026",
  "expiresIn": 600,
  "scope": "openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
}
```

### GET /api/auth/google/callback

**Description:** Handle Google OAuth callback

**Status:** ❌ 400

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters.",
    "request_id": "2abf39e0-6bab-4e3a-aba7-21c5ce6ed6c5",
    "timestamp": "2025-03-26T11:59:40.307Z",
    "details": {
      "code": "Missing required query parameter: code",
      "state": "Missing required query parameter: state"
    },
    "help": {
      "endpoint_info": {
        "description": "Handle Google OAuth callback",
        "auth_required": false,
        "method": "GET"
      },
      "related_endpoints": [
        {
          "path": "/api/auth/google/callback",
          "methods": [
            "GET"
          ],
          "description": "Handle Google OAuth callback"
        },
        {
          "path": "/api/auth/login",
          "methods": [
            "POST"
          ],
          "description": "Authenticate a user and receive JWT tokens"
        },
        {
          "path": "/api/auth/signup",
          "methods": [
            "POST"
          ],
          "description": "Register a new user account"
        },
        {
          "path": "/api/auth/me",
          "methods": [
            "GET"
          ],
          "description": "Get the current authenticated user's profile"
        },
        {
          "path": "/api/auth/verify-email",
          "methods": [
            "POST"
          ],
          "description": "Verify a user's email address using a verification token"
        }
      ],
      "documentation_url": "https://docs.nifya.app/api/auth/google/callback"
    }
  }
}
```

