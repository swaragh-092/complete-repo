// Author : Gururaj
// Created: 30th July 2025
// Description: This is just helper table for invoice to generate the invoice number 
// Version: 1.0.0
// Modified: 

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const InvoiceCounter = sequelize.define('InvoiceCounter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY, 
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['organization_id', 'date'],
      },
    ],
    tableName: tablePrefix + 'invoice_counters',
  });

  return InvoiceCounter;
};
