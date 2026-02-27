/**
 * routes/organizations/index.js - Organizations Domain Router
 * 
 * Aggregates all organization-related routes:
 * - CRUD: Organization create, read, update, delete operations
 * - Memberships: Organization membership management
 * - Onboarding: Self-service organization creation and invitation flows
 * 
 * Mount points:
 * - /auth/organizations (CRUD)
 * - /organization-memberships (Memberships)
 * - /org-onboarding (Onboarding)
 */

const crudRouter = require('./organizations.routes');
const membershipsRouter = require('./memberships.routes');
const onboardingRouter = require('./onboarding.routes');

// Export individual routers for flexible mounting
module.exports = {
    crud: crudRouter,
    memberships: membershipsRouter,
    onboarding: onboardingRouter
};
