require('dotenv').config();

const DOMAIN = {
    superAdmin: 'http://super-administrator:4010',
    auth: 'http://auth-service:4000',
}
// const DOMAIN = {
//     superAdmin: 'http://localhost:2500',
//     auth: 'http://auth-service:4000',
// }

const DATABASE_DETAILS = {
    "default-shared": {
        name: process.env.DB_NAME || 'pms',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '1234',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5411,
        type: 'postgres',
        zone: '+05:30'
    },
    "single-amd-tenant": {
        name: 'pms_amd',
        user: 'postgres',
        password: '1234',
        host: 'localhost',
        port: 5432,
        type: 'postgres',
        zone: '+05:30'
    }
}

const REDIS_CONNECTION = {
    host : process.env.REDIS_HOST || "localhost",
    port : process.env.REDIS_PORT || 6379,
    password : ""
}

module.exports = {

    DOMAIN,
    MODULE_CODE: "pms_mod",
    DATABASE_DETAILS,
    REDIS_CONNECTION,
    frontendDomain: "https://final-fn-pms.local.test:7000"
};


