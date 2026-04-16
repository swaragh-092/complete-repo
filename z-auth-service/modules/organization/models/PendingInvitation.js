const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PendingInvitation extends Model {
    static associate(models) {
      PendingInvitation.belongsTo(models.Organization, {
        foreignKey: 'org_id',
        targetKey: 'id'
      });
      PendingInvitation.belongsTo(models.Role, {
        foreignKey: 'role_id',
        targetKey: 'id'
      });
      PendingInvitation.belongsTo(models.UserMetadata, {
        foreignKey: 'created_by',
        targetKey: 'id',
        as: 'Creator'
      });
    }
  }

  PendingInvitation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'organizations', key: 'id' }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true }
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'roles', key: 'id' }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'user_metadata', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'cancelled'),
      defaultValue: 'pending'
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'PendingInvitation',
    tableName: 'pending_invitations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['org_id'] },
      { fields: ['email'] },
      { fields: ['status'] },
      { unique: true, fields: ['org_id', 'email'] }
    ]
  });

  return PendingInvitation;
};