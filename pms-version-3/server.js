// Author: Gururaj
// Created: 16th May 2025
// Description: Application entry point that starts the HTTP server on the configured port.
// Version: 1.0.0
// Modified:


const app = require("./app");

//  process.env.PORT ||
const PORT = process.env.PORT || 3015;

app.listen(PORT, () => {
  console.log(`server started at http://localhost:${PORT}`);
});
