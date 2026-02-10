const db = require("./models/index");
const app = require("./app");
const applyCustomIndexs = require("./models/customIndexes"); 

// process.env.PORT ||
const PORT =  process.env.PORT || 8089;

db.sequelize
  // .sync({ force: true })
  .authenticate()
  .then(async () => {
    // await applyCustomIndexs(); // to exicute custom queries (to add unique index where delete index null for many tables)

    app.listen(PORT, () => {
      console.log(`server started at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });