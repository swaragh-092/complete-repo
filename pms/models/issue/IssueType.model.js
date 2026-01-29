// Author: Gururaj 
// Created: 14th oct 2025
// Description: issue types model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const IssueType = sequelize.define("IssueType", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + 'issue_types',
        timestamps: true,
        underscored: true,
        paranoid: true,
        deletedAt: 'deleted_at',
    });

    commonFields(IssueType);

    IssueType.associate = (models) => {
        IssueType.hasMany(models.IssueStats, {
            foreignKey: "issue_type_id",
            as: "stats"
        });
    };

    return IssueType;
};
