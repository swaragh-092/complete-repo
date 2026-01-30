
const app = require("./app");

//  process.env.PORT ||
const PORT = 3010;

app.listen(PORT, () => {
  console.log(`server started at http://localhost:${PORT}`);
});
