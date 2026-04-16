// Author: Gururaj
// Created: 14th oct 2025
// Description: project member model
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const ProjectMember = sequelize.define(
    "ProjectMember",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "FK -> Project",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "FK -> User (from Auth module)",
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "FK -> Department (from Auth module)",
      },
      project_role: {
        type: DataTypes.ENUM("member", "lead", "viewer", "tester"),
        allowNull: false,
        defaultValue: "member",
        comment:
          "Project-specific role: member=general, lead=team lead (links issues), tester=QA (creates issues), viewer=read-only",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "project_members",
      timestamps: true,
      underscored: true,
      paranoid: true, // Soft delete
      deletedAt: "deleted_at",
      indexes: [
        {
          // A user can be a member of the same project in multiple departments
          // (e.g., as both Developer and Designer), but not twice in the same department.
          unique: true,
          fields: ["project_id", "user_id", "department_id"],
          name: tablePrefix + "project_members" + "_project_user_dept_unique",
        },
      ],
    },
  );

  commonFields(ProjectMember);

  ProjectMember.associate = (models) => {
    // ProjectMember → Project
    ProjectMember.belongsTo(models.Project, {
      foreignKey: "project_id",
      as: "project",
      onDelete: "CASCADE",
    });
  };

  return ProjectMember;
};
