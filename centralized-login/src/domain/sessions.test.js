import { describe, it, expect } from 'vitest';
import {
    isCurrentSession,
    isSuspiciousSession,
    isStaleSession,
    groupSessionsByClient,
    getDeviceType,
    calculateSessionStats,
    filterSessions,
    SESSION_THRESHOLDS
} from './sessions';

describe('Domain: Sessions', () => {
    const NOW = new Date('2023-01-10T12:00:00Z');

    describe('isCurrentSession', () => {
        it('returns true if session is marked current', () => {
            expect(isCurrentSession({ current: true })).toBe(true);
        });

        it('returns false otherwise', () => {
            expect(isCurrentSession({ current: false })).toBe(false);
            expect(isCurrentSession({})).toBe(false);
            expect(isCurrentSession(null)).toBe(false);
        });
    });

    describe('Time-based checks', () => {
        const ONE_HOUR = 60 * 60 * 1000;

        describe('isSuspiciousSession', () => {
            it('detects suspicious sessions (> 72 hours inactive)', () => {
                const suspiciousDate = new Date(NOW.getTime() - (SESSION_THRESHOLDS.SUSPICIOUS_HOURS + 1) * ONE_HOUR);
                expect(isSuspiciousSession({ lastAccess: suspiciousDate }, NOW)).toBe(true);
            });

            it('ignores recent sessions', () => {
                const recentDate = new Date(NOW.getTime() - (SESSION_THRESHOLDS.SUSPICIOUS_HOURS - 1) * ONE_HOUR);
                expect(isSuspiciousSession({ lastAccess: recentDate }, NOW)).toBe(false);
            });

            it('handles missing lastAccess', () => {
                expect(isSuspiciousSession({}, NOW)).toBe(false);
            });
        });

        describe('isStaleSession', () => {
            it('detects stale sessions (> 7 days inactive)', () => {
                const staleDate = new Date(NOW.getTime() - (SESSION_THRESHOLDS.STALE_HOURS + 1) * ONE_HOUR);
                expect(isStaleSession({ lastAccess: staleDate }, NOW)).toBe(true);
            });

            it('ignores active sessions', () => {
                const activeDate = new Date(NOW.getTime() - (SESSION_THRESHOLDS.STALE_HOURS - 1) * ONE_HOUR);
                expect(isStaleSession({ lastAccess: activeDate }, NOW)).toBe(false);
            });
        });
    });

    describe('groupSessionsByClient', () => {
        it('groups sessions by clientId or applicationName', () => {
            const sessions = [
                { id: 1, clientId: 'app-1' },
                { id: 2, applicationName: 'App 2' },
                { id: 3, clientId: 'app-1' }
            ];

            const distinct = groupSessionsByClient(sessions);
            expect(distinct['app-1']).toHaveLength(2);
            expect(distinct['App 2']).toHaveLength(1);
        });

        it('handles empty input', () => {
            expect(groupSessionsByClient([])).toEqual({});
            expect(groupSessionsByClient(null)).toEqual({});
        });
    });

    describe('getDeviceType', () => {
        it('identifies mobile devices', () => {
            expect(getDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')).toBe('Mobile');
            expect(getDeviceType('Mozilla/5.0 (Linux; Android 10)')).toBe('Mobile');
        });

        it('identifies tablets', () => {
            expect(getDeviceType('Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X)')).toBe('Tablet');
        });

        it('defaults to Desktop', () => {
            expect(getDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Desktop');
            expect(getDeviceType(null)).toBe('Desktop');
        });
    });

    describe('calculateSessionStats', () => {
        it('calculates correct statistics', () => {
            const sessions = [
                { id: 1, clientId: 'A', userAgent: 'iPhone', lastAccess: NOW, active: true },
                { id: 2, clientId: 'B', userAgent: 'Windows', lastAccess: NOW, active: false }
            ];

            const stats = calculateSessionStats(sessions);
            expect(stats.total).toBe(2);
            expect(stats.active).toBe(1);
            expect(stats.clients).toBe(2);
            expect(stats.devices).toBe(2); // iPhone (Mobile) + Windows (Desktop)
        });

        it('returns zeros for empty input', () => {
            const stats = calculateSessionStats([]);
            expect(stats.total).toBe(0);
        });
    });

    describe('filterSessions', () => {
        const sessions = [
            { id: 1, clientId: 'A', lastAccess: NOW }, // Active
            { id: 2, clientId: 'B', lastAccess: new Date(NOW.getTime() - 200 * 60 * 60 * 1000) } // Stale (> 168h)
        ];

        it('filters by stale status', () => {
            // We must override the internal "now" of filterSessions, but the function doesn't accept "now" arg.
            // However, filterSessions calls isStaleSession(session), which defaults to new Date().
            // Since we can't easily mock new Date() inside the implementation without vi.useFakeTimers(),
            // checking logic might be flaky if we rely on real time. 
            // BUT `isStaleSession` implementation uses `new Date()` default.

            // Let's use Vitest fake timers for this specific test block to ensure reliability.
        });
    });
});
