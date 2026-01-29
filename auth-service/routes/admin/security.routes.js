const express = require('express');
const router = express.Router({ mergeParams: true });
const KeycloakService = require('../../services/keycloak.service');
const withKeycloak = require('../../middleware/keycloak.middleware');
const { authMiddleware } = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const asyncHandler = require('../../middleware/asyncHandler');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');

// Apply middleware
router.use(authMiddleware);

// Get realm security configuration
router.get('/config', withKeycloak, asyncHandler(async (req, res) => {
    try {
        // We fetch the full realm config but only return security-related fields
        const realm = await req.kc.getRealm();

        const securityConfig = {
            bruteForceProtected: realm.bruteForceProtected,
            permanentLockout: realm.permanentLockout,
            maxFailureWaitSeconds: realm.maxFailureWaitSeconds,
            minimumQuickLoginWaitSeconds: realm.minimumQuickLoginWaitSeconds,
            waitIncrementSeconds: realm.waitIncrementSeconds,
            quickLoginCheckMilliSeconds: realm.quickLoginCheckMilliSeconds,
            maxDeltaTimeSeconds: realm.maxDeltaTimeSeconds,
            failureFactor: realm.failureFactor,
            passwordPolicy: realm.passwordPolicy,
            otpPolicyType: realm.otpPolicyType,
            otpPolicyAlgorithm: realm.otpPolicyAlgorithm,
            otpPolicyInitialCounter: realm.otpPolicyInitialCounter,
            otpPolicyDigits: realm.otpPolicyDigits,
            otpPolicyLookAheadWindow: realm.otpPolicyLookAheadWindow,
            otpPolicyPeriod: realm.otpPolicyPeriod,
            otpSupportedApplications: realm.otpSupportedApplications,
            webAuthnPolicyRpEntityName: realm.webAuthnPolicyRpEntityName,
            webAuthnPolicySignatureAlgorithms: realm.webAuthnPolicySignatureAlgorithms,
            webAuthnPolicyRpId: realm.webAuthnPolicyRpId,
            webAuthnPolicyAttestationConveyancePreference: realm.webAuthnPolicyAttestationConveyancePreference,
            webAuthnPolicyAuthenticatorAttachment: realm.webAuthnPolicyAuthenticatorAttachment,
            webAuthnPolicyRequireResidentKey: realm.webAuthnPolicyRequireResidentKey,
            webAuthnPolicyUserVerificationRequirement: realm.webAuthnPolicyUserVerificationRequirement,
            webAuthnPolicyCreateTimeout: realm.webAuthnPolicyCreateTimeout,
            webAuthnPolicyAvoidSameAuthenticatorRegister: realm.webAuthnPolicyAvoidSameAuthenticatorRegister,
            webAuthnPolicyAcceptableAaguids: realm.webAuthnPolicyAcceptableAaguids,
            webAuthnPolicyPasswordlessRpEntityName: realm.webAuthnPolicyPasswordlessRpEntityName,
            webAuthnPolicyPasswordlessSignatureAlgorithms: realm.webAuthnPolicyPasswordlessSignatureAlgorithms,
            webAuthnPolicyPasswordlessRpId: realm.webAuthnPolicyPasswordlessRpId,
            webAuthnPolicyPasswordlessAttestationConveyancePreference: realm.webAuthnPolicyPasswordlessAttestationConveyancePreference,
            webAuthnPolicyPasswordlessAuthenticatorAttachment: realm.webAuthnPolicyPasswordlessAuthenticatorAttachment,
            webAuthnPolicyPasswordlessRequireResidentKey: realm.webAuthnPolicyPasswordlessRequireResidentKey,
            webAuthnPolicyPasswordlessUserVerificationRequirement: realm.webAuthnPolicyPasswordlessUserVerificationRequirement,
            webAuthnPolicyPasswordlessCreateTimeout: realm.webAuthnPolicyPasswordlessCreateTimeout,
            webAuthnPolicyPasswordlessAvoidSameAuthenticatorRegister: realm.webAuthnPolicyPasswordlessAvoidSameAuthenticatorRegister,
            webAuthnPolicyPasswordlessAcceptableAaguids: realm.webAuthnPolicyPasswordlessAcceptableAaguids
        };

        return ResponseHandler.success(res, securityConfig, 'Security configuration retrieved successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error fetching security config: ${error.message}`);
        throw new AppError('Failed to fetch security config', 500, 'FETCH_FAILED', { originalError: error.message });
    }
}));

// Update realm security configuration
router.put('/config', withKeycloak, asyncHandler(async (req, res) => {
    try {
        // We only allow updating specific security fields
        const allowedUpdates = [
            'bruteForceProtected', 'permanentLockout', 'maxFailureWaitSeconds',
            'minimumQuickLoginWaitSeconds', 'waitIncrementSeconds', 'quickLoginCheckMilliSeconds',
            'maxDeltaTimeSeconds', 'failureFactor', 'passwordPolicy', 'otpPolicyType',
            'otpPolicyAlgorithm', 'otpPolicyInitialCounter', 'otpPolicyDigits',
            'otpPolicyLookAheadWindow', 'otpPolicyPeriod', 'otpSupportedApplications',
            'webAuthnPolicyRpEntityName', 'webAuthnPolicySignatureAlgorithms', 'webAuthnPolicyRpId',
            'webAuthnPolicyAttestationConveyancePreference', 'webAuthnPolicyAuthenticatorAttachment',
            'webAuthnPolicyRequireResidentKey', 'webAuthnPolicyUserVerificationRequirement',
            'webAuthnPolicyCreateTimeout', 'webAuthnPolicyAvoidSameAuthenticatorRegister',
            'webAuthnPolicyAcceptableAaguids', 'webAuthnPolicyPasswordlessRpEntityName',
            'webAuthnPolicyPasswordlessSignatureAlgorithms', 'webAuthnPolicyPasswordlessRpId',
            'webAuthnPolicyPasswordlessAttestationConveyancePreference',
            'webAuthnPolicyPasswordlessAuthenticatorAttachment',
            'webAuthnPolicyPasswordlessRequireResidentKey',
            'webAuthnPolicyPasswordlessUserVerificationRequirement',
            'webAuthnPolicyPasswordlessCreateTimeout',
            'webAuthnPolicyPasswordlessAvoidSameAuthenticatorRegister',
            'webAuthnPolicyPasswordlessAcceptableAaguids'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            throw new AppError('No valid security configuration fields provided', 400, 'VALIDATION_ERROR');
        }

        const updatedRealm = await req.kc.updateRealm(updates);

        // Return the updated security config (same subset as GET)
        const securityConfig = {};
        allowedUpdates.forEach(key => {
            if (updatedRealm[key] !== undefined) {
                securityConfig[key] = updatedRealm[key];
            }
        });

        return ResponseHandler.success(res, securityConfig, 'Security configuration updated successfully');
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Error updating security config: ${error.message}`);
        throw new AppError('Failed to update security config', 500, 'UPDATE_FAILED', { originalError: error.message });
    }
}));

module.exports = router;
