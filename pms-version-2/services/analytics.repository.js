// Author: Gururaj
// Created: 18th Mar 2026
// Description: Analytics repository with raw SQL helpers for burndown, velocity, and KPI queries.
// Version: 1.0.0
// Modified:

const { Sequelize } = require("sequelize");

const getProjectHealthOverview = async (req, { organization_id }) => {
  const { Project, Issue, UserStory } = req.db;
  const sequelize = req.sequelize;
  if (!organization_id) return null;

  const projectTable = Project.getTableName();
  const issueTable = Issue.getTableName();
  const userStoryTable = UserStory.getTableName();

  const baseQuery = `
    SELECT
      p.*,

      COUNT(DISTINCT us_all.id) AS total_user_stories,

      COUNT(DISTINCT CASE
        WHEN us_all.due_date < NOW()
        AND us_all.status NOT IN ('completed', 'blocked')
        THEN us_all.id
      END) AS overdue_user_stories,

      COUNT(DISTINCT CASE
        WHEN us_all.status NOT IN ('completed', 'blocked')
        THEN us_all.id
      END) AS ongoing_user_stories,

      COUNT(DISTINCT i.id) AS high_issues,

      COUNT(DISTINCT CASE
        WHEN us_all.status = 'completed' THEN us_all.id
      END) AS completed_user_stories,

      -- Health: SAFE (0 overdue, 0 issues), CRITICAL (>5 overdue OR >5 issues), AT_RISK (else)
      CASE
        WHEN
          COUNT(DISTINCT CASE
            WHEN us_all.due_date < NOW() AND us_all.status NOT IN ('completed', 'blocked')
            THEN us_all.id
          END) = 0
          AND COUNT(DISTINCT i.id) = 0
        THEN 'safe'

        WHEN
          COUNT(DISTINCT CASE
            WHEN us_all.due_date < NOW() AND us_all.status NOT IN ('completed', 'blocked')
            THEN us_all.id
          END) > 5
          OR COUNT(DISTINCT i.id) > 5
        THEN 'critical'

        ELSE 'at_risk'
      END AS health,

      -- Completion %
      CASE
        WHEN COUNT(DISTINCT us_all.id) > 0 THEN
          ROUND(
            (COUNT(DISTINCT CASE WHEN us_all.status = 'completed' THEN us_all.id END) * 100.0)
            / NULLIF(COUNT(DISTINCT us_all.id), 0), 2
          )
        ELSE 0
      END AS completion_percentage

    FROM ${projectTable} p

    LEFT JOIN ${userStoryTable} us_all
      ON us_all.project_id = p.id
      AND us_all.deleted_at IS NULL

    LEFT JOIN ${issueTable} i
      ON i.project_id = p.id
      AND i.deleted_at IS NULL
      AND i.priority IN ('high','critical')
      AND i.status IN ('open','re_open','in_progress','resolved')

    WHERE p.deleted_at IS NULL
      AND p.is_completed = false
      AND p.organization_id = :organization_id

    GROUP BY p.id;
  `;

  const projects = await sequelize.query(baseQuery, {
    replacements: { organization_id },
    type: Sequelize.QueryTypes.SELECT,
  });

  // ---------- COUNTS ----------
  const counts = projects.reduce(
    (acc, p) => {
      acc[p.health] = (acc[p.health] || 0) + 1;
      return acc;
    },
    { safe: 0, at_risk: 0, critical: 0 },
  );

  // ---------- PROJECT LISTS ----------
  const riskyProjects = projects.filter(
    (p) => p.health === "critical" || p.health === "at_risk",
  );

  const criticalProjects = projects.filter((p) => p.health === "critical");
  const atRiskProjects = projects.filter((p) => p.health === "at_risk");

  return {
    counts,
    projects: {
      all: projects,
      risky: riskyProjects,
      critical: criticalProjects,
      at_risk: atRiskProjects,
    },
  };
};

const getProjectDeliverySnapshot = async (req, { organization_id }) => {
  const { Project, UserStory } = req.db;
  const sequelize = req.sequelize;

  if (!organization_id) {
    return null;
  }

  const projectTable = Project.getTableName();
  const userStoryTable = UserStory.getTableName();

  const [result] = await sequelize.query(
    `
        SELECT
          SUM(CASE WHEN p.estimated_end_date BETWEEN NOW() AND NOW() + INTERVAL '14 days' THEN 1 ELSE 0 END) AS near_deadline,
          SUM(CASE WHEN p.estimated_end_date < NOW() THEN 1 ELSE 0 END) AS overdue,
            SUM(
                CASE
                WHEN NOT EXISTS (
                    SELECT 1
                    FROM ${userStoryTable} us
                    WHERE us.project_id = p.id
                    AND us.deleted_at IS NULL
                    AND (
                        us.created_at >= NOW() - INTERVAL '7 days'
                        OR us.updated_at >= NOW() - INTERVAL '14 days'
                    )
                )
                THEN 1 ELSE 0
                END
            ) AS no_update
        FROM ${projectTable} p
        WHERE p.is_completed = false 
        AND p.organization_id = :organization_id 
        AND p.deleted_at IS NULL
      `,
    {
      replacements: { organization_id },
      type: Sequelize.QueryTypes.SELECT,
    },
  );

  return result;
}


module.exports = {
  getProjectHealthOverview,
  getProjectDeliverySnapshot,
};