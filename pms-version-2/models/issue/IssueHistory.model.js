// Author: Gururaj 
// Created: 14th oct 2025
// Description: issue history tracking model  
// Version: 1.0.0


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const IssueHistory = sequelize.define("IssueHistory", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        issue_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        action_type: {
            type: DataTypes.ENUM(
                "created",
                "accepted",
                "rejected",
                "reassigned",
                "fixed",
                "resolved",
                "commented",
                "re_opened"
            ),
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + "issue_histories",
        timestamps: true,
        underscored: true,
        paranoid: true,
        deletedAt: "deleted_at"
    });

    commonFields(IssueHistory);

    IssueHistory.associate = (models) => {
        // 🔹 IssueHistory → Issue
        IssueHistory.belongsTo(models.Issue, {
            foreignKey: "issue_id",
            as: "issue",
            onDelete: "CASCADE",
        });
    };

    return IssueHistory;
};
