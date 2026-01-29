// Author: Gururaj 
// Created: 14th oct 2025
// Description: Common fields which should be in every table
// Version: 1.0.0

const { DataTypes } = require('sequelize');
const { namespace } = require("../../config/cls");

const commonFields = (sequelizeModel) => {
  const fields = {
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

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
        defaultValue: DataTypes.NOW,
    },
  };

  // Attach hooks if model is passed
  if (sequelizeModel) {
    sequelizeModel.addHook('beforeCreate', (instance, options) => {
      const { user, ip, userAgent, organization_id } = options.context || {};
      if (organization_id)  instance.organization_id = organization_id;
      if (user) instance.created_by = user.id;
      if (user) instance.updated_by = user.id;
      if (ip) instance.created_ip = ip;
      if (ip) instance.updated_ip = ip;
      if (userAgent) instance.created_user_agent = userAgent;
      if (userAgent) instance.updated_user_agent = userAgent;
    });

    sequelizeModel.addHook("beforeBulkCreate", (instances, options) => {
      const { user, ip, userAgent, organization_id } = options.context || {};
      for (const instance of instances) {
        if (organization_id) instance.organization_id = organization_id;
        if (user) {
          instance.created_by = user.id;
          instance.updated_by = user.id;
        }
        if (ip) {
          instance.created_ip = ip;
          instance.updated_ip = ip;
        }
        if (userAgent) {
          instance.created_user_agent = userAgent;
          instance.updated_user_agent = userAgent;
        }
      }
    });


    sequelizeModel.addHook('beforeUpdate', (instance, options) => {
      const { user, ip, userAgent, organization_id } = options.context || {};
      if (organization_id)  instance.organization_id = organization_id;
      if (user) instance.updated_by = user.id;
      if (ip) instance.updated_ip = ip;
      if (userAgent) instance.updated_user_agent = userAgent;
    });

    sequelizeModel.addHook("beforeFind", (options) => {
      if (options.ignoreOrganizationFilter) return;
      if (!options.where) options.where = {};
        if (!options.organization_id) {
          // inject the org from CLS context
          const orgId = namespace.get("organization_id");
          if (!orgId) throw new Error("Organization not found");
          options.where.organization_id = orgId;
        }
    });

  }

  return fields;
};

module.exports = commonFields;
