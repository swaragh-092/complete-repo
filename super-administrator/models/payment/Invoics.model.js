// Author : Gururaj
// Created: 30th July 2025
// Description: This is invoice talbe valid for payment for next certain time based on settings
// Version: 1.0.0
// Modified: 

const { INVOICE_STATUS_ENUM_VALUES, UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + 'organizations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + 'organization_subscriptions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // comment: 'Auto-generated invoice number (e.g., INV-2025-00001)',
    },
    update_expire_time : {
      type: DataTypes.DATE,
      allowNull: false,
      comment : "after this time expire this invoice is not valid for payment"
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.ENUM(INVOICE_STATUS_ENUM_VALUES),
      defaultValue: INVOICE_STATUS_ENUM_VALUES[0],
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paid_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payment_gateway_ref: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'External payment reference ID (e.g., Razorpay payment_id)',
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'invoices',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(Invoice);

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization',
    });

    Invoice.belongsTo(models.OrganizationSubscription, {
      foreignKey: 'subscription_id',
      as: 'subscription',
    });

    Invoice.hasMany(models.Payment, {
      foreignKey: 'invoice_id',
      as: 'payments',
    });
  };

  return Invoice;
};
