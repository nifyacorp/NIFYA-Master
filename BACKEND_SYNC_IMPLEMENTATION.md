# Backend Implementation Guide: Firebase Authentication Synchronization

This document provides guidelines for implementing the backend endpoint that synchronizes Firebase Authentication users with our application's database.

## Endpoint Specification

### 1. Basic Information

- **Endpoint:** `/v1/users/sync`
- **Method:** POST
- **Authentication:** Firebase ID token required (sent in the Authorization header)
- **Purpose:** Synchronize a Firebase-authenticated user with the application's database

### 2. Request

```
POST /v1/users/sync
Authorization: Bearer {firebase_id_token}
Content-Type: application/json
```

No request body is needed since the user information is extracted from the validated Firebase ID token.

### 3. Response

**Success (200 OK):**
```json
{
  "success": true,
  "profile": {
    "id": "firebase_uid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar": null,
    "emailVerified": true,
    "lastLogin": "2023-06-14T12:34:56Z",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-06-14T12:34:56Z"
    // Other user properties as needed
  }
}
```

**Error (4xx):**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Implementation Steps

### 1. Set Up Firebase Admin SDK

If not already done, install and configure the Firebase Admin SDK in your backend:

```bash
# For Node.js
npm install firebase-admin
```

Initialize the Admin SDK with your service account credentials:

```javascript
// Node.js example
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Other configuration options
});
```

### 2. Create a Middleware to Verify Firebase ID Tokens

Create a middleware that extracts and verifies the Firebase ID token from incoming requests:

```javascript
// Node.js + Express example
async function verifyFirebaseToken(req, res, next) {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }
    
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach the decoded token to the request object
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid authentication token' 
    });
  }
}
```

### 3. Implement the Sync Endpoint

Create the endpoint that synchronizes Firebase authentication data with your database:

```javascript
// Node.js + Express example
router.post('/v1/users/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUser = req.user;
    
    // Find user in your database by Firebase UID
    let user = await UserModel.findOne({ firebaseUid: firebaseUser.uid });
    
    if (user) {
      // User exists - update details
      user = await UserModel.findOneAndUpdate(
        { firebaseUid: firebaseUser.uid },
        {
          email: firebaseUser.email,
          name: firebaseUser.name || firebaseUser.email?.split('@')[0],
          emailVerified: firebaseUser.email_verified,
          lastLogin: new Date(),
          // Update other fields as needed
        },
        { new: true } // Return the updated document
      );
    } else {
      // Create new user in your database
      user = await UserModel.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name || firebaseUser.email?.split('@')[0],
        emailVerified: firebaseUser.email_verified,
        lastLogin: new Date(),
        createdAt: new Date(),
        // Other fields as needed
      });
    }
    
    // Return the user profile
    return res.status(200).json({
      success: true,
      profile: {
        id: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Include other fields as needed
      }
    });
  } catch (error) {
    console.error('User sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
```

### 4. Database Schema Changes

Ensure your user database schema includes a field for the Firebase UID:

```javascript
// Mongoose Schema example
const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  avatar: String,
  emailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date,
  // Other fields as needed
});
```

### 5. Security Considerations

- Use HTTPS for all API communications
- Implement rate limiting to prevent abuse
- Log authentication events for auditing purposes
- Consider additional validation or security checks specific to your application

## Testing

1. Use the Firebase Authentication emulator for local testing
2. Test new user creation
3. Test existing user updates
4. Test with various authentication methods (email/password, Google, etc.)
5. Test error scenarios (invalid tokens, database failures, etc.)

## Deployment

1. Ensure environment variables are properly set in your deployment environment
2. Configure Firebase Admin SDK with proper credentials
3. Deploy your backend application
4. Monitor logs for authentication-related errors

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase ID Token Verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens) 