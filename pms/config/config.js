const domain = {
    superAdmin: 'http://super-administrator:8089/',
    auth: 'http://auth-service:4000/',
}
// const domain = {
//     superAdmin: 'http://localhost:2500',
//     auth: 'http://auth-service:4000',
// }

const databaseDetails = {
    "default-shared": {
        name: process.env.DB_NAME || 'pms',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '1234',
        host: process.env.DB_HOST || 'postgres-auth',
        port: process.env.DB_PORT || 5432,
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

module.exports = {
    domain,
    moduleCode: "pms_mod",
    databaseDetails
};