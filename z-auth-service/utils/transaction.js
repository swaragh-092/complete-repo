// utils/transaction.js


const {sequelize} = require('../config/database')


async function withTransaction(operation) {
  const transaction = await sequelize.transaction();
  try {
    const result = await operation(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}


module.exports = { withTransaction };