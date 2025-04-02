/**
 * NIFYA Mock API Server
 * 
 * This server simulates the backend API for frontend testing.
 * It provides mock responses for authentication, subscriptions, and notifications.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));
app.use(bodyParser.json());

// Optional request delay
app.use((req, res, next) => {
  const delay = req.query.delay ? parseInt(req.query.delay, 10) : 0;
  
  if (delay) {
    setTimeout(next, delay);
  } else {
    next();
  }
});

// JWT secret for token signing/verification
const JWT_SECRET = 'nifya-mock-secret-key';

// In-memory storage
const db = {
  users: [
    {
      id: '65c6074d-dbc4-4091-8e45-b6aecffd9ab9',
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      email_verified: true
    }
  ],
  subscriptions: [
    {
      id: '3f8b5647-0b95-4f74-9c78-4d648965c8a5',
      user_id: '65c6074d-dbc4-4091-8e45-b6aecffd9ab9',
      name: 'Test Subscription',
      description: 'This is a test subscription',
      prompts: ['Test prompt 1', 'Test prompt 2'],
      logo: 'https://example.com/logo.png',
      frequency: 'daily',
      type: 'test',
      active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ],
  notifications: [
    {
      id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
      user_id: '65c6074d-dbc4-4091-8e45-b6aecffd9ab9',
      subscription_id: '3f8b5647-0b95-4f74-9c78-4d648965c8a5',
      entity_type: 'subscription',
      entity_id: '3f8b5647-0b95-4f74-9c78-4d648965c8a5',
      title: 'New notification',
      content: 'This is a test notification',
      read: false,
      created_at: '2025-04-01T00:00:00Z'
    }
  ],
  tokens: {} // userId -> refreshToken
};

// Helper functions
const generateToken = (user) => {
  const accessToken = jwt.sign(
    { 
      sub: user.id, 
      email: user.email, 
      name: user.name 
    }, 
    JWT_SECRET, 
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { sub: user.id }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  db.tokens[user.id] = refreshToken;
  
  return { accessToken, refreshToken };
};

const authenticate = (req, res, next) => {
  // Get authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error', 
      code: 'MISSING_HEADERS',
      message: 'Invalid Authorization header format. Must be: Bearer <token>',
      statusCode: 401
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error', 
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
      statusCode: 401
    });
  }
};

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API server is healthy',
    version: '1.0.0'
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = db.users.find(u => u.email === email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      statusCode: 401
    });
  }
  
  const { accessToken, refreshToken } = generateToken(user);
  
  res.json({
    status: 'success',
    data: {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified
      }
    }
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const userId = decoded.sub;
    
    if (db.tokens[userId] !== refreshToken) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
        statusCode: 401
      });
    }
    
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: 401
      });
    }
    
    const newTokens = generateToken(user);
    
    res.json({
      status: 'success',
      data: {
        token: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    });
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid refresh token',
      statusCode: 401
    });
  }
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  const userId = req.user.sub;
  
  if (db.tokens[userId]) {
    delete db.tokens[userId];
  }
  
  res.json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// User routes
app.get('/api/user/profile', authenticate, (req, res) => {
  const userId = req.user.sub;
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      code: 'USER_NOT_FOUND',
      message: 'User not found',
      statusCode: 404
    });
  }
  
  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified
      }
    }
  });
});

// Subscription routes
app.get('/api/v1/subscriptions', authenticate, (req, res) => {
  const userId = req.user.sub;
  const userSubscriptions = db.subscriptions.filter(s => s.user_id === userId);
  
  res.json({
    status: 'success',
    data: {
      subscriptions: userSubscriptions.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        prompts: s.prompts,
        logo: s.logo,
        frequency: s.frequency,
        type: s.type,
        active: s.active,
        created_at: s.created_at,
        updated_at: s.updated_at
      }))
    }
  });
});

app.post('/api/v1/subscriptions', authenticate, (req, res) => {
  const userId = req.user.sub;
  
  // Validate required fields
  const { name, description, prompts, logo, frequency, type } = req.body;
  
  if (!name) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'body must have required property \'name\'',
      statusCode: 400
    });
  }
  
  const newSubscription = {
    id: uuidv4(),
    user_id: userId,
    name,
    description: description || '',
    prompts: prompts || [],
    logo: logo || 'https://example.com/default-logo.png',
    frequency: frequency || 'daily',
    type: type || 'default',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  db.subscriptions.push(newSubscription);
  
  res.status(201).json({
    status: 'success',
    data: {
      subscription: newSubscription
    }
  });
});

app.get('/api/v1/subscriptions/:id', authenticate, (req, res) => {
  const userId = req.user.sub;
  const subscriptionId = req.params.id;
  
  const subscription = db.subscriptions.find(
    s => s.id === subscriptionId && s.user_id === userId
  );
  
  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Subscription not found',
      statusCode: 404
    });
  }
  
  res.json({
    status: 'success',
    data: {
      subscription
    }
  });
});

app.patch('/api/v1/subscriptions/:id', authenticate, (req, res) => {
  const userId = req.user.sub;
  const subscriptionId = req.params.id;
  
  const index = db.subscriptions.findIndex(
    s => s.id === subscriptionId && s.user_id === userId
  );
  
  if (index === -1) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Subscription not found',
      statusCode: 404
    });
  }
  
  const subscription = db.subscriptions[index];
  
  // Update fields
  const { name, description, prompts, logo, frequency, type, active } = req.body;
  
  const updatedSubscription = {
    ...subscription,
    name: name !== undefined ? name : subscription.name,
    description: description !== undefined ? description : subscription.description,
    prompts: prompts !== undefined ? prompts : subscription.prompts,
    logo: logo !== undefined ? logo : subscription.logo,
    frequency: frequency !== undefined ? frequency : subscription.frequency,
    type: type !== undefined ? type : subscription.type,
    active: active !== undefined ? active : subscription.active,
    updated_at: new Date().toISOString()
  };
  
  db.subscriptions[index] = updatedSubscription;
  
  res.json({
    status: 'success',
    data: {
      subscription: updatedSubscription
    }
  });
});

app.delete('/api/v1/subscriptions/:id', authenticate, (req, res) => {
  const userId = req.user.sub;
  const subscriptionId = req.params.id;
  
  const index = db.subscriptions.findIndex(
    s => s.id === subscriptionId && s.user_id === userId
  );
  
  if (index === -1) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Subscription not found',
      statusCode: 404
    });
  }
  
  db.subscriptions.splice(index, 1);
  
  res.json({
    status: 'success',
    message: 'Subscription deleted successfully'
  });
});

app.patch('/api/v1/subscriptions/:id/toggle', authenticate, (req, res) => {
  const userId = req.user.sub;
  const subscriptionId = req.params.id;
  
  const index = db.subscriptions.findIndex(
    s => s.id === subscriptionId && s.user_id === userId
  );
  
  if (index === -1) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Subscription not found',
      statusCode: 404
    });
  }
  
  const { active } = req.body;
  
  if (active === undefined) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'body must have required property \'active\'',
      statusCode: 400
    });
  }
  
  db.subscriptions[index].active = Boolean(active);
  db.subscriptions[index].updated_at = new Date().toISOString();
  
  res.json({
    status: 'success',
    data: db.subscriptions[index]
  });
});

app.post('/api/v1/subscriptions/:id/process', authenticate, (req, res) => {
  const userId = req.user.sub;
  const subscriptionId = req.params.id;
  
  const subscription = db.subscriptions.find(
    s => s.id === subscriptionId && s.user_id === userId
  );
  
  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Subscription not found',
      statusCode: 404
    });
  }
  
  // Create a fake processing ID
  const processingId = uuidv4();
  
  // Create a notification for this processed subscription
  const notification = {
    id: uuidv4(),
    user_id: userId,
    subscription_id: subscriptionId,
    entity_type: 'subscription',
    entity_id: subscriptionId,
    title: `Processed ${subscription.name}`,
    content: `Your subscription "${subscription.name}" was processed successfully.`,
    read: false,
    created_at: new Date().toISOString()
  };
  
  db.notifications.push(notification);
  
  res.json({
    status: 'success',
    data: {
      message: 'Subscription processing initiated',
      processing_id: processingId,
      subscription_id: subscriptionId
    }
  });
});

// Notification routes
app.get('/api/v1/notifications', authenticate, (req, res) => {
  const userId = req.user.sub;
  const { entityType, entityId, limit = 10, offset = 0 } = req.query;
  
  let userNotifications = db.notifications.filter(n => n.user_id === userId);
  
  // Filter by entity type if provided
  if (entityType) {
    userNotifications = userNotifications.filter(n => n.entity_type === entityType);
  }
  
  // Filter by entity ID if provided
  if (entityId) {
    userNotifications = userNotifications.filter(n => n.entity_id === entityId);
  }
  
  // Sort by created_at desc
  userNotifications.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Apply pagination
  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);
  const paginatedNotifications = userNotifications.slice(offsetNum, offsetNum + limitNum);
  
  res.json({
    status: 'success',
    data: {
      notifications: paginatedNotifications,
      pagination: {
        total: userNotifications.length,
        limit: limitNum,
        offset: offsetNum,
        has_more: offsetNum + limitNum < userNotifications.length
      }
    }
  });
});

app.patch('/api/v1/notifications/:id/read', authenticate, (req, res) => {
  const userId = req.user.sub;
  const notificationId = req.params.id;
  
  const index = db.notifications.findIndex(
    n => n.id === notificationId && n.user_id === userId
  );
  
  if (index === -1) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Notification not found',
      statusCode: 404
    });
  }
  
  db.notifications[index].read = true;
  
  res.json({
    status: 'success',
    data: {
      notification: db.notifications[index]
    }
  });
});

// Diagnostics routes
app.get('/api/diagnostics', (req, res) => {
  res.json({
    status: 'success',
    data: {
      endpoints: [
        { path: '/health', method: 'GET', description: 'Health check' },
        { path: '/api/diagnostics/db-status', method: 'GET', description: 'Database status' },
        { path: '/api/diagnostics/db-tables', method: 'GET', description: 'Database tables' }
      ]
    }
  });
});

app.get('/api/diagnostics/db-status', (req, res) => {
  res.json({
    status: 'success',
    database: {
      connected: true,
      server_time: new Date().toISOString(),
      tables_count: 3,
      response_times: {
        basic_query_ms: 2,
        complex_query_ms: 5,
        transaction_ms: 8
      }
    }
  });
});

app.get('/api/diagnostics/db-tables', (req, res) => {
  res.json({
    status: 'success',
    tables: [
      'users',
      'subscriptions',
      'notifications'
    ],
    count: 3
  });
});

// Error endpoint for testing
app.get('/api/error-test', (req, res) => {
  const errorType = req.query.type || '500';
  
  switch (errorType) {
    case 'timeout':
      // Never respond to simulate timeout
      break;
    case '401':
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Unauthorized access',
        statusCode: 401
      });
      break;
    case '403':
      res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'Forbidden access',
        statusCode: 403
      });
      break;
    case '404':
      res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Resource not found',
        statusCode: 404
      });
      break;
    case '422':
      res.status(422).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        statusCode: 422,
        details: {
          field1: ['is required'],
          field2: ['must be a string']
        }
      });
      break;
    default:
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        statusCode: 500
      });
  }
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({
    name: 'NIFYA Mock API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'],
      user: ['/api/user/profile'],
      subscriptions: ['/api/v1/subscriptions'],
      notifications: ['/api/v1/notifications']
    }
  });
});

// Start server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`NIFYA Mock API Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});

module.exports = app;