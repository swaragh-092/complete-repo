// Created: 20th Apr 2026
// Description: Page Sequelize model — top-level structural entity for Site-type projects.
// Replaces Feature in Application-type projects.
// Hierarchy: Page → Section → Component
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Page = sequelize.define(
    'Page',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parent_page_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Self-referencing FK for sub-pages',
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      url_slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL path for this page (e.g. /contact-us)',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
      },
      status_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        allowNull: false,
      },
      assignee_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approval_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'not_required'),
        defaultValue: 'not_required',
        allowNull: false,
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + 'pages',
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  commonFields(Page);

  Page.associate = (models) => {
    Page.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
      onDelete: 'CASCADE',
    });

    // Self-referencing: sub-pages
    Page.belongsTo(models.Page, {
      foreignKey: 'parent_page_id',
      as: 'parentPage',
    });
    Page.hasMany(models.Page, {
      foreignKey: 'parent_page_id',
      as: 'subPages',
      onDelete: 'CASCADE',
    });

    // Page → Sections (legacy — kept for backward compat)
    Page.hasMany(models.Section, {
      foreignKey: 'page_id',
      as: 'sections',
      onDelete: 'CASCADE',
    });

    // Page → Components/Tasks (direct, flat hierarchy)
    Page.hasMany(models.Component, {
      foreignKey: 'page_id',
      as: 'components',
      onDelete: 'CASCADE',
    });

    // Page → Issues (Site-type)
    Page.hasMany(models.Issue, {
      foreignKey: 'page_id',
      as: 'issues',
    });
  };

  return Page;
};
