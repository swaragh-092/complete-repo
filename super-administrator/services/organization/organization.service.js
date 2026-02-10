// Author: Gururaj
// Created: 4th July 2025
// Description: Service for managing Organizations.
// Version: 1.0.0

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

const { Organization } = require('../../models');
const { withContext } = require('../../util/helper');
const paginate = require('../../util/pagination');
const { queryWithLogAudit } = require('../auditLog.service');

// to generate unique organizaiton code for organization 
function generateOrganizationCode(name, createdAt = new Date()) {
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
  
  const yyyy = createdAt.getFullYear();
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  const dd = String(createdAt.getDate()).padStart(2, '0');
  const datePart = `${yyyy}${mm}${dd}`;

  const suffix = uuidv4().split('-')[0].toUpperCase(); // Short part of UUID

  return `ORG-${cleanName}-${datePart}-${suffix}`;
}


const OrganizationService = {
  
  async create({req, data}) {
    console.log("woking here");
    const existing = await Organization.findOne({
      where: {
        [Op.or]: [
          { email: data.email },
          { phone: data.phone },
        ]
      }
    });

    console.log("not working here");

    if (existing) {
      if (existing.email === data.email && existing.phone === data.phone) {
        return { success: false, status: 400, message: 'Email and Phone number already exists' };
      }
      if (existing.email === data.email ) {
        return { success: false, status: 400, message: 'Email already exists' };
      }
      if (existing.phone === data.phone) {
        return { success: false, status: 400, message: 'Phone number already exists' };
      }
    }
    
    data.code = generateOrganizationCode(data.name);

    const orgQuery = async (t) => {
      return await Organization.create(data, {...withContext(req), transaction: t,});
    } 

    const org = await queryWithLogAudit({ req, action : "create",queryCallBack : orgQuery, updated_columns : Object.keys(data)});
    return { success: true, status: 201, data: org, };
  },



  async update({id, data, req}) {
    const org = await Organization.findByPk(id);
    if (!org) return { success: false, status: 404, message: "Organization not found" };
    const orgQuery = async (t) => {
      return await org.update(data, {...withContext(req), transaction: t,});
    }
    const updatedOrg = await queryWithLogAudit({ req, action : "update",queryCallBack : orgQuery, updated_columns : Object.keys(data)});

    return { success: true, status: 200, message: "Updated successfully", data: updatedOrg };
  },

  async getById(id) {
    const org = await Organization.findByPk(id);
    if (!org) return { success: false, status: 404, message: "Organization not found" };
    return { success: true, status: 200, data: org };
  },

  async getAll(query) {
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
        Organization.findAndCountAll({
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
      Organization
    );

    return { success: true, status: 200, data: result };
  },

  async delete({id, req}) {
    const org = await Organization.findByPk(id);
    if (!org) return { success: false, status: 404, message: "Organization not found" };

    const orgQuery = async (t) => {
      return await org.destroy({...withContext(req), transaction: t,});
    }
    await queryWithLogAudit({ req, action : "delete",queryCallBack : orgQuery});
    return { success: true, status: 200, message: "Deleted successfully" };
  }
};

module.exports = OrganizationService;
