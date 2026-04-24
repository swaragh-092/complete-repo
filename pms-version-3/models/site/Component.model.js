// Created: 20th Apr 2026
// Description: Component Sequelize model — leaf-level work item for Site-type projects.
// Supports both page-specific components/tasks and project-wide global components.
// Architecture: Page → Components/Tasks  (flat, sections no longer required)
// Version: 2.0.0

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Component = sequelize.define(
    'Component',
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
      section_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Legacy FK to section — null for page-direct or global components',
      },
      parent_component_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Self-referencing FK for sub-components',
      },
      component_for: {
        type: DataTypes.ENUM('normal', 'help'),
        defaultValue: 'normal',
        allowNull: false,
        comment: 'normal = regular component/task; help = helper task assisting another',
      },
      helped_for: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'FK to the component being helped. NULL for normal components.',
      },
      page_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Direct FK to page for page-level components/tasks',
      },
      is_global: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'True for project-wide shared components (header, footer, navbar)',
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('component', 'task'),
        defaultValue: 'component',
        allowNull: false,
        comment: 'component = UI element; task = work item (can be assigned to dept member)',
      },
      reporter_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      acceptance_criteria: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'defined',
          'in_progress',
          'review',
          'completed',
          'blocked',
          'accept_pending',
          'reject'
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
      assignee: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'User who assigned or creator',
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'User performing the work',
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
      story_points: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      total_work_time: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Time spent in minutes',
      },
      timer_started_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      timer_status: {
        type: DataTypes.ENUM('running', 'stopped'),
        defaultValue: 'stopped',
        allowNull: false,
      },
      timer_started_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'User ID of who started the timer (for mutex)',
      },
      sprint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      board_order: {
        type: DataTypes.FLOAT,
        defaultValue: 65535.0,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + 'components',
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  commonFields(Component);

  Component.associate = (models) => {
    Component.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
      onDelete: 'CASCADE',
    });

    Component.belongsTo(models.Page, {
      foreignKey: 'page_id',
      as: 'page',
    });

    Component.belongsTo(models.Section, {
      foreignKey: 'section_id',
      as: 'section',
    });

    // Self-referencing: sub-components
    Component.belongsTo(models.Component, {
      foreignKey: 'parent_component_id',
      as: 'parentComponent',
    });
    Component.hasMany(models.Component, {
      foreignKey: 'parent_component_id',
      as: 'subComponents',
      onDelete: 'CASCADE',
    });

    // Helper: component helped_for → target component
    Component.belongsTo(models.Component, {
      foreignKey: 'helped_for',
      as: 'helpTarget',
    });

    Component.belongsTo(models.Sprint, {
      foreignKey: 'sprint_id',
      as: 'sprint',
    });

    // Component → Issues (Site-type)
    Component.hasMany(models.Issue, {
      foreignKey: 'component_id',
      as: 'issues',
    });
  };

  return Component;
};
