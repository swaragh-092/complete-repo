'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Realm extends Model {
    static associate(models) {
      Realm.hasMany(models.Client, { foreignKey: 'realm_id', sourceKey: 'id' });
    }
  }

  Realm.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      realm_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: DataTypes.STRING(255),
      },
      tenant_id: {
        type: DataTypes.STRING(50),
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Realm',
      tableName: 'realms',
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      indexes: [
        { fields: ['realm_name'] },
        { fields: ['tenant_id'] },
      ],
    }
  );

  return Realm;
};