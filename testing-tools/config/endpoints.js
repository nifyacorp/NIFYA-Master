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
    subscriptions: {
      list: '/api/v1/subscriptions',
      create: '/api/v1/subscriptions',
      detail: (id) => `/api/v1/subscriptions/${id}`,
      process: (id) => `/api/v1/subscriptions/${id}/process`,
      status: (id) => `/api/v1/subscriptions/${id}/status`,
      delete: (id) => `/api/v1/subscriptions/${id}`
    },
    notifications: {
      list: '/api/v1/notifications',
      forSubscription: (subId) => `/api/v1/notifications?subscriptionId=${subId}`
    },
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
    templates: {
      list: '/api/v1/templates',
      types: '/api/v1/subscription-types'
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
      prompts: ["Ayuntamiento Barcelona licitaciones"],
      frequency: "daily"
    }
  }
};