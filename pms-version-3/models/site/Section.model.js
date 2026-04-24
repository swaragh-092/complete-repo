// Created: 20th Apr 2026
// Description: Section Sequelize model — mid-level work item for Site-type projects.
// Belongs to a Page; can be nested (sub-sections); carries sprint assignment.
// Hierarchy: Page → Section → Component
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Section = sequelize.define(
    'Section',
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
      page_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parent_section_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Self-referencing FK for nested sections',
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
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Display order within the parent page',
      },
      status: {
        type: DataTypes.ENUM(
          'defined',
          'in_progress',
          'review',
          'completed',
          'blocked'
        ),
        defaultValue: 'defined',
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
      sprint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + 'sections',
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  commonFields(Section);

  Section.associate = (models) => {
    Section.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
      onDelete: 'CASCADE',
    });

    Section.belongsTo(models.Page, {
      foreignKey: 'page_id',
      as: 'page',
      onDelete: 'CASCADE',
    });

    // Self-referencing: nested sections
    Section.belongsTo(models.Section, {
      foreignKey: 'parent_section_id',
      as: 'parentSection',
    });
    Section.hasMany(models.Section, {
      foreignKey: 'parent_section_id',
      as: 'subSections',
      onDelete: 'CASCADE',
    });

    Section.belongsTo(models.Sprint, {
      foreignKey: 'sprint_id',
      as: 'sprint',
    });

    // Section → Components
    Section.hasMany(models.Component, {
      foreignKey: 'section_id',
      as: 'components',
      onDelete: 'CASCADE',
    });

    // Section → Issues (Site-type)
    Section.hasMany(models.Issue, {
      foreignKey: 'section_id',
      as: 'issues',
    });
  };

  return Section;
};
