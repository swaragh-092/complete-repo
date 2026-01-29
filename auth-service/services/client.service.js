const { Client }  = require('../config/database')


// async function getAllowedOriginsFromDB() {
//   const clients = await Client.findAll({
//     attributes: ['redirect_url'],
//     raw: true // ✅ returns plain objects instead of Sequelize instances
//     // where: { isActive: true }
//   });

//   return clients
//     .map(c => c.redirect_url)
//     .filter(Boolean); // remove null/undefined
// }

async function getAllowedOriginsFromDB() {
  const clients = await Client.findAll({
    attributes: ['redirect_url'],
    raw: true
  });

  return clients
    .map(c => {
      if (!c.redirect_url) return null;
      try {
        const urlObj = new URL(c.redirect_url);
        return `${urlObj.protocol}//${urlObj.host}`; // protocol + hostname + port
      } catch {
        return null;
      }
    })
    .filter(Boolean) // remove null
    .filter((value, index, self) => self.indexOf(value) === index); // remove duplicates
}


module.exports = {
  getAllowedOriginsFromDB
};