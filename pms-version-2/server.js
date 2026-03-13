
const app = require("./app");

//  process.env.PORT ||
const PORT = process.env.PORT || 3015;

app.listen(PORT, () => {
  console.log(`server started at http://localhost:${PORT}`);
});
