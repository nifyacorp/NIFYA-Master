/**
 * NIFYA API Endpoint Configuration
 * 
 * This module provides the configuration for all NIFYA API endpoints
 * used in testing and debugging.
 */

module.exports = {
  // Authentication Service endpoints
  auth: {
    baseUrl: 'authentication-service-415554190254.us-central1.run.app',
    login: '/api/auth/login',
    testLogin: '/api/auth/login/test',
    profile: '/api/auth/me',
    sessions: '/api/auth/sessions',
    revokeSessions: '/api/auth/revoke-all-sessions'
  },
  
  // Backend Service endpoints
  backend: {
    baseUrl: 'backend-415554190254.us-central1.run.app',
    health: '/health',
    diagnostics: '/api/diagnostics',
    dbStatus: '/api/diagnostics/db-status',
    dbTables: '/api/diagnostics/db-tables',
    dbInfo: '/api/diagnostics/db-info',
    
    // Subscription endpoints
    subscriptions: {
      list: '/api/v1/subscriptions',
      create: '/api/v1/subscriptions',
      detail: (id) => `/api/v1/subscriptions/${id}`,
      process: (id) => `/api/v1/subscriptions/${id}/process`,
      processAlt: (id) => `/api/v1/subscriptions/process/${id}`,
      status: (id) => `/api/v1/subscriptions/${id}/status`,
      update: (id) => `/api/v1/subscriptions/${id}`,
      toggle: (id) => `/api/v1/subscriptions/${id}/toggle`,
      delete: (id) => `/api/v1/subscriptions/${id}`,
      share: (id) => `/api/v1/subscriptions/${id}/share`,
      removeSharing: (id) => `/api/v1/subscriptions/${id}/share`,
      types: '/api/v1/subscriptions/types',
      createType: '/api/v1/subscriptions/types'
    },
    
    // Notification endpoints
    notifications: {
      list: '/api/v1/notifications',
      activity: '/api/v1/notifications/activity',
      stats: '/api/v1/notifications/stats',
      markAsRead: (id) => `/api/v1/notifications/${id}/read`,
      delete: (id) => `/api/v1/notifications/${id}`,
      deleteAll: '/api/v1/notifications/delete-all',
      readAll: '/api/v1/notifications/read-all',
      realtime: '/api/v1/notifications/realtime',
      forSubscription: (subId) => `/api/v1/notifications?subscriptionId=${subId}`,
      markSent: '/api/v1/notifications/mark-sent',
      createTest: '/api/v1/notifications/create-test',
      byUserId: (userId) => `/api/v1/notifications/${userId}`
    },
    
    // User endpoints
    user: {
      profile: '/api/v1/me',
      updateProfile: '/api/v1/me',
      notificationSettings: '/api/v1/me/notification-settings',
      emailPreferences: '/api/v1/me/email-preferences',
      testEmail: '/api/v1/me/test-email',
      exists: (userId) => `/api/v1/user-exists/${userId}`,
      create: '/api/v1/create-user'
    },
    
    // Template endpoints
    templates: {
      list: '/api/v1/templates',
      detail: (id) => `/api/v1/templates/${id}`,
      create: '/api/v1/templates',
      subscribe: (id) => `/api/v1/templates/${id}/subscribe`
    },
    
    // Explorer endpoints
    explorer: {
      list: '/api/v1/explorer',
      detail: (path) => `/api/v1/explorer/${path}`
    },
    
    // Debug endpoints
    debug: {
      notification: (id) => `/debug/notification/${id}`,
      subscription: (id) => `/debug/subscription/${id}`,
      health: '/debug/health',
      resendNotification: (id) => `/debug/notification/${id}/resend`
    },
    
    // Legacy API endpoints
    legacySubscriptions: {
      list: '/api/subscriptions',
      create: '/api/subscriptions',
      detail: (id) => `/api/subscriptions/${id}`,
      process: (id) => `/api/subscriptions/${id}/process`,
      status: (id) => `/api/subscriptions/${id}/status`,
      delete: (id) => `/api/subscriptions/${id}`
    },
    legacyNotifications: {
      list: '/api/notifications',
      forSubscription: (subId) => `/api/notifications?subscriptionId=${subId}`
    },
    
    logs: '/api/diagnostic/logs'
  },
  
  // Worker Service endpoints
  subscriptionWorker: {
    baseUrl: 'subscription-worker-415554190254.us-central1.run.app',
    health: '/health',
    process: '/api/subscriptions/process',
    pending: '/api/subscriptions/pending'
  },
  
  // Email notification service endpoints
  emailNotificationService: {
    baseUrl: 'email-notification-service-415554190254.us-central1.run.app',
    health: '/health',
    status: '/api/status',
    sendTest: '/api/email/test',
    process: '/api/email/process',
    daily: '/api/email/daily'
  },
  
  // Test data
  testData: {
    login: {
      email: "ratonxi@gmail.com",
      password: "nifyaCorp12!"
    },
    boeSubscription: {
      name: "Test BOE Subscription",
      type: "boe",
      templateId: "boe-default",
      prompts: { value: "Ayuntamiento Barcelona licitaciones" },
      frequency: "daily",
      configuration: {},
      logo: null
    }
  },

  // Comprehensive endpoint list
  comprehensiveEndpoints: [
    // Health and diagnostics
    { 
      name: 'Health Check', 
      path: '/health', 
      method: 'GET', 
      auth: false, 
      category: 'infrastructure' 
    },
    { 
      name: 'API Diagnostics', 
      path: '/api/diagnostics', 
      method: 'GET', 
      auth: true, 
      category: 'diagnostics' 
    },
    { 
      name: 'Database Status', 
      path: '/api/diagnostics/db-status', 
      method: 'GET', 
      auth: true, 
      category: 'diagnostics' 
    },
    { 
      name: 'Database Tables', 
      path: '/api/diagnostics/db-tables', 
      method: 'GET', 
      auth: true, 
      category: 'diagnostics' 
    },
    
    // Authentication
    { 
      name: 'Test Login', 
      path: '/api/auth/login/test', 
      method: 'POST', 
      auth: false, 
      category: 'authentication',
      service: 'auth'
    },
    
    // Notifications
    { 
      name: 'List Notifications', 
      path: '/api/v1/notifications', 
      method: 'GET', 
      auth: true, 
      category: 'notifications' 
    },
    { 
      name: 'Notification Activity', 
      path: '/api/v1/notifications/activity', 
      method: 'GET', 
      auth: true, 
      category: 'notifications' 
    },
    { 
      name: 'Notification Stats', 
      path: '/api/v1/notifications/stats', 
      method: 'GET', 
      auth: true, 
      category: 'notifications' 
    },
    { 
      name: 'Mark All As Read', 
      path: '/api/v1/notifications/read-all', 
      method: 'POST', 
      auth: true, 
      category: 'notifications' 
    },
    { 
      name: 'Create Test Notification', 
      path: '/api/v1/notifications/create-test', 
      method: 'POST', 
      auth: false, 
      category: 'notifications',
      testOnly: true
    },
    
    // Subscriptions
    { 
      name: 'List Subscriptions', 
      path: '/api/v1/subscriptions', 
      method: 'GET', 
      auth: true, 
      category: 'subscriptions' 
    },
    { 
      name: 'Create Subscription', 
      path: '/api/v1/subscriptions', 
      method: 'POST', 
      auth: true, 
      category: 'subscriptions' 
    },
    { 
      name: 'Subscription Types', 
      path: '/api/v1/subscriptions/types', 
      method: 'GET', 
      auth: false, 
      category: 'subscriptions' 
    },
    
    // Templates
    { 
      name: 'List Templates', 
      path: '/api/v1/templates', 
      method: 'GET', 
      auth: false, 
      category: 'templates' 
    },
    
    // User
    { 
      name: 'User Profile', 
      path: '/api/v1/me', 
      method: 'GET', 
      auth: true, 
      category: 'user' 
    },
    { 
      name: 'Email Preferences', 
      path: '/api/v1/me/email-preferences', 
      method: 'GET', 
      auth: true, 
      category: 'user' 
    }
  ]
};