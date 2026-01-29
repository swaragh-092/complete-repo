// const domain = {
//     superAdmin: 'http://super_administrator:8089/',
//     auth: 'http://auth_service:8081/',
// }
const domain = {
    superAdmin: 'http://localhost:2500',
    auth: 'http://auth_service:8081',
}

const databaseDetails = {
    "default-shared" : {
        name: 'pms',
        user: 'postgres',
        password: '1234',
        host: 'postgres_db',
        port: 5432,
        type: 'postgres',
        zone: '+05:30'
    },
    "single-amd-tenant" : {
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
    moduleCode : "pms_mod",
    databaseDetails
};