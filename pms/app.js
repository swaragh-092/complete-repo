// Created: 16th May 2025
// Description:
// App Version: 1.0.0
// Modified:

// installed packages
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const config = require("./config/config");

// const errorHandler = require("./middleware/errorHandler.middleware");




// runs all cron jobs
require("./jobs/CronJobs");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: config.frontendDomain, // your React frontend URL
    credentials: true, // allow cookies
  })
);


// health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});


// routers 
app.use(require("./middleware/dataValidation.middleware"));
app.use(require("./middleware/dbConnection.middleware")); 





app.use("/"+ require('./config/config').MODULE_CODE, require("./routes"));

// 404 response for invalid routes
app.use((req, res,) => {
  console.log("Invalid URL accessed:", req.path);
  res.status(404).json({ message: "Invalid URL Accessed: " + req.path });
});
 
// 500 response for server errors
app.use((error, req, res) => {
  // console.log(error);
  res.status(500).json({ message: "Internal Server Error" });
});


// error handling middleware
// app.use(errorHandler);

// serves static files
app.use(express.static(path.join(__dirname, "public")));

module.exports = app;









































// Manual cors, keep till start frontend
// app.use(async (req, res, next) => {
//   // console.log("Request received at:", new Date().toLocaleString());
//   const allowedOrigin = process.env.FRONT_END_DOMAIN;
//   res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, PATCH, OPTIONS"
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Credentials", "true");

//   // Handle preflight requests
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200); // Important!
//   }

//   function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
//   }
//   await sleep(2000);
//   next();
// });
