const dotenv = require('dotenv');
dotenv.config();
const { AppError } = require('../../middleware/errorHandler');


if(!process.env.SMTP_USER || !process.env.SMTP_PASS){
    throw new AppError('SMTP_USER and SMTP_PASS environment variables are required', 500, 'SMTP_CONFIG_MISSING');
}

module.exports = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL,
}