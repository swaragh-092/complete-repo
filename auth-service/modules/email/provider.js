const nodemailer = require('nodemailer');
const config = require('./config');

const transporter = nodemailer.createTransport({
    host : config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth : {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
    },
    debug: true,
    logger: true,
});


module.exports = {
    transporter
}


async function sendEmail({to, subject, template, data}){}