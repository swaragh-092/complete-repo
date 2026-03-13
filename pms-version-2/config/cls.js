// Author: Gururaj
// Created: 14th Oct 2025
// Description: cls-hooked creates a namespace, which acts like a "per-request storage container". It allows you to store and retrieve values that persist
// Version: 1.0.0
// Modified:


const cls = require("cls-hooked");
const namespace = cls.createNamespace("my-app-namespace");

const { Sequelize } = require("sequelize");
Sequelize.useCLS(namespace);

module.exports = { namespace };
