// Author: Chethan 
// Created: 16th May 2025
// Description: Util functions for JWT token generation
// Version: 1.0.0
// Modified: Gururaj at 23rd May 2025, change in expire time

require('dotenv').config();

const jwt = require('jsonwebtoken');


exports.generateAccessToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_TIME}m`,
    });
}

exports.generateRefreshToken = (user) => {
    return jwt.sign({id: user.id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE_TIME}m`,
    });
}

