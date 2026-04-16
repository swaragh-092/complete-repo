/**
 * Authorization Module Entry Point
 * 
 * Exports the core components of the authorization system.
 */

const AuthorizationService = require('./engine/access-control');
const PolicyEngine = require('./engine/policy-engine');
const RelationshipGraph = require('./engine/relationship-graph');
const middleware = require('./middleware');

module.exports = {
    AuthorizationService,
    PolicyEngine,
    RelationshipGraph,
    middleware,
};
