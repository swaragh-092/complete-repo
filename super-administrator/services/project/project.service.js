// Author: Gururaj
// Created: 31th July 2025
// Description: service for project and related things.
// Version: 1.0.0

const { Project } = require("../../models");
const { withContext } = require("../../util/helper");
const { queryWithLogAudit } =require("../../services/auditLog.service");
const paginate = require("../../util/pagination");
const { Op } = require("sequelize");

module.exports = {
    async create ({req, data}) {  
        const existingProject = await Project.findOne({ where: { sub_domain: data.sub_domain } });
        if (existingProject) return { success: false, status: 400, message: "Project with this sub_domain already exists" };
        const projectQuery = async (t) => {
            return await Project.create(data, {...withContext(req), transaction: t,});
        }
        const project = await queryWithLogAudit({ req, action : "create",queryCallBack : projectQuery, updated_columns : Object.keys(data)});
        return { success: true, status: 201, data: project, };
    },
    async update ({id, req, data}) {  
        const project = await Project.findByPk(id);
        if (data.sub_domain) {
            const existingProject = await Project.findOne({ where: { sub_domain: data.sub_domain, id: { [Op.ne]: id } } });
            if (existingProject) return { success: false, status: 400, message: "Project with this sub_domain already exists" };
        }
        if (!project) return { success: false, status: 404, message: "Project not found" };
        const projectQuery = async (t) => {
            return await project.update(data, {...withContext(req), transaction: t,});
        }
        const projectUpdated = await queryWithLogAudit({ req, action : "update",queryCallBack : projectQuery, updated_columns : Object.keys(data)});
        return { success: true, status: 201, data: projectUpdated, };
    },

    async getAll (query) {
        const {
            page,
            perPage,
            sortField = 'created_at',
            sortOrder = 'desc',
            searchText = '',
            searchField = '',
            searchOperator = '',
            } = query;
        const result = await paginate(
            ({ offset, limit, sortField, sortOrder, where }) =>
            Project.findAndCountAll({
                where,
                offset,
                limit,
                order: [[sortField, sortOrder]],
            }),
            page,
            perPage,
            sortField,
            sortOrder,
            searchText,
            searchField,
            searchOperator,
            Project
        );

        return {success : true, status : 200, data : result};
        
    },

    async getProjectById(id) {
        const project = await Project.findByPk(id, {include : ["versions"]});
        if (!project) return {success : false, status : 404,};
        return {success: true, status: 200, data: project};
    },

    async getProjectWithVersion(id, version_id) {
        const project = await Project.findByPk(id, {
        include: [
            {
            association: "versions",
            where: { id: version_id },
            include: [
                {
                association: "snapshot_modules",
                include: [
                    { association: "module_version", include: ["module"] },
                    { association: "snapshot_module_features", include: ["feature"],},
                ],
                },
            ],
            },
        ],
        });

        if (!project) return {success : false, status : 404, message: "Project or version not found!.. "};
        return {success: true, status: 200, data: project};
    }
};

