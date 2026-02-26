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


if (process.env.NODE_ENV !== "test") {
  // runs all cron jobs
  require("./jobs/CronJobs");
}



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


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check of the API
 *     description: Returns service status, uptime, and timestamp
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                 timestamp:
 *                   type: integer
 *                   example: 1670000000000
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});




if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'PMS API',
        version: '1.0.0',
        description: 'Project Management System API',
      },
      servers: [
        {
          url: 'http://localhost:3015',
          description: 'Local Development Server',
        },
        {
          url: 'https://pms.local.test',
          description: 'Production Server',
        }
      ],
      tags: [
        {
          name: 'Log',
          description: 'Standup and daily logs related endpoints'
        },
        {
          name: 'Project',
          description: 'Project related endpoints'
        },
        {
          name: 'Feature',
          description: 'Feature related endpoints'
        },
        {
          name: 'Issue',
          description: 'Issue related endpoints'
        },
        {
          name: 'Notification',
          description: 'Notification related endpoints'
        },
        {
          name: 'Task',
          description: 'Task related endpoints'
        },
      ]
    },
    apis: ['./routes/**/*.js', './app.js'], 
  };


  const swaggerSpec = swaggerJsdoc(options);

   // Replace {moduleCode} in paths with actual MODULE_CODE
  swaggerSpec.paths = Object.fromEntries(
    Object.entries(swaggerSpec.paths).map(([path, val]) => [
      path.replace("{moduleCode}", config.MODULE_CODE),
      val,
    ])
  );

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}


// routers 
app.use(require("./middleware/dataValidation.middleware"));
app.use(require("./middleware/dbConnection.middleware").getTenantDB); 


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
