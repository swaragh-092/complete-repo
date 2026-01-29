// Author : Gururaj
// Created: 31th July 2025
// Description: This is common fields and hooks for every table 
// Version: 1.0.0
// Modified: 

const { DataTypes } = require('sequelize');

const commonFields = (sequelizeModel) => {
  const fields = {
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    updated_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    created_user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    updated_user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
  };

  // Attach hooks if model is passed
  if (sequelizeModel) {
    sequelizeModel.addHook('beforeCreate', (instance, options) => {
      const { user, ip, userAgent } = options.context || {};
      if (user) instance.created_by = user.id;
      if (ip) instance.created_ip = ip;
      if (userAgent) instance.created_user_agent = userAgent;
      instance.created_at = new Date();
    });

    sequelizeModel.addHook('beforeUpdate', (instance, options) => {
      const { user, ip, userAgent } = options.context || {};
      if (user) instance.updated_by = user.id;
      if (ip) instance.updated_ip = ip;
      if (userAgent) instance.updated_user_agent = userAgent;
      instance.updated_at = new Date();
    });

    sequelizeModel.addHook('beforeDestroy', (instance, options) => {
      const { user, ip, userAgent } = options.context || {};
      if (user) instance.updated_by = user.id;
      if (ip) instance.updated_ip = ip;
      if (userAgent) instance.updated_user_agent = userAgent;
      instance.updated_at = new Date();
    });

    sequelizeModel.addHook('beforeBulkCreate', (instances, options) => {
      const { user, ip, userAgent } = options.context || {};

      for (const instance of instances) {
        if (user) instance.created_by = user.id;
        if (ip) instance.created_ip = ip;
        if (userAgent) instance.created_user_agent = userAgent;
        instance.created_at = new Date();
      }
    });

  }

  return fields;
};

module.exports = commonFields;
