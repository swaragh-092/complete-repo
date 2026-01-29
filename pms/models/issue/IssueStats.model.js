// Author: Gururaj 
// Created: 14th oct 2025
// Description: issue stats (user for every issue what is the repeated times) model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const IssueStats = sequelize.define("IssueStats", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        issue_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        
        ...commonFields()
    }, {
        tableName: tablePrefix + 'issue_stats',
        timestamps: true,
        underscored: true,
        paranoid: true,
        deletedAt: 'deleted_at',
    });

    commonFields(IssueStats);

    IssueStats.associate = (models) => {
        IssueStats.belongsTo(models.IssueType, {
            foreignKey: "issue_type_id",
            as: "type"
        });
    };

    return IssueStats;
};
