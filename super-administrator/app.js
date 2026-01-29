// Created: 02nd July 2025
// Description:
// App Version: 1.0.0
// Modified:

// installed packages
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

// runs the queue processor every 30 seconds
require("./queue/queueProcessor");

// runs all cron jobs
require("./jobs/CronJobs");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());

console.log("Front end domain:", process.env.FRONT_END_DOMAIN);
app.use(
  cors({
    origin: process.env.FRONT_END_DOMAIN, // your React frontend URL
    credentials: true, // allow cookies
  })
);

// just to add delay for apis (helps implementing loading effect for front end.)
app.use(async (req, res, next) => {
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // await sleep(2000);
  next();
});


// serves static files
app.use(express.static(path.join(__dirname, "public")));

app.use('/api', require('./routes'));


// 404 response for invalid routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Invalid URL" });
});
 
// 500 response for server errors
app.use((error, req, res, next) => {
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;
