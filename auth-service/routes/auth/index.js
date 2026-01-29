/**
 * routes/auth/index.js - Auth Domain Router
 * 
 * Aggregates all authentication-related routes:
 * - Core Auth: Login, logout, callback, token refresh, user info
 * - Account: Session management, security settings, 2FA, connected accounts
 * 
 * Mount point: /auth
 * 
 * Sub-routes:
 * - /auth/login/:client - OAuth login initiation
 * - /auth/callback/:client - OAuth callback
 * - /auth/logout/:client - Logout
 * - /auth/refresh/:client - Token refresh
 * - /auth/me - Current user info
 * - /auth/onboarding-status - Onboarding status check
 * - /auth/account/* - Account management routes
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');

// Mount core auth routes at /auth/*
// These include: login, callback, logout, refresh, me, onboarding-status, etc.
router.use('/', authRoutes);

// Mount account routes at /auth/account/*
router.use('/account', accountRoutes);

module.exports = router;
