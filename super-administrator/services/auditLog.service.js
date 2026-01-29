// Author: Chethan
// Created: unknown
// Description: This is for audit log service.
// Version: 1.0.0
// Modified: By Gururaj, added queryWithLogAudit


// services/auditLog.service.js
const { AuditLog, sequelize } = require('../models');
const { withContext } = require('../util/helper');


class AuditLogService {


    //  only for bulk delete send snapshort
    async queryWithLogAudit({action, req, queryCallBack, snapshot = null, updated_columns = null, remarks = null,}) {
      if ( !action) {
        throw new Error('action required to create an audit log entry.');
      }
      const result = await sequelize.transaction(async (t) => {
        const queryExicuted = await queryCallBack(t);

        const userId = "afdasdf";
        const organizationId = "812be327-4e00-4e22-94e7-953809fff244"; // to find this to logic will come here

        // If nothing was done, just return early
        if (!queryExicuted || (Array.isArray(queryExicuted) && queryExicuted.length === 0)) {
          return queryExicuted;
        }

        let modelClass = null;

        // get model for single or bulk update
        if (!modelClass && Array.isArray(queryExicuted) && queryExicuted.length > 0) {
          modelClass = queryExicuted[0]?.constructor;
        } else if (!modelClass && queryExicuted && typeof queryExicuted === 'object') {
          modelClass = queryExicuted.constructor;
        } else if (!modelClass && Array.isArray(snapshot) && snapshot.length > 0) {
          modelClass = snapshot[0]?.constructor;
        } else if (!modelClass && snapshot && typeof snapshot === 'object') {
          modelClass = snapshot.constructor;
        } 

        // get table name 
        const rawTableName = modelClass?.getTableName?.();
        const tableName = typeof rawTableName === 'string' ? rawTableName : rawTableName?.tableName || null;

        const auditLog = await AuditLog.create(
          {
            reference_id : queryExicuted.id,
            table_name: tableName,
            action,
            updated_columns,
            snapshot : snapshot ?? queryExicuted,
            organization_id: organizationId,
            user_id: userId,
            remarks
          },
          withContext(req),
          { transaction: t }
        );
  
        return queryExicuted;
      });
  
      return result;
    }

    /**
     * Runs multiple queries in a single transaction with individual audit logs.
     *
     * @param {Object} options
     * @param {Object} options.req - Express request object (for context)
     * @param {Array} options.operations - Array of operations to run
     *   Each item: {
     *     action: "create" | "update" | "delete",
     *     queryCallback: async (t) => result,
     *     updated_columns?: string[],
     *     snapshot?: any,
     *     remarks?: string,
     *     auditTargetExtractor?: (result) => object // optional
     *     model?: //optional if send snapshot
     *   }
     * @returns {Array} array of query results
     */
    async queryMultipleWithAuditLog({ req, operations, }) {
      if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error("At least one operation must be provided.");
      }

      const userId = "afdasdf";
      const organizationId = "812be327-4e00-4e22-94e7-953809fff244";

      const results = await sequelize.transaction(async (t) => {
        const opResults = [];

        for (const op of operations) {
          if (!op.action) {
            throw new Error("Each operation must specify an action.");
          }
          if (typeof op.queryCallBack !== "function") {

            throw new Error("Each operation must provide a queryCallback function.");
          }

          const result = await op.queryCallBack(t);

          // If no result, skip audit logging
          if (!result || (Array.isArray(result) && result.length === 0)) {
            opResults.push(result);
            continue;
          }

          let auditTarget = result;
          if (op.auditTargetExtractor && typeof op.auditTargetExtractor === "function") {
            auditTarget = op.auditTargetExtractor(result);
          }

          let modelClass = op.model ?? null;
          if (Array.isArray(auditTarget) && !modelClass && auditTarget.length > 0) {
            modelClass = auditTarget[0]?.constructor;
          } else if (auditTarget && typeof auditTarget === "object" && !modelClass) {
            modelClass = auditTarget.constructor;
          } else if (Array.isArray(op.snapshot) && op.snapshot.length > 0 && !modelClass) {
            modelClass = op.snapshot[0]?.constructor;
          } else if (op.snapshot && typeof op.snapshot === "object" && !modelClass) {
            modelClass = op.snapshot.constructor;
          }

          const rawTableName = modelClass?.getTableName?.();

          const tableName = typeof rawTableName === "string"
            ? rawTableName
            : rawTableName?.tableName || null;
            

          await AuditLog.create(
            {
              reference_id: auditTarget?.id,
              table_name: tableName,
              action: op.action,
              updated_columns: op.updated_columns,
              snapshot: op.snapshot ?? auditTarget,
              organization_id: organizationId,
              user_id: userId,
              remarks: op.remarks,
            },
            withContext(req),
            { transaction: t }
          );

          opResults.push(result);
        }

        return opResults;
      });

      return results;
    }

}

module.exports = new AuditLogService();