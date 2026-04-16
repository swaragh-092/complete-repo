const { getKeycloakService } = require('../config');
const { Realm } = require('../config/database');

async function checkSecurity() {
    try {
        const realms = await Realm.findAll();
        console.log(`Found ${realms.length} realms.`);

        for (const realmModel of realms) {
            const realmName = realmModel.realm_name;
            console.log(`\n🔒 Checking Realm: ${realmName}`);

            try {
                const kcService = await getKeycloakService(realmName);
                const settings = await kcService.getRealmSettings(realmName);

                console.log(`   - Brute Force Protected: ${settings.bruteForceProtected}`);
                if (settings.bruteForceProtected) {
                    console.log(`     - Failure Factor: ${settings.failureFactor}`);
                    console.log(`     - Wait Increment: ${settings.waitIncrementSeconds}s`);
                    console.log(`     - Max Failure Wait: ${settings.maxFailureWaitSeconds}s`);
                    console.log(`     - Max Delta Time: ${settings.maxDeltaTimeSeconds}s`);
                    console.log(`     - Quick Login Check: ${settings.quickLoginCheckMilliSeconds}ms`);
                }

                console.log(`   - Events Enabled: ${settings.eventsEnabled}`);
                if (settings.eventsEnabled) {
                    console.log(`     - Saved Events: ${settings.adminEventsEnabled}`); // Note: this field name varries
                    // Check eventsListeners
                    console.log(`     - Event Listeners: ${settings.eventsListeners}`);
                }

            } catch (err) {
                console.log(`   ❌ Failed to fetch settings: ${err.message}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

checkSecurity();
