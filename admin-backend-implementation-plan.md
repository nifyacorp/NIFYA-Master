# Admin Backend Implementation Plan (Revised)

This document outlines the technical implementation plan for the admin backend requirements as specified in the requirements document. The plan focuses on using the existing database structures and implementing functionality at the API level without schema modifications.

## 1. Architecture Overview

The admin backend functionality will be integrated into the existing backend codebase following the same architectural patterns. The implementation will leverage:

- **Fastify** for the HTTP server framework
- **PostgreSQL** via the existing database client (`pg` library)
- **Firebase Admin SDK** for authentication and authorization
- **Fastify's schema validation** for request validation

### High-Level System Architecture

```
┌───────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Admin Frontend│────▶│ Admin Backend   │────▶│ PostgreSQL DB  │
└───────────────┘     │ API Endpoints   │     └────────────────┘
                      └─────────────────┘
                             │
                             ▼
                      ┌─────────────────┐
                      │ Firebase Admin  │
                      │ (Auth, Storage) │
                      └─────────────────┘
```

## 2. File Structure

The admin backend functionality will be organized in the following file structure:

```
backend/
├── src/
│   ├── core/
│   │   ├── admin/
│   │   │   ├── admin.service.js            # Core business logic for admin operations
│   │   │   ├── admin.repository.js         # Database access layer for admin operations
│   │   │   └── interfaces/
│   │   │       └── http/
│   │   │           ├── admin.controller.js         # Controller functions for admin endpoints
│   │   │           ├── user-admin.controller.js    # User management controllers
│   │   │           ├── subscription-admin.controller.js  # Subscription management controllers
│   │   │           └── notification-admin.controller.js  # Notification management controllers
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── routes/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── index.js            # Admin routes aggregator
│   │   │   │   │   ├── dashboard.routes.js # Dashboard endpoints
│   │   │   │   │   ├── user.routes.js      # User management endpoints
│   │   │   │   │   ├── subscription-type.routes.js # Subscription type endpoints
│   │   │   │   │   ├── subscription.routes.js      # Subscription management endpoints
│   │   │   │   │   └── notification.routes.js      # Notification management endpoints
│   │   │   ├── middleware/
│   │   │   │   └── admin-auth.middleware.js # Admin authentication middleware
│   ├── schemas/
│   │   ├── admin/
│   │   │   ├── index.js                    # Export all admin schemas
│   │   │   ├── dashboard.schema.js         # Dashboard data schemas
│   │   │   ├── user-admin.schema.js        # User management schemas
│   │   │   ├── subscription-type.schema.js # Subscription type schemas
│   │   │   ├── subscription-admin.schema.js # Subscription management schemas
│   │   │   └── notification-admin.schema.js # Notification management schemas
```

## 3. Admin Authentication Approach

According to the schema, the users table already has a `role` field that can be used to identify admin users. We'll leverage this existing field instead of using environment variables:

```javascript
// File: src/interfaces/http/middleware/admin-auth.middleware.js

import { AppError } from '../../../shared/errors/AppError.js';
import { query } from '../../../infrastructure/database/client.js';
import { logger } from '../../../shared/logging/logger.js';

/**
 * Middleware to check if a user has admin privileges
 * This middleware should be used after the firebaseAuthenticate middleware
 */
export async function adminAuthMiddleware(request, reply) {
  const userId = request.user?.id;
  const context = { requestId: request.id, userId };
  
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }
  
  try {
    // Check if user has admin role in the database
    const result = await query(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('UNAUTHORIZED', 'User not found', 401);
    }
    
    const userRole = result.rows[0].role;
    
    if (userRole !== 'admin') {
      throw new AppError('FORBIDDEN', 'Admin access required', 403);
    }
    
    // Add admin info to request object
    request.admin = {
      isAdmin: true,
      role: userRole
    };
    
    // Log admin access
    logger.info(context, 'Admin access granted', { userId, role: userRole });
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error(context, 'Error verifying admin access', {
      error: error.message
    });
    
    throw new AppError('INTERNAL_ERROR', 'Error verifying admin access', 500);
  }
}
```

