// Author: Gururaj
// Created: 29th May 2025
// Description: Application-wide constant values shared across services and controllers.
// Version: 1.0.0
// Modified:

const ACTIONS = {
    CREATE: 'Add',
    READ: 'Read',
    UPDATE: 'Update',
    DELETE: 'Delete',
    REGISTER: 'Register',
    LOGIN: 'Login'
  };

const DEFAULT_EMPLOYEE_PERMISSION = ['manage_projects, manage_tasks'];

const ACTION_ON_HISTORY = ['create', "update", "delete", 'bulk_create', "bulk_update", "bulk_delete",  ];
  
module.exports = {ACTIONS, DEFAULT_EMPLOYEE_PERMISSION, ACTION_ON_HISTORY};
  