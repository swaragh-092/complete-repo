// Created: 20th Apr 2026
// Description: SiteItemDependency Sequelize model — polymorphic dependency tracking
// for Site-type projects across pages, sections, and components.
// Application-type projects use UserStoryDependency (untouched).
// Version: 1.0.0

module.exports = (sequelize, DataTypes, tablePrefix) => {
  const SiteItemDependency = sequelize.define(
    'SiteItemDependency',
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
      // The item that HAS the dependency (is blocked by target)
      source_type: {
        type: DataTypes.ENUM('page', 'section', 'component'),
        allowNull: false,
      },
      source_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'ID of the item that depends on another (is blocked)',
      },
      // The item that must be completed first (blocks source)
      target_type: {
        type: DataTypes.ENUM('page', 'section', 'component'),
        allowNull: false,
      },
      target_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'ID of the item that must be completed first (blocker)',
      },
    },
    {
      tableName: tablePrefix + 'site_item_dependencies',
      timestamps: true,
      underscored: true,
    }
  );

  // No direct Sequelize FK associations because source_id/target_id are
  // polymorphic (can point to pages, sections, or components).
  // Lookups are done in the service layer.
  SiteItemDependency.associate = (models) => {
    SiteItemDependency.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
    });
  };

  return SiteItemDependency;
};
