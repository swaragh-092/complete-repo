const { sequelize } = require('../config/database');

async function fixData() {
    try {
        console.log('Starting DB fix...');

        // 1. Fix UserMetadata gender
        // Ensure all gender values are valid for the new ENUM or set to NULL
        console.log('Fixing UserMetadata gender...');
        const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
        try {
            await sequelize.query(`
        UPDATE user_metadata 
        SET gender = NULL 
        WHERE gender IS NOT NULL 
        AND gender::text NOT IN ('${validGenders.join("','")}')
      `);
            console.log('✅ Fixed user_metadata.gender');
        } catch (e) {
            console.error('⚠️ Error fixing gender:', e.message);
        }

        // 2. Fix OrganizationMembership status default
        // Postgres fails to cast default value string to ENUM automatically during conversion.
        // Dropping the default allows the conversion to proceed; Sequelize will re-add the default as ENUM.
        console.log('Dropping default on organization_memberships.status...');
        try {
            await sequelize.query(`ALTER TABLE "organization_memberships" ALTER COLUMN "status" DROP DEFAULT`);
            console.log('✅ Dropped default on status');
        } catch (e) {
            console.log('ℹ️ Could not drop default (probably does not exist):', e.message);
        }

        // 3. Fix OrganizationMembership status data
        // Ensure data is valid for ENUM
        console.log('Fixing OrganizationMembership status data...');
        const validStatus = ['active', 'inactive', 'pending'];
        try {
            await sequelize.query(`
        UPDATE organization_memberships 
        SET status = 'active'
        WHERE status IS NOT NULL 
        AND status::text NOT IN ('${validStatus.join("','")}')
      `);
            console.log('✅ Fixed organization_memberships.status');
        } catch (e) {
            console.error('⚠️ Error fixing status data:', e.message);
        }

        console.log('All fixes applied.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to run DB fix:', error);
        process.exit(1);
    }
}

fixData();
