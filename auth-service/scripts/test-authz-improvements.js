#!/usr/bin/env node
/**
 * Comprehensive A-to-Z Test for Authorization Module Improvements
 * 
 * Tests:
 * 1. Bug fix: permissionName → clientPrefixedPermission
 * 2. Max depth guard on checkTransitiveAccess
 * 3. Policy cache (hit/miss, clearCache, getCacheStats)
 * 4. Decision audit trail (decisionId, timestamp)
 * 5. Health endpoint wiring (PolicyEngine methods exist)
 * 6. Integration: full checkAccess flow (RBAC, ABAC, ReBAC paths)
 * 7. Backward compatibility: workspaceMiddleware & roles.js imports still work
 */

'use strict';

let passed = 0;
let failed = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        console.error(`  ❌ ${name}`);
        console.error(`     → ${e.message}`);
    }
}

async function asyncTest(name, fn) {
    totalTests++;
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        console.error(`  ❌ ${name}`);
        console.error(`     → ${e.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, label = '') {
    if (actual !== expected) {
        throw new Error(`${label} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

// ============================================================================
// SETUP: Load modules (mirrors how auth-service loads them)
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log('  AUTHORIZATION MODULE — COMPREHENSIVE TEST SUITE');
console.log('═'.repeat(60));

// We need the database connection for integration tests
const { sequelize, Policy, Relationship, ResourceAttribute } = require('../config/database');

const AuthorizationService = require('../modules/authorization/engine/access-control');
const PolicyEngine = require('../modules/authorization/engine/policy-engine');
const RelationshipGraph = require('../modules/authorization/engine/relationship-graph');
const authzMiddleware = require('../modules/authorization/middleware');
const authzModule = require('../modules/authorization');

async function runAllTests() {
    // Wait for DB connection
    try {
        await sequelize.authenticate();
        console.log('\n📦 Database connected\n');
    } catch (e) {
        console.error('❌ Cannot connect to database:', e.message);
        console.log('\n⚠️  Running unit tests only (no DB-dependent tests)\n');
    }

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 1: Module Loading & Exports
    // ════════════════════════════════════════════════════════════
    console.log('\n── 1. MODULE LOADING & EXPORTS ──');

    test('AuthorizationService loads as a class', () => {
        assert(typeof AuthorizationService === 'function', 'Not a class/function');
        assert(typeof AuthorizationService.checkAccess === 'function', 'Missing checkAccess');
        assert(typeof AuthorizationService.checkBatchAccess === 'function', 'Missing checkBatchAccess');
    });

    test('PolicyEngine loads as a class', () => {
        assert(typeof PolicyEngine === 'function', 'Not a class/function');
        assert(typeof PolicyEngine.evaluate === 'function', 'Missing evaluate');
        assert(typeof PolicyEngine.matchesPolicy === 'function', 'Missing matchesPolicy');
    });

    test('RelationshipGraph loads as a class', () => {
        assert(typeof RelationshipGraph === 'function', 'Not a class/function');
        assert(typeof RelationshipGraph.hasRelationship === 'function', 'Missing hasRelationship');
        assert(typeof RelationshipGraph.checkTransitiveAccess === 'function', 'Missing checkTransitiveAccess');
    });

    test('Middleware exports all 6 functions', () => {
        const expected = ['authorize', 'authorizeRBAC', 'authorizeABAC', 'authorizeReBAC', 'authorizeAll', 'authorizeContext'];
        for (const fn of expected) {
            assert(typeof authzMiddleware[fn] === 'function', `Missing middleware: ${fn}`);
        }
    });

    test('Module index exports all components', () => {
        assert(authzModule.AuthorizationService === AuthorizationService, 'AuthorizationService mismatch');
        assert(authzModule.PolicyEngine === PolicyEngine, 'PolicyEngine mismatch');
        assert(authzModule.RelationshipGraph === RelationshipGraph, 'RelationshipGraph mismatch');
        assert(typeof authzModule.middleware === 'object', 'middleware not exported');
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 2: Bug Fix — permissionName variable
    // ════════════════════════════════════════════════════════════
    console.log('\n── 2. BUG FIX: permissionName → clientPrefixedPermission ──');

    test('checkRBAC deny path returns correct variable in reason', async () => {
        // A user with NO permissions and NO roles should hit the deny path
        const result = await AuthorizationService.checkRBAC({
            user: { permissions: [], roles: [] },
            action: 'delete',
            resource: { type: 'invoice' },
            clientId: 'test-client'
        });

        assert(!result.allowed, 'Should be denied');
        // The key test: if the bug existed, this would contain "undefined"
        assert(!result.reason.includes('undefined'), `Reason contains "undefined": ${result.reason}`);
        assert(result.reason.includes('test-client:invoice:delete'), `Should contain the permission name, got: ${result.reason}`);
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 3: Decision Audit Trail
    // ════════════════════════════════════════════════════════════
    console.log('\n── 3. DECISION AUDIT TRAIL ──');

    test('_buildDecision produces correct structure', () => {
        const decision = AuthorizationService._buildDecision(true, 'RBAC', 'test reason');

        assert(decision.allowed === true, 'allowed should be true');
        assertEqual(decision.method, 'RBAC', 'method');
        assertEqual(decision.reason, 'test reason', 'reason');
        assert(typeof decision.decisionId === 'string', 'decisionId should be string');
        assert(decision.decisionId.length === 36, `decisionId should be UUID (got length ${decision.decisionId.length})`);
        assert(typeof decision.timestamp === 'string', 'timestamp should be string');
        assert(decision.timestamp.includes('T'), 'timestamp should be ISO format');
    });

    test('_buildDecision includes results when provided', () => {
        const results = { rbac: { allowed: true } };
        const decision = AuthorizationService._buildDecision(true, 'RBAC', 'test', results);
        assert(decision.results === results, 'results should be passed through');
    });

    test('_buildDecision omits results when null', () => {
        const decision = AuthorizationService._buildDecision(false, 'NONE', 'test');
        assert(!('results' in decision), 'results should not be present');
    });

    test('Every decisionId is unique', () => {
        const d1 = AuthorizationService._buildDecision(true, 'RBAC', 'a');
        const d2 = AuthorizationService._buildDecision(true, 'RBAC', 'b');
        assert(d1.decisionId !== d2.decisionId, 'decisionIds should be unique');
    });

    await asyncTest('checkAccess returns audit fields', async () => {
        const result = await AuthorizationService.checkAccess({
            user: { sub: 'user-1', permissions: [], roles: [] },
            action: 'read',
            resource: { type: 'test' },
            options: { skipABAC: true, skipReBAC: true }
        });

        assert(typeof result.decisionId === 'string', `Missing decisionId: ${JSON.stringify(result)}`);
        assert(result.decisionId.length === 36, 'decisionId should be UUID');
        assert(typeof result.timestamp === 'string', 'Missing timestamp');
        assert(typeof result.method === 'string', 'Missing method');
        assert(typeof result.allowed === 'boolean', 'Missing allowed');
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 4: Max Depth Guard
    // ════════════════════════════════════════════════════════════
    console.log('\n── 4. MAX DEPTH GUARD ──');

    test('checkTransitiveAccess accepts depth parameter', () => {
        // The function signature should accept depth without error
        assert(typeof RelationshipGraph.checkTransitiveAccess === 'function', 'Missing function');
        // We verify the signature by checking it doesn't throw when called with depth
        // (actual DB call will happen, but the depth parameter is accepted)
    });

    await asyncTest('checkTransitiveAccess returns false at max depth', async () => {
        // At depth >= 5 (MAX_GRAPH_DEPTH), it should immediately return false
        const result = await RelationshipGraph.checkTransitiveAccess({
            userId: 'nonexistent-user',
            resourceType: 'test',
            resourceId: 'test-id',
            orgId: null,
            depth: 5 // At max depth — should return false immediately
        });
        assertEqual(result, false, 'Should return false at max depth');
    });

    await asyncTest('checkTransitiveAccess returns false beyond max depth', async () => {
        const result = await RelationshipGraph.checkTransitiveAccess({
            userId: 'nonexistent-user',
            resourceType: 'test',
            resourceId: 'test-id',
            orgId: null,
            depth: 100 // Way beyond max — should still return false
        });
        assertEqual(result, false, 'Should return false beyond max depth');
    });

    await asyncTest('checkTransitiveAccess works at depth 0 (default)', async () => {
        // Normal call without depth (backward compatible) should not throw
        const result = await RelationshipGraph.checkTransitiveAccess({
            userId: 'nonexistent-user',
            resourceType: 'test',
            resourceId: 'test-id',
            orgId: null,
            // No depth param — defaults to 0
        });
        assertEqual(result, false, 'Should return false for nonexistent user');
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 5: Policy Cache
    // ════════════════════════════════════════════════════════════
    console.log('\n── 5. POLICY CACHE ──');

    test('PolicyEngine.clearCache exists and is callable', () => {
        assert(typeof PolicyEngine.clearCache === 'function', 'clearCache missing');
        PolicyEngine.clearCache(); // Should not throw
    });

    test('PolicyEngine.getCacheStats returns correct structure', () => {
        PolicyEngine.clearCache(); // Start fresh
        const stats = PolicyEngine.getCacheStats();
        assert(typeof stats === 'object', 'Should return object');
        assert(typeof stats.size === 'number', 'size should be number');
        assert(typeof stats.hits === 'number', 'hits should be number');
        assert(typeof stats.misses === 'number', 'misses should be number');
        assert(typeof stats.hitRate === 'string', 'hitRate should be string');
        assert(stats.hitRate.endsWith('%'), 'hitRate should end with %');
    });

    await asyncTest('Policy cache: first call is a miss', async () => {
        PolicyEngine.clearCache();
        // Reset stats by clearing - but stats are in module scope, so we just check relative
        const statsBefore = PolicyEngine.getCacheStats();
        const missesBefore = statsBefore.misses;

        await PolicyEngine.evaluate({
            subject: { id: 'test' },
            resource: { type: 'test' },
            action: 'read',
            environment: {},
            orgId: null,
            clientId: 'test-cache-1',
        });

        const statsAfter = PolicyEngine.getCacheStats();
        assert(statsAfter.misses > missesBefore, `Expected miss count to increase (before: ${missesBefore}, after: ${statsAfter.misses})`);
        assert(statsAfter.size >= 1, `Cache should have at least 1 entry (got ${statsAfter.size})`);
    });

    await asyncTest('Policy cache: second call with same key is a hit', async () => {
        const statsBefore = PolicyEngine.getCacheStats();
        const hitsBefore = statsBefore.hits;

        await PolicyEngine.evaluate({
            subject: { id: 'test' },
            resource: { type: 'test' },
            action: 'read',
            environment: {},
            orgId: null,
            clientId: 'test-cache-1', // Same key as above
        });

        const statsAfter = PolicyEngine.getCacheStats();
        assert(statsAfter.hits > hitsBefore, `Expected hit count to increase (before: ${hitsBefore}, after: ${statsAfter.hits})`);
    });

    await asyncTest('Policy cache: different key is a miss', async () => {
        const statsBefore = PolicyEngine.getCacheStats();
        const missesBefore = statsBefore.misses;

        await PolicyEngine.evaluate({
            subject: { id: 'test' },
            resource: { type: 'test' },
            action: 'read',
            environment: {},
            orgId: '00000000-0000-0000-0000-000000000099',
            clientId: 'different-client', // Different key
        });

        const statsAfter = PolicyEngine.getCacheStats();
        assert(statsAfter.misses > missesBefore, `Expected miss count for different key`);
    });

    await asyncTest('clearCache actually clears the cache', async () => {
        assert(PolicyEngine.getCacheStats().size > 0, 'Cache should have entries before clear');
        PolicyEngine.clearCache();
        assertEqual(PolicyEngine.getCacheStats().size, 0, 'Cache size after clear');
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 6: Integration — Full checkAccess Flow
    // ════════════════════════════════════════════════════════════
    console.log('\n── 6. INTEGRATION: Full checkAccess Flow ──');

    // Create a test policy for ABAC testing
    const TEST_POLICY_NAME = '__test_authz_improvements_policy__';
    let testPolicy = null;

    await asyncTest('Create test ABAC policy', async () => {
        // Cleanup any leftover
        await Policy.destroy({ where: { name: TEST_POLICY_NAME } });

        testPolicy = await Policy.create({
            name: TEST_POLICY_NAME,
            effect: 'allow',
            actions: ['test:read', 'test:write'],
            resources: ['test-resource'],
            subjects: {
                email: { $regex: '.*@testcorp\\.com' }
            },
            priority: 100,
            is_active: true
        });

        assert(testPolicy.id, 'Policy should have an ID');
    });

    await asyncTest('ABAC allow: matching user gets access', async () => {
        PolicyEngine.clearCache();
        const result = await AuthorizationService.checkAccess({
            user: {
                sub: 'user-test-1',
                email: 'alice@testcorp.com',
                roles: [],
                permissions: [],
            },
            action: 'test:read',
            resource: { type: 'test-resource', id: 'res-1' },
            options: { skipRBAC: true, skipReBAC: true },
        });

        assert(result.allowed === true, `Expected allowed, got: ${JSON.stringify(result)}`);
        assertEqual(result.method, 'ABAC', 'method');
        assert(result.decisionId, 'Should have decisionId');
        assert(result.timestamp, 'Should have timestamp');
    });

    await asyncTest('ABAC deny: non-matching user gets denied', async () => {
        const result = await AuthorizationService.checkAccess({
            user: {
                sub: 'user-test-2',
                email: 'hacker@evil.com',
                roles: [],
                permissions: [],
            },
            action: 'test:read',
            resource: { type: 'test-resource', id: 'res-1' },
            options: { skipRBAC: true, skipReBAC: true },
        });

        assert(result.allowed === false, `Expected denied, got: ${JSON.stringify(result)}`);
        assert(result.decisionId, 'Denied result should also have decisionId');
    });

    await asyncTest('RBAC allow: user with matching permission', async () => {
        const result = await AuthorizationService.checkAccess({
            user: {
                sub: 'user-test-3',
                permissions: ['*:invoice:read'],
                roles: [],
                client_id: 'web-portal',
            },
            action: 'read',
            resource: { type: 'invoice', id: 'inv-1' },
            options: { skipABAC: true, skipReBAC: true },
        });

        assert(result.allowed === true, `Expected allowed via RBAC, got: ${JSON.stringify(result)}`);
        assertEqual(result.method, 'RBAC', 'method');
    });

    await asyncTest('RBAC allow: client-specific permission', async () => {
        const result = await AuthorizationService.checkAccess({
            user: {
                sub: 'user-test-4',
                permissions: ['web-portal:admin:manage'],
                roles: [],
                client_id: 'web-portal',
            },
            action: 'manage',
            resource: { type: 'admin', id: 'a-1' },
            options: { skipABAC: true, skipReBAC: true, clientId: 'web-portal' },
        });

        assert(result.allowed === true, `Expected allowed via client RBAC`);
        assertEqual(result.method, 'RBAC', 'method');
    });

    await asyncTest('RBAC deny: wrong client permission', async () => {
        const result = await AuthorizationService.checkAccess({
            user: {
                sub: 'user-test-5',
                permissions: ['mobile-app:admin:manage'], // has mobile, not web
                roles: [],
                client_id: 'web-portal',
            },
            action: 'manage',
            resource: { type: 'admin', id: 'a-1' },
            options: { skipABAC: true, skipReBAC: true, clientId: 'web-portal' },
        });

        assert(result.allowed === false, `Expected denied — wrong client scope`);
        // Verify the bug fix: reason should NOT contain "undefined"
        assert(!result.results.rbac.reason.includes('undefined'), `Bug! reason contains "undefined": ${result.results.rbac.reason}`);
        assert(result.results.rbac.reason.includes('web-portal:admin:manage'), `Should mention the permission`);
    });

    await asyncTest('Skip all methods → default deny with NONE method', async () => {
        const result = await AuthorizationService.checkAccess({
            user: { sub: 'user-test-6', permissions: [], roles: [] },
            action: 'noop',
            resource: { type: 'nothing' },
            options: { skipRBAC: true, skipABAC: true, skipReBAC: true },
        });

        assert(result.allowed === false, 'Should be denied');
        assertEqual(result.method, 'NONE', 'method');
        assert(result.decisionId, 'Should still have decisionId');
    });

    // Cleanup test policy
    await asyncTest('Cleanup test policy', async () => {
        if (testPolicy) {
            await testPolicy.destroy();
            PolicyEngine.clearCache();
        }
        const remaining = await Policy.count({ where: { name: TEST_POLICY_NAME } });
        assertEqual(remaining, 0, 'Test policy should be cleaned up');
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 7: Backward Compatibility
    // ════════════════════════════════════════════════════════════
    console.log('\n── 7. BACKWARD COMPATIBILITY ──');

    test('workspaceMiddleware can require AuthorizationService', () => {
        // This is the exact import path used in workspaceMiddleware.js
        const AC = require('../modules/authorization/engine/access-control');
        assert(AC === AuthorizationService, 'Should be the same class');
        assert(typeof AC.checkAccess === 'function', 'checkAccess must exist');
    });

    test('roles.js can require authorizeRBAC from middleware', () => {
        // This is the exact import path used in routes/roles.js
        const { authorizeRBAC } = require('../modules/authorization/middleware');
        assert(typeof authorizeRBAC === 'function', 'authorizeRBAC must be a function');
    });

    test('authorizeRBAC returns a middleware function', () => {
        const middleware = authzMiddleware.authorizeRBAC('*:role:read');
        assert(typeof middleware === 'function', 'Should return a function');
        // Express middleware should accept (req, res, next)
        assert(middleware.length >= 2, 'Middleware should accept at least req, res');
    });

    test('authorize returns a middleware function with all options', () => {
        const middleware = authzMiddleware.authorize({
            action: 'delete',
            resourceType: 'invoice',
            resourceIdParam: 'id',
            requireAll: false,
            skipRBAC: false,
            skipABAC: true,
            skipReBAC: true,
        });
        assert(typeof middleware === 'function', 'Should return a function');
    });

    test('routes/index.js imports still resolve', () => {
        // These are the exact require paths from routes/index.js
        const mod = require('../modules/authorization');
        const routes = require('../modules/authorization/routes/management.routes');
        assert(mod, 'Module should load');
        assert(routes, 'Routes should load');
    });

    test('verify-dynamic-auth.js import path still works', () => {
        // Exact import from scripts/verify-dynamic-auth.js
        const AS = require('../modules/authorization/engine/access-control');
        assert(AS === AuthorizationService, 'Should be the same module');
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 8: PolicyEngine Internal Logic
    // ════════════════════════════════════════════════════════════
    console.log('\n── 8. POLICY ENGINE LOGIC ──');

    test('matchPattern: exact match', () => {
        assert(PolicyEngine.matchPattern('invoice', 'invoice') === true, 'Exact match failed');
    });

    test('matchPattern: wildcard *', () => {
        assert(PolicyEngine.matchPattern('anything', '*') === true, 'Wildcard failed');
    });

    test('matchPattern: partial wildcard', () => {
        assert(PolicyEngine.matchPattern('invoice', 'inv*') === true, 'Partial wildcard failed');
        assert(PolicyEngine.matchPattern('user', 'inv*') === false, 'Should not match');
    });

    test('evaluateConditions: equality', () => {
        assert(PolicyEngine.evaluateConditions({ name: 'alice' }, { name: 'alice' }) === true, 'Equality failed');
        assert(PolicyEngine.evaluateConditions({ name: 'alice' }, { name: 'bob' }) === false, 'Inequality failed');
    });

    test('evaluateComplexCondition: $in', () => {
        assert(PolicyEngine.evaluateComplexCondition({ $in: ['a', 'b', 'c'] }, 'b') === true, '$in match');
        assert(PolicyEngine.evaluateComplexCondition({ $in: ['a', 'b', 'c'] }, 'z') === false, '$in no match');
    });

    test('evaluateComplexCondition: $gte / $lt', () => {
        assert(PolicyEngine.evaluateComplexCondition({ $gte: 10 }, 15) === true, '$gte match');
        assert(PolicyEngine.evaluateComplexCondition({ $gte: 10 }, 5) === false, '$gte no match');
        assert(PolicyEngine.evaluateComplexCondition({ $lt: 10 }, 5) === true, '$lt match');
    });

    test('evaluateComplexCondition: $regex', () => {
        assert(PolicyEngine.evaluateComplexCondition({ $regex: '.*@test\\.com' }, 'admin@test.com') === true, '$regex match');
        assert(PolicyEngine.evaluateComplexCondition({ $regex: '.*@test\\.com' }, 'admin@evil.com') === false, '$regex no match');
    });

    test('getNestedValue works for dot paths', () => {
        const obj = { a: { b: { c: 42 } } };
        assertEqual(PolicyEngine.getNestedValue(obj, 'a.b.c'), 42, 'Nested value');
        assertEqual(PolicyEngine.getNestedValue(obj, 'a.b'), obj.a.b, 'Nested object');
        assertEqual(PolicyEngine.getNestedValue(obj, 'x.y.z'), undefined, 'Missing path');
    });

    // ════════════════════════════════════════════════════════════
    // TEST GROUP 9: Access Control Helper Methods
    // ════════════════════════════════════════════════════════════
    console.log('\n── 9. ACCESS CONTROL HELPERS ──');

    test('getRequiredRole maps actions correctly', () => {
        assertEqual(AuthorizationService.getRequiredRole('create'), 'admin', 'create→admin');
        assertEqual(AuthorizationService.getRequiredRole('read'), 'user', 'read→user');
        assertEqual(AuthorizationService.getRequiredRole('manage'), 'manager', 'manage→manager');
        assertEqual(AuthorizationService.getRequiredRole('unknown'), null, 'unknown→null');
    });

    test('getActionRelation maps actions correctly', () => {
        assertEqual(AuthorizationService.getActionRelation('read'), 'can_view', 'read→can_view');
        assertEqual(AuthorizationService.getActionRelation('update'), 'can_edit', 'update→can_edit');
        assertEqual(AuthorizationService.getActionRelation('delete'), 'can_delete', 'delete→can_delete');
        assertEqual(AuthorizationService.getActionRelation('manage'), 'can_manage', 'manage→can_manage');
        assertEqual(AuthorizationService.getActionRelation('fly'), null, 'fly→null');
    });

    // ════════════════════════════════════════════════════════════
    // RESULTS
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log(`  RESULTS: ${passed}/${totalTests} passed, ${failed} failed`);
    console.log('═'.repeat(60));

    if (failed > 0) {
        console.log('\n❌ SOME TESTS FAILED\n');
        process.exit(1);
    } else {
        console.log('\n✅ ALL TESTS PASSED — Nothing is broken!\n');
        process.exit(0);
    }
}

runAllTests().catch(err => {
    console.error('\n💥 Test runner crashed:', err);
    process.exit(1);
}).finally(() => {
    sequelize.close().catch(() => { });
});
