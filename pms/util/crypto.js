// Author: Gururaj
// Created: 16th May 2025
// Description: This is util funtions for encryption and decryption
// Version: 1.0.0
// Modified:

const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENC_KEY; // 32 bytes
const IV = process.env.ENC_IV; // 16 bytes

if (ENCRYPTION_KEY.length !== 32) {
throw new Error('Encryption key must be 32 bytes');
}
if (IV.length !== 16) {
throw new Error('IV must be 16 bytes');
}

exports.encrypt = (data) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

exports.decrypt = (encrypted) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};