// Author: Gururaj
// Created: 28th Aug 2025 
// Description: To maintain all the constaints
// Version: 1.0.0
// Modified:

require("dotenv").config();


const ACTIONS = {
    CREATE: 'Add',
    READ: 'Read',
    UPDATE: 'Update',
    DELETE: 'Delete',
    REGISTER: 'Register',
    LOGIN: 'Login'
  };

const DEFAULT_EMPLOYEE_PERMISSION = ['manage_projects, manage_tasks'];

const ORGANIZATION_STATE_ENUM_VALUES = ["active", "suspended", "inactive"];
const BILLING_CYCLE = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
const PLAN_TYPE = ['individual', 'bundle'];
const SUBSCRIPTION_STATUS_ENUM_VALUES = ['active', 'trial', 'expired', 'cancelled', "failed", "activate_pending", "feature_subscritpion"];
const SUBSCRIPTION_STATUS_ENUM_VALUES_FOR_HISTORY = ['expired', 'cancelled', "failed", "payment_pending"];
const USAGE_NOTIFICATION_CATEGORY_ENUM_VALUES = ['user', 'storage', 'db', 'sms', 'email'];
const INVOICE_STATUS_ENUM_VALUES = ['pending', 'paid', 'failed'];

const ACTION_ON_HISTORY = ['create', "update", "delete", 'bulk_create', "bulk_update", "bulk_delete",  ];

const SUBSCRIPTION_PAUSE_STATE = ["cancelled", "completed"];


const UNWANTED_FILEDS = [
            'created_by',
            'updated_by',
            'created_ip',
            'updated_ip',
            'created_user_agent',
            'updated_user_agent',
            // 'created_at',
            // 'updated_at',
            'createdAt',
            'updatedAt',
         ];



  
module.exports = {
  ACTIONS,
  DEFAULT_EMPLOYEE_PERMISSION,
  ORGANIZATION_STATE_ENUM_VALUES,
  BILLING_CYCLE,
  PLAN_TYPE,
  SUBSCRIPTION_STATUS_ENUM_VALUES,
  SUBSCRIPTION_STATUS_ENUM_VALUES_FOR_HISTORY,
  USAGE_NOTIFICATION_CATEGORY_ENUM_VALUES,
  INVOICE_STATUS_ENUM_VALUES,
  ACTION_ON_HISTORY,
  SUBSCRIPTION_PAUSE_STATE,
  UNWANTED_FILEDS,
};