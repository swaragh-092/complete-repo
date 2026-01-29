// Author: Gururaj
// Created: 14th oct 2025
// Description: project members related servicel.
// Version: 1.0.0
// Modified:

const { Op, Sequelize } = require("sequelize");
const { withContext, giveValicationErrorFormal, paginateHelperFunction } = require("../../util/helper");
const { createNotification } = require("../notification/notification.service");


const { queryMultipleWithAuditLog, queryWithLogAudit } = require("../auditLog.service");

class ProjectMemberService {
  /**
   * Add one or more members to a project (same department)
   * Each user can have their own role (defaults to "member")
   * @param {Object} data - { project_id, department_id, users: [{ user_id, project_role? }], is_active? }
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>}
   */
  async addMembers(req, data) {
    const { ProjectMember, Project } = req.db;

    const { project_id, department_id, users = [] } = data;

    try {
      // 🔹 Check if project exists
      const project = await Project.findByPk(project_id);
      if (!project) {
        return { success: false, status: 404, message: "Project not found" };
      }

      if (!Array.isArray(users) || users.length === 0) {
        return {
          success: false,
          status: 400,
          message: "At least one user must be provided",
        };
      }

      // Extract user_ids
      const userIds = users.map((u) => u.user_id);

      // Fetch existing members for this project+department
      const existingMembers = await ProjectMember.findAll({
        where: { project_id, department_id, user_id: { [Op.in]: userIds } },
        attributes: ["user_id"],
      });

      const existingUserIds = existingMembers.map((m) => m.user_id);

      // Filter out already existing users
      const newUsers = users.filter(
        (u) => !existingUserIds.includes(u.user_id)
      );

      if (newUsers.length === 0) {
        return {
          success: false,
          status: 409,
          message: "All users are already members of this project",
        };
      }

      // Prepare bulk insert
      const membersData = newUsers.map((u) => ({
        project_id,
        department_id,
        user_id: u.user_id,
        project_role: u.project_role || "member", // default role if not given
      }));



      const multipleOperation = [];
            

      multipleOperation.push({
        queryCallBack: async (t) => {
          const newMembers = await ProjectMember.bulkCreate(
            membersData,
            {
              ...withContext(req),
              transaction: t 
            }
          );

          const notificationData = {
            scope: "individual",
            title: `Added to project`,
            message: `You are added to the ${project.name}.`,
            triggeredById: req?.user?.id,
            entityType: "project",
            entityId: project.id,
            userId: newUsers.map((u) => u.user_id),
          };

          const notificationResult = await createNotification(
            req,
            notificationData,
          );

          return newMembers;

        },
        updated_columns: Object.keys(membersData[0]),
        action: "bulk_create",
        model: ProjectMember,
      });

      const result = await queryMultipleWithAuditLog({operations: multipleOperation, req});

      return {
        success: true,
        status: 201,
        data: {
          added_members: result[0],
          skipped_members: existingUserIds.map((userId) => {
            return { user_id: userId, reason: "User already exists." };
          }),
        },
      };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Remove a member from a project (soft delete due to paranoid)
   * @param {String} memberId - Member UUID
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>}
   */
  async removeMember(req, memberId) {
    const { ProjectMember } = req.db;

    const member = await ProjectMember.findByPk(memberId, {include: [{association: "project", require: true}]});

    if (!member) {
      return {
        status: 404,
        success: false,
        message: "Project member not found",
      };
    }

    const project = member.project;

    const query = async (t) => {
      const deletedMember = await member.destroy({
        ...withContext(req),
        transaction: t,
      });

      const notificationData = {
        scope: "individual",
        title: `Removed from project`,
        message: `You are removed from the ${project.name}.`,
        triggeredById: req?.user?.id,
        entityType: "project",
        entityId: project.id,
        userId: member.user_id,
      };

      const notificationResult = await createNotification(req, notificationData);

      return deletedMember;
    };

    const result = await queryWithLogAudit({
      req,
      action: "delete",
      queryCallBack: query,
    });


    return {
      status: 200,
      success: true,
      message: "Project member removed successfully",
    };
  }

  /**
   * Get all members of a project
   * @param {String} projectId - Project UUID
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>}
   */
  async getProjectWtihMembers(req, { project_id, department_id = null,  }, query = {}) {
    const { ProjectMember, Project } = req.db;
    
    try {
      const project = await Project.findByPk(project_id);

      if (!project) return {success: false, message : "Project not found!.", status: 404};

      const filter = {
        project_id,
        ...(department_id && { department_id }),
      };

      const result = await paginateHelperFunction({model : ProjectMember, whereFilters: filter , query });

      const responseData = {project, members: result};
      
      return { status: 200, success: true, data: responseData };
    } catch (err) {
      console.log(err);
      throw new Error(`Error fetching project members: ${err.message}`);
    }
  }

  /**
   * Remove a member from a project (soft delete due to paranoid)
   * @param {Object} data - { member_id, project_role}
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>}
   */
  async editMemberRole(req, data) {
    const { ProjectMember } = req.db;

    const member = await ProjectMember.findByPk(data.member_id, {include: [{association: "project", require: true}]});
    if (!member) {
      return {
        status: 404,
        success: false,
        message: "Project member not found",
      };
    }

    const project = member.project;

    const query = async (t) => {
      const updatedMember = await member.update({ project_role: data.project_role }, {
        ...withContext(req),
        transaction: t,
      });

      const notificationData = {
        scope: "individual",
        title: `Role changed in project`,
        message: `You are role changed to ${data.project_role} in ${project.name}.`,
        triggeredById: req?.user?.id,
        entityType: "project",
        entityId: project.id,
        userId: updatedMember.user_id,
      };

      const notificationResult = await createNotification(req, notificationData);

      return updatedMember;
    };

    const result = await queryWithLogAudit({
      req,
      action: "update",
      queryCallBack: query,
      updated_columns: ['project_role'],
    });

    return { status: 200, success: true, data: result };
  }

  // get members while searching of same project and department  .. 
  async getMembersInSearch(req, {searchText, projectMemberId}){
    const { ProjectMember } = req.db;

    const projectMember = await ProjectMember.findByPk(projectMemberId);
    console.log(projectMemberId);
    if (!projectMember) return {success : false, status: 404, message : "Helper not foung!.."};
    const userProjectMember = await ProjectMember.findOne({where : {user_id: req.user.id, project_id : projectMember.project_id, department_id: projectMember.department_id}});
    
    if (!userProjectMember) return {success : false, status: 401, };

    const members = await ProjectMember.findAll({
      where: {
        project_id: projectMember.project_id,
        department_id: projectMember.department_id,
        id: { [Op.ne]: projectMember.id } 
      },
      attributes: ['user_id', "id"],
      raw: true
    });

    const userIds = members.map(m => m.user_id);
    const matchingUsers = await searchUsersByName(searchText, userIds);

    // create a map of user_id → projectMemberId for faster lookup
    const memberMap = new Map(members.map(m => [m.user_id, m.id]));

    const usersWithProjectMemberId = matchingUsers.map(user => ({
      ...user,
      projectMemberId: memberMap.get(user.id) || null
    }));

    
    return { data : usersWithProjectMemberId, success: true, status: 200 };

  }
}

module.exports = new ProjectMemberService();
 
// this is what we should from auth service
async function searchUsersByName(searchTerm, userIds = []) {
  const dummyUsers = [
    { id: 'key-cloak-id', name: 'John Doe', email: 'john@example.com' },
    { id: 'user-10', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user-1', name: 'Michael Jordan', email: 'mj@example.com' },
    { id: 'user-12', name: 'Joanna Brown', email: 'joanna@example.com' },
  ];

  if (!searchTerm && (!userIds || userIds.length === 0)) return dummyUsers;

  const filtered = dummyUsers.filter((u) => {
    const nameMatch = !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase());
    // const idMatch = !userIds?.length || userIds.includes(u.id);
    return nameMatch ;
  });

  return filtered;
}