'use strict';

/**
 * Create pending_invitations table
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('pending_invitations')) {
      console.log('✅ pending_invitations already exists, skipping...');
      return;
    }

    await queryInterface.createTable('pending_invitations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'user_metadata', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'cancelled'),
        defaultValue: 'pending',
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false,
      },
    });

    await queryInterface.addIndex('pending_invitations', ['org_id']);
    await queryInterface.addIndex('pending_invitations', ['email']);
    await queryInterface.addIndex('pending_invitations', ['status']);
    await queryInterface.addConstraint('pending_invitations', {
      type: 'unique',
      fields: ['org_id', 'email'],
      name: 'pending_invitations_org_email_unique',
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('pending_invitations')) {
      await queryInterface.dropTable('pending_invitations');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pending_invitations_status";');
    }
  },
};
