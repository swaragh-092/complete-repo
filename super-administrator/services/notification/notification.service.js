// Author : Gururaj
// Created: 31th July 2025
// Description: Rosource Usage Notification settings service 
// Version: 1.0.0
// Modified: 

const { UsageNotificationSetting } = require("../../models");
const { withContext } = require("../../util/helper");
const { queryWithLogAudit } = require("../auditLog.service");

module.exports = {
    async createOrUpdateSettings({ data, req }) {
        const existingSettings = await UsageNotificationSetting.findOne({
        where: {
            category: data.category
            }});
        if (existingSettings) {
            await queryWithLogAudit({
                action: 'update',
                req,
                updated_columns: Object.keys(data),
                queryCallBack: async (t) => {
                    return await existingSettings.update(data, {
                    transaction: t,
                    ...withContext(req),
                    });
                },
            });
            return { success: true, status: 200, data: existingSettings, message: "Notification settings updated successfully" };
        } else {
            if (!data.threshold_percent) return { success: false, status: 400, message: "Please provide persentage to notify" };
            const newSettings = await queryWithLogAudit({
                action: 'create',
                req,
                updated_columns: Object.keys(data),
                queryCallBack: async (t) => {
                    return await UsageNotificationSetting.create(
                        data,
                        { transaction: t, ...withContext(req) }
                    );
                },
            });
            return { success: true, status: 201, data: newSettings, message: "Notification settings created successfully" };
        }
    },

    async getSettings({ id }) {

        const settings = await UsageNotificationSetting.findByPk(id);
            
        return { success: true, status: 200, data: settings, message: "Notification settings retrieved successfully" };
    }, 
    async getAllSettings() {

        const settings = await UsageNotificationSetting.findAll();
            
        return { success: true, status: 200, data: settings, message: "Notification settings retrieved successfully" };
    }, 

 
};
