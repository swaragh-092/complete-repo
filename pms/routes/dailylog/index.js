// Author: Gururaj
// Created: 26th Feb 2026
// Description: Collects all dailylog subroutes
// Version: 1.0.0

const express = require("express");
const router = express.Router();

router.use("/reports", require("./reports.route"));
router.use("/", require("./dailyliog.route"));

module.exports = router;
