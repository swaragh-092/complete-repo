const { Realm } = require('../config/database');

async function checkRealms() {
    try {
        const realms = await Realm.findAll();
        console.log('Realms found:', realms.map(r => r.realm_name));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkRealms();
