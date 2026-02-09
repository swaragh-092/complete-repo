const { transporter } = require("./provider");
const { templates, EMAIL_TYPES } = require("./templates");
const config = require('./config');
const logger = require('../../utils/logger'); // Assuming logger exists in parent
const { AppError } = require('../../middleware/errorHandler'); // Assuming ErrorHandler exists

/**
 * Handle incoming email requests
 * @param {Object} payload - { type, to, data }
 */
const send = async (payload) => {
    try {
        validatePayload(payload);

        const { type, to, data } = payload;
        const templateFn = templates[type];

        if (!templateFn) {
            throw new AppError(`Invalid email type: ${type}`, 400);
        }

        // Generate HTML content
        const htmlContent = templateFn(data);

        // Extract subject from title tag or use default
        const subject = extractSubject(htmlContent) || `Notification from ${config.APP_NAME || 'Auth Service'}`;

        const result = await transporter.sendMail({
            from: config.FROM_EMAIL,
            to,
            subject,
            html: htmlContent,
        });

        logger.info(`✅ Email sent successfully [Type: ${type}] to ${to}`, { messageId: result.messageId });

        // Log preview URL in development
        const previewUrl = require('nodemailer').getTestMessageUrl(result);
        if (previewUrl) {
            logger.info('📧 Preview URL:', previewUrl);
        }

        return result;
    } catch (error) {
        logger.error('❌ Email sending failed:', error);
        throw error;
    }
};

/**
 * Validate required payload fields
 */
const validatePayload = (payload) => {
    if (!payload || !payload.type || !payload.to || !payload.data) {
        throw new AppError('Invalid email payload. Required: type, to, data', 400);
    }
};

/**
 * Extract subject from <title> tag in HTML
 */
const extractSubject = (html) => {
    const match = html.match(/<title>(.*?)<\/title>/);
    return match ? match[1] : null;
};

module.exports = {
    send,
    EMAIL_TYPES
};