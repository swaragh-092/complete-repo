import { describe, it, expect } from 'vitest';
import {
    getSecurityScoreColor,
    calculateSecurityScore,
    validatePassword
} from './security';

describe('Domain: Security', () => {
    describe('getSecurityScoreColor', () => {
        it('returns error color for low scores', () => {
            expect(getSecurityScoreColor(20)).toBe('error');
        });

        it('returns warning color for medium scores', () => {
            expect(getSecurityScoreColor(60)).toBe('warning');
        });

        it('returns success color for high scores', () => {
            expect(getSecurityScoreColor(90)).toBe('success');
        });
    });

    describe('calculateSecurityScore', () => {
        it('calculates score correctly based on factors', () => {
            // Default strong password (+20) + default 0 failed logins (+15) = 35 base
            // + emailVerified (+20) 
            // + twoFactorEnabled (+30)
            // Total: 35 + 20 + 30 = 85
            const user = { twoFactorEnabled: true, emailVerified: true };
            expect(calculateSecurityScore(user)).toBe(85);
        });

        it('handles missing user object', () => {
            // Default strong (+20) + 0 failed (+15) = 35
            expect(calculateSecurityScore(null)).toBe(35);
        });
    });

    describe('validatePassword', () => {
        it('validates correct password', () => {
            const result = validatePassword('Password123!');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('detects short passwords', () => {
            const result = validatePassword('Short1!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters');
        });
    });
});