## 4. Data Access Layer (Services & Repositories)

### 4.1. Admin Service (Core Business Logic)

```javascript
// File: src/core/admin/admin.service.js

import { adminRepository } from './admin.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logging/logger.js';

export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(context = {}) {
    try {
      const userStats = await adminRepository.getUserStats();
      const subscriptionStats = await adminRepository.getSubscriptionStats();
      const notificationStats = await adminRepository.getNotificationStats();
      
      return {
        users: userStats,
        subscriptions: subscriptionStats,
        notifications: notificationStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(context, 'Error getting dashboard stats', { error: error.message });
      throw new AppError('INTERNAL_ERROR', 'Failed to retrieve dashboard statistics', 500);
    }
  },
  
  /**
   * Get recent activity from notifications table
   */
  async getRecentActivity(limit = 10, offset = 0, context = {}) {
    try {
      const activities = await adminRepository.getRecentActivity(limit, offset);
      const total = await adminRepository.getActivityCount();
      
      return {
        activities,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      logger.error(context, 'Error getting recent activity', { error: error.message });
      throw new AppError('INTERNAL_ERROR', 'Failed to retrieve recent activity', 500);
    }
  }
};
```

### 4.2. Admin Repository (Database Access)

```javascript
// File: src/core/admin/admin.repository.js

import { query } from '../../infrastructure/database/client.js';
import { logger } from '../../shared/logging/logger.js';

export const adminRepository = {
  /**
   * Get user statistics
   */
  async getUserStats() {
    // Using direct SQL queries matching the schema
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'user') AS regular_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admin_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users_last_7_days,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_last_30_days
    `, []);
    
    return result.rows[0];
  },
  
  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    // Using direct SQL queries matching the schema
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM subscriptions) AS total_subscriptions,
        (SELECT COUNT(*) FROM subscriptions WHERE active = TRUE) AS active_subscriptions,
        (SELECT COUNT(*) FROM subscriptions WHERE active = FALSE) AS inactive_subscriptions
    `, []);
    
    // Get subscription type counts
    const typeCountsResult = await query(`
      SELECT st.name, COUNT(*) as count
      FROM subscriptions s
      JOIN subscription_types st ON s.type_id = st.id
      GROUP BY st.name
    `, []);
    
    // Convert to object
    const typeCountsObj = {};
    typeCountsResult.rows.forEach(row => {
      typeCountsObj[row.name] = parseInt(row.count, 10);
    });
    
    return {
      ...result.rows[0],
      subscription_type_counts: typeCountsObj
    };
  },
  
  /**
   * Get notification statistics
   */
  async getNotificationStats() {
    // Using direct SQL queries matching the schema
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM notifications) AS total_notifications,
        (SELECT COUNT(*) FROM notifications WHERE read = FALSE) AS unread_notifications,
        (SELECT COUNT(*) FROM notifications WHERE read = TRUE) AS read_notifications,
        (SELECT COUNT(*) FROM notifications WHERE email_sent = TRUE) AS email_sent_notifications,
        (SELECT COUNT(*) FROM notifications WHERE created_at >= NOW() - INTERVAL '7 days') AS notifications_last_7_days
    `, []);
    
    return result.rows[0];
  },
  
  /**
   * Get recent activity from notifications and subscriptions
   * We'll use the notifications table as activity log since there's no dedicated activity table
   */
  async getRecentActivity(limit = 10, offset = 0) {
    // Using notifications, users and subscriptions tables for activity data
    const result = await query(
      `SELECT 
         n.id, 
         n.user_id, 
         u.display_name as user_name, 
         u.email as user_email,
         n.title as action,
         n.entity_type,
         n.created_at,
         n.data,
         s.name as subscription_name
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN subscriptions s ON n.subscription_id = s.id
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    // Format the activities to look like an activity log
    return result.rows.map(row => ({
      id: row.id,
      action: row.action,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      entity_type: row.entity_type,
      entity_name: row.subscription_name,
      created_at: row.created_at,
      details: row.data
    }));
  },
  
  /**
   * Get total activity count
   */
  async getActivityCount() {
    const result = await query('SELECT COUNT(*) as count FROM notifications', []);
    return parseInt(result.rows[0].count, 10);
  }
};
```

## 5. API Endpoints Implementation

### 5.1. Main Admin Routes Entry Point

```javascript
// File: src/interfaces/http/routes/admin/index.js

import { firebaseAuthenticate } from '../../middleware/firebase-auth.middleware.js';
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware.js';
import { dashboardRoutes } from './dashboard.routes.js';
import { userRoutes } from './user.routes.js';
import { subscriptionTypeRoutes } from './subscription-type.routes.js';
import { subscriptionRoutes } from './subscription.routes.js';
import { notificationRoutes } from './notification.routes.js';

export async function adminRoutes(fastify, options) {
  // Apply admin authentication middleware to all admin routes
  fastify.addHook('preHandler', firebaseAuthenticate);
  fastify.addHook('preHandler', adminAuthMiddleware);
  
  // Global error handler for admin routes to provide helpful instructions
  fastify.setErrorHandler(function (error, request, reply) {
    const statusCode = error.statusCode || 500;
    
    // Enhance error messages with helpful instructions for common errors
    let instructions = '';
    
    if (statusCode === 400) {
      instructions = 'Please check your request format and try again. Make sure all required fields are provided and have the correct data types.';
    } else if (statusCode === 401) {
      instructions = 'Authentication is required. Please ensure you have a valid login session.';
    } else if (statusCode === 403) {
      instructions = 'You do not have permission to access this resource. Admin access is required.';
    } else if (statusCode === 404) {
      instructions = 'The requested resource was not found. Please check the URL and parameters.';
    } else {
      instructions = 'An unexpected error occurred. Please try again later or contact support.';
    }
    
    reply
      .code(statusCode)
      .send({
        error: error.name || 'Error',
        message: error.message,
        statusCode,
        instructions,
        timestamp: new Date().toISOString(),
        path: request.url
      });
  });
  
  // Register admin routes
  await fastify.register(dashboardRoutes, { prefix: '/dashboard' });
  await fastify.register(userRoutes, { prefix: '/users' });
  await fastify.register(subscriptionTypeRoutes, { prefix: '/subscription-types' });
  await fastify.register(subscriptionRoutes, { prefix: '/subscriptions' });
  await fastify.register(notificationRoutes, { prefix: '/notifications' });
}
```

### 5.2. User Management Routes

```javascript
// File: src/interfaces/http/routes/admin/user.routes.js

import { userAdminController } from '../../../../core/admin/interfaces/http/user-admin.controller.js';

export async function userRoutes(fastify, options) {
  // Get users list
  fastify.get('/', {
    schema: {
      description: 'Get paginated list of users',
      tags: ['Admin - Users'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          sort_by: { type: 'string', enum: ['display_name', 'email', 'created_at', 'role'], default: 'created_at' },
          sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  display_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string' },
                  avatar_url: { type: 'string', nullable: true },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  subscription_count: { type: 'integer' },
                  notification_count: { type: 'integer' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' },
                has_next: { type: 'boolean' },
                has_prev: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, userAdminController.getUsers);
  
  // Get user details
  fastify.get('/:id', {
    schema: {
      description: 'Get user details',
      tags: ['Admin - Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                display_name: { type: 'string' },
                first_name: { type: 'string', nullable: true },
                last_name: { type: 'string', nullable: true },
                email: { type: 'string', format: 'email' },
                role: { type: 'string' },
                avatar_url: { type: 'string', nullable: true },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                profile: {
                  type: 'object',
                  properties: {
                    bio: { type: 'string', nullable: true },
                    interests: { 
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                },
                preferences: {
                  type: 'object',
                  properties: {
                    language: { type: 'string' },
                    theme: { type: 'string' }
                  }
                },
                notifications: {
                  type: 'object',
                  properties: {
                    email: {
                      type: 'object',
                      properties: {
                        enabled: { type: 'boolean' },
                        useCustomEmail: { type: 'boolean' },
                        customEmail: { type: 'string', nullable: true },
                        digestTime: { type: 'string' }
                      }
                    }
                  }
                },
                subscriptions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      type_id: { type: 'string' },
                      type_name: { type: 'string' },
                      active: { type: 'boolean' },
                      created_at: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, userAdminController.getUserDetails);
  
  // Activate/deactivate user (set role to 'user' or 'inactive')
  fastify.post('/:id/set-status', {
    schema: {
      description: 'Change user status',
      tags: ['Admin - Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] }
        },
        required: ['status']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, userAdminController.setUserStatus);
  
  // Set user role
  fastify.post('/:id/set-role', {
    schema: {
      description: 'Set user role',
      tags: ['Admin - Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['user', 'admin'] }
        },
        required: ['role']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, userAdminController.setUserRole);
  
  // Reset user password
  fastify.post('/:id/reset-password', {
    schema: {
      description: 'Generate password reset link for a user',
      tags: ['Admin - Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, userAdminController.resetUserPassword);
  
  // Search users
  fastify.get('/search', {
    schema: {
      description: 'Search for users by name or email',
      tags: ['Admin - Users'],
      querystring: {
        type: 'object',
        properties: {
          term: { type: 'string', minLength: 2 },
          field: { type: 'string', enum: ['display_name', 'email', 'both'], default: 'both' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        },
        required: ['term']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  display_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' },
                has_next: { type: 'boolean' },
                has_prev: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, userAdminController.searchUsers);
}
```

## 6. Controller Implementation

Example user admin controller implementation matching the database schema:

```javascript
// File: src/core/admin/interfaces/http/user-admin.controller.js

import { query } from '../../../../infrastructure/database/client.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { logger } from '../../../../shared/logging/logger.js';
import { getFirebaseAuth } from '../../../../infrastructure/firebase/admin.js';

export const userAdminController = {
  /**
   * Get paginated list of users
   */
  async getUsers(request, reply) {
    const context = {
      requestId: request.id,
      userId: request.user?.id,
      adminRole: request.admin?.role
    };
    
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc' } = request.query;
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Sort column validation (prevents SQL injection)
      const validColumns = ['display_name', 'email', 'created_at', 'role', 'updated_at'];
      const sortColumn = validColumns.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Get users from database
      const usersResult = await query(
        `SELECT 
           u.id, 
           u.display_name, 
           u.email, 
           u.role,
           u.avatar_url,
           u.created_at,
           u.updated_at,
           (SELECT COUNT(*) FROM subscriptions WHERE user_id = u.id) as subscription_count,
           (SELECT COUNT(*) FROM notifications WHERE user_id = u.id) as notification_count
         FROM users u
         ORDER BY ${sortColumn} ${sortDirection}
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      // Get total count
      const countResult = await query('SELECT COUNT(*) as total FROM users', []);
      const total = parseInt(countResult.rows[0].total, 10);
      
      // Calculate pagination metadata
      const pages = Math.ceil(total / limit);
      
      logger.info(context, 'Admin retrieved users list', {
        page,
        limit,
        sort_by,
        sort_order,
        userCount: usersResult.rows.length,
        total
      });
      
      return {
        users: usersResult.rows,
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      logger.error(context, 'Error getting users list', { error: error.message });
      
      throw new AppError('INTERNAL_ERROR', 'Failed to retrieve users list', 500);
    }
  },
  
  /**
   * Get user details
   */
  async getUserDetails(request, reply) {
    const context = {
      requestId: request.id,
      userId: request.user?.id,
      adminRole: request.admin?.role,
      targetUserId: request.params.id
    };
    
    try {
      const userId = request.params.id;
      
      // Get user from database
      const userResult = await query(
        `SELECT 
           u.id, 
           u.display_name,
           u.first_name,
           u.last_name,
           u.email, 
           u.role,
           u.avatar_url,
           u.created_at,
           u.updated_at,
           u.metadata
         FROM users u
         WHERE u.id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new AppError('NOT_FOUND', `User with ID ${userId} not found`, 404);
      }
      
      // Get user subscriptions
      const subscriptionsResult = await query(
        `SELECT 
           s.id, 
           s.name,
           s.type_id,
           st.name as type_name,
           s.active, 
           s.created_at
         FROM subscriptions s
         JOIN subscription_types st ON s.type_id = st.id
         WHERE s.user_id = $1
         ORDER BY s.created_at DESC`,
        [userId]
      );
      
      // Extract profile information from metadata
      const user = userResult.rows[0];
      const metadata = user.metadata || {};
      
      // Extract relevant metadata fields based on the schema structure
      const profile = metadata.profile || { bio: "", interests: [] };
      const preferences = metadata.preferences || { language: "es", theme: "light" };
      const notifications = metadata.notifications || { 
        email: { enabled: true, useCustomEmail: false, customEmail: null, digestTime: "08:00" }
      };
      
      logger.info(context, 'Admin retrieved user details', { userId });
      
      return {
        user: {
          id: user.id,
          display_name: user.display_name,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
          profile,
          preferences,
          notifications,
          subscriptions: subscriptionsResult.rows
        }
      };
    } catch (error) {
      logger.error(context, 'Error getting user details', { error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('INTERNAL_ERROR', 'Failed to retrieve user details', 500);
    }
  },
  
  /**
   * Set user status (active/inactive)
   */
  async setUserStatus(request, reply) {
    const context = {
      requestId: request.id,
      userId: request.user?.id,
      adminRole: request.admin?.role,
      targetUserId: request.params.id
    };
    
    try {
      const userId = request.params.id;
      const { status } = request.body;
      
      // Check if user exists
      const userResult = await query(
        'SELECT id, role FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new AppError('NOT_FOUND', `User with ID ${userId} not found`, 404);
      }
      
      // Prevent self-deactivation
      if (userId === request.user.id && status === 'inactive') {
        throw new AppError('FORBIDDEN', 'You cannot deactivate your own account', 403);
      }
      
      // Set active property in metadata
      await query(
        `UPDATE users 
         SET role = CASE WHEN $2 = 'active' THEN 'user' ELSE 'inactive' END,
             updated_at = NOW() 
         WHERE id = $1`,
        [userId, status]
      );
      
      const statusMessage = status === 'active' ? 'activated' : 'deactivated';
      logger.info(context, `Admin ${statusMessage} user`, { userId, status });
      
      return {
        success: true,
        message: `User ${userId} has been ${statusMessage}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(context, 'Error setting user status', { error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('INTERNAL_ERROR', 'Failed to update user status', 500);
    }
  },
  
  /**
   * Set user role
   */
  async setUserRole(request, reply) {
    const context = {
      requestId: request.id,
      userId: request.user?.id,
      adminRole: request.admin?.role,
      targetUserId: request.params.id
    };
    
    try {
      const userId = request.params.id;
      const { role } = request.body;
      
      // Check if user exists
      const userResult = await query(
        'SELECT id, role FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new AppError('NOT_FOUND', `User with ID ${userId} not found`, 404);
      }
      
      // Prevent self-role-change
      if (userId === request.user.id) {
        throw new AppError('FORBIDDEN', 'You cannot change your own role', 403);
      }
      
      // Update user role
      await query(
        `UPDATE users 
         SET role = $2,
             updated_at = NOW() 
         WHERE id = $1`,
        [userId, role]
      );
      
      logger.info(context, `Admin changed user role`, { userId, role });
      
      return {
        success: true,
        message: `User ${userId} role changed to ${role}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(context, 'Error setting user role', { error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('INTERNAL_ERROR', 'Failed to update user role', 500);
    }
  },
  
  /**
   * Reset user password
   */
  async resetUserPassword(request, reply) {
    const context = {
      requestId: request.id,
      userId: request.user?.id,
      adminRole: request.admin?.role,
      targetUserId: request.params.id
    };
    
    try {
      const userId = request.params.id;
      
      // Check if user exists
      const userResult = await query(
        'SELECT id, email FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new AppError('NOT_FOUND', `User with ID ${userId} not found`, 404);
      }
      
      const userEmail = userResult.rows[0].email;
      
      // Get Firebase Auth instance
      const auth = getFirebaseAuth();
      
      // Generate password reset link
      const resetLink = await auth.generatePasswordResetLink(userEmail);
      
      logger.info(context, 'Admin generated password reset for user', { 
        userId, 
        userEmail: userEmail 
      });
      
      return {
        success: true,
        message: `Password reset link generated for user ${userId}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(context, 'Error generating password reset', { error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('INTERNAL_ERROR', 'Failed to generate password reset', 500);
    }
  },
  
  /**
   * Search users
   */
  async searchUsers(request, reply) {
    const context = {
      requestId: request.id,
      userId: request.user?.id,
      adminRole: request.admin?.role
    };
    
    try {
      const { term, field = 'both', page = 1, limit = 20 } = request.query;
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Build search query based on field
      let whereClause = '';
      const params = [`%${term}%`, limit, offset];
      
      if (field === 'display_name') {
        whereClause = 'WHERE display_name ILIKE $1';
      } else if (field === 'email') {
        whereClause = 'WHERE email ILIKE $1';
      } else {
        // Default to 'both'
        whereClause = 'WHERE display_name ILIKE $1 OR email ILIKE $1';
      }
      
      // Get users from database
      const usersResult = await query(
        `SELECT 
           u.id, 
           u.display_name, 
           u.email, 
           u.role,
           u.created_at
         FROM users u
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $2 OFFSET $3`,
        params
      );
      
      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total 
         FROM users u
         ${whereClause}`,
        [params[0]]
      );
      
      const total = parseInt(countResult.rows[0].total, 10);
      
      // Calculate pagination metadata
      const pages = Math.ceil(total / limit);
      
      logger.info(context, 'Admin searched users', {
        term,
        field,
        page,
        limit,
        userCount: usersResult.rows.length,
        total
      });
      
      return {
        users: usersResult.rows,
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      logger.error(context, 'Error searching users', { error: error.message });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('INTERNAL_ERROR', 'Failed to search users', 500);
    }
  }
};
```

## 7. Integration with Main Application

To integrate the admin routes with the main application, we'll modify the main index.js file:

```javascript
// Modified section in src/index.js

// Register all admin routes under /api/v1/admin
await fastify.register(async (instance) => {
  // Import admin routes
  const { adminRoutes } = await import('./interfaces/http/routes/admin/index.js');
  
  // Register admin routes
  await instance.register(adminRoutes);
}, { prefix: '/api/v1/admin' });
```

## 8. Security Considerations

The implementation includes these basic security measures:

1. **Authentication**: Using Firebase authentication to verify user identity
2. **Authorization**: Checking the user's role in the database (must be 'admin')
3. **Input Validation**: All request inputs validated through Fastify schema validation
4. **SQL Injection Protection**: Using parameterized queries and column validation for all database access
5. **Error Handling**: Custom error responses with helpful instructions
6. **Preventive Measures**: Preventing self-role-modification for admins

## 9. Deployment Approach

The admin backend will be deployed using the existing Cloud Run setup. Key points:

1. **User Role**: Use the existing `role` field in the users table for admin access control
2. **Monitoring**: Use existing monitoring tools to track admin operations
3. **Logging**: Enhanced logging for admin operations with appropriate context

## 10. Avoiding Schema Conflicts

To avoid conflicts between the admin functionality and the regular application:

1. **No Schema Changes**: The implementation uses the existing database schema without modification
2. **Field Reuse**: Using the built-in `role` field for admin access control
3. **Consistent Naming**: All field names match the existing schema names
4. **JSONB Metadata**: Using the existing JSONB metadata structure for user profiles/preferences
5. **API Consistency**: Admin API routes follow the same patterns as regular API routes
6. **Data Integrity**: No direct manipulation of sensitive data structures that might break the application
7. **Separate Routing**: Admin routes are isolated under their own prefix (/api/v1/admin)

## Conclusion

This implementation plan provides a technical blueprint for adding admin backend functionality to the NIFYA application while respecting the existing database schema. By leveraging the current fields (like `role` for admin identification) and implementing functionality at the API level, we avoid schema conflicts and maintain compatibility with the regular application. 