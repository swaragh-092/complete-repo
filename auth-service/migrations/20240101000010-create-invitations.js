'use strict';

/**
 * Create invitations table
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('invitations')) {
      console.log('✅ invitations already exists, skipping...');
      return;
    }

    await queryInterface.createTable('invitations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      invited_email: {
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
      code_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      invited_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'user_metadata', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      accepted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'user_metadata', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(`NOW() + interval '7 days'`),
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'expired', 'revoked'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('invitations', ['org_id']);
    await queryInterface.addIndex('invitations', ['invited_email']);
    await queryInterface.addIndex('invitations', ['code_hash']);
    await queryInterface.addIndex('invitations', ['status']);
    await queryInterface.addIndex('invitations', ['expires_at']);
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('invitations')) {
      await queryInterface.dropTable('invitations');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invitations_status";');
    }
  },
};
