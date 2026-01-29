// Author : Gururaj
// Created: 31th July 2025
// Description: Payment model done by invoice 
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + 'invoices',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('initiated', 'success', 'failure'),
      allowNull: false,
      defaultValue: 'initiated',
    },
    transaction_ref: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reference ID returned by the payment gateway',
    },
    payment_gateway: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., razorpay, stripe, etc.',
    },
    response_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Raw response from payment gateway',
    },
    paid_on: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when payment was completed',
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'payments',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(Payment);

  Payment.associate = (models) => {
    Payment.belongsTo(models.Invoice, {
      foreignKey: 'invoice_id',
      as: 'invoice',
    });


  };

  return Payment;
};
