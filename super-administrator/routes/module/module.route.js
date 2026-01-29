// Author: Gururaj
// Created: 7th July 2025
// Description: Routes for ModuleRegistry APIs.
// Version: 1.0.0

const express = require("express");
const router = express.Router();
const moduleController = require("../../controllers/module/module.controller");

// Validation middleware
const {
  uuid,
  name,
  description,
  requiredEnum,
  permissionCode,
  boolean,
  container,
  port,
} = require("../../services/validation");

const validationMiddleware = require("../../middleware/validation.middleware");


router.post(
  "/",
  [
    permissionCode("code"), // mandatory
    name(),          // mandatory
    description(),                // optional
    description("version_discription"),                // optional
    container(), 
    port(),   
     
  ],
  validationMiddleware("ModuleRegistry", "Create"),
  moduleController.create
);

// Create a new version of the module
router.post(
  "/:id/",
  [
    description(),                // optional    
    container(), 
    port(),
  ],
  validationMiddleware("ModuleRegistry", "Create"),
  moduleController.createVersion
);

router.put(
  "/:id",
  [
    uuid("id"),
    permissionCode("code").optional(),
    name().optional(),       
    description().optional(),    // optional
  ],
  validationMiddleware("ModuleRegistry", "Update"),
  moduleController.update
);

router.put(
  "/:id/version/:versionId",
  [
    container().optional(), 
    description().optional(),    // optional
    boolean("is_active").optional(), 
    port().optional()
  ],
  validationMiddleware("Module version", "Update"),
  moduleController.updateVersion
)

router.put(
  "/state/:id",
  [
    uuid("id"),
    requiredEnum("state", ["active", "suspended"])
  ],
  validationMiddleware("ModuleRegistry", "Update"),
  moduleController.editActive
);

router.get("/:id",
  [
    uuid("id")
  ],
  validationMiddleware("ModuleRegistry", "Update"),
  moduleController.getById);

router.get("/", moduleController.getAll);

router.delete("/:id", [uuid("id")], moduleController.delete);
router.delete("/version/:versionId", [uuid("id")], moduleController.deleteVersion);

module.exports = router;
