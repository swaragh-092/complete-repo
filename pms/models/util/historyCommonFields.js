// Author : Gururaj
// Created: 31th July 2025
// Description: This is common fields and hooks for history table 
// Version: 1.0.0
// Modified: 

const { DataTypes } = require('sequelize');
const { ACTION_ON_HISTORY } = require('../../util/constant');

const commonFields = (sequelizeModel) => {
  const fields = {

    organization_id : {
        type: DataTypes.UUID,
        allowNull: false,
    },
    action : {
        type: DataTypes.ENUM(...ACTION_ON_HISTORY),
        allowNull: false,
    },
    user_id : {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_agent : {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    ip_address : {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    time : {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
  };

  // Attach hooks if model is passed
  if (sequelizeModel) {
    sequelizeModel.addHook('beforeCreate', (instance, options) => {
      const { user, ip, userAgent } = options.context || {};
      if (user) instance.user_id = user.id;
      if (ip) instance.ip_address = ip;
      if (userAgent) instance.user_agent = userAgent;
      instance.time = new Date();
    });


    sequelizeModel.addHook('beforeBulkCreate', (instances, options) => {
      const { user, ip, userAgent } = options.context || {};

      for (const instance of instances) {
        if (user) instance.user_id = user.id;
        if (ip) instance.ip_address = ip;
        if (userAgent) instance.user_agent = userAgent;
        instance.time = new Date();
      }
    });

  }

  return fields;
};

module.exports = commonFields;
