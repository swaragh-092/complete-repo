const { Sequelize } = require("sequelize");

const getProjectHealthOverview = async (req, { organization_id }) => {
  const { Project, Task, Issue } = req.db;
  const sequelize = req.sequelize;
  if (!organization_id) return null;

  const projectTable = Project.getTableName();
  const taskTable = Task.getTableName();
  const issueTable = Issue.getTableName();

  const baseQuery = `
    
    SELECT
      p.*,

      COUNT(DISTINCT t_all.id) AS total_tasks,

      COUNT(DISTINCT CASE
        WHEN t_all.due_date < NOW()
        AND t_all.status IN (
          'approve_pending',
          'approved',
          'in_progress',
          'assign_pending',
          'accept_pending'
        )
        THEN t_all.id
      END) AS overdue_tasks,
      COUNT(DISTINCT CASE
        WHEN 
        t_all.status IN (
          'approve_pending',
          'approved',
          'in_progress',
          'assign_pending',
          'accept_pending'
        )
        THEN t_all.id
      END) AS ongoing_tasks,

      COUNT(DISTINCT i.id) AS high_issues,

      CASE
        WHEN
          COUNT(DISTINCT CASE
            WHEN t_all.due_date < NOW()
            THEN t_all.id
          END) = 0
          AND COUNT(DISTINCT i.id) = 0
        THEN 'safe'

        WHEN
          COUNT(DISTINCT CASE
            WHEN t_all.due_date < NOW()
            THEN t_all.id
          END) > 5
          OR COUNT(DISTINCT i.id) > 5
        THEN 'critical'

        ELSE 'at_risk'
      END AS health,

      ROUND(
        (
          COUNT(DISTINCT CASE
            WHEN t_all.status = 'completed' THEN t_all.id
          END) * 100.0
        ) / NULLIF(COUNT(DISTINCT t_all.id), 0),
        2
      ) AS completion_percentage

    FROM ${projectTable} p

    LEFT JOIN ${taskTable} t_all
      ON t_all.project_id = p.id
      AND t_all.deleted_at IS NULL

    LEFT JOIN ${issueTable} i
      ON i.project_id = p.id
      AND i.deleted_at IS NULL
      AND i.priority IN ('high','critical')
      AND i.status IN ('open','re_open','in_progress','resolved')

    WHERE p.is_completed = false
      AND p.organization_id = :organization_id
      AND p.deleted_at IS NULL

    GROUP BY p.id;

  `;

  const projects = await sequelize.query(baseQuery, {
    replacements: { organization_id },
    type: Sequelize.QueryTypes.SELECT,
  });

  // ---------- COUNTS ----------
  const counts = projects.reduce(
    (acc, p) => {
      acc[p.health]++;
      return acc;
    },
    { safe: 0, at_risk: 0, critical: 0 }
  );

  // ---------- PROJECT LISTS ----------
  const riskyProjects = projects.filter(
    p => p.health === "critical" || p.health === "at_risk"
  );

  const criticalProjects = projects.filter(p => p.health === "critical");
  const atRiskProjects = projects.filter(p => p.health === "at_risk");

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

const getProjectDeliverySnapshot = async (req,{ organization_id }) => {
  const { Project, Task } = req.db;
  const sequelize = req.sequelize;

  if (!organization_id) {
    return null;
  }

  const projectTable = Project.getTableName();
  const taskTable = Task.getTableName();

  console.log(projectTable, taskTable);

  const [result] = await sequelize.query(
    `
        SELECT
          SUM(CASE WHEN p.estimated_end_date BETWEEN NOW() AND NOW() + INTERVAL '14 days' THEN 1 ELSE 0 END) AS near_deadline,
          SUM(CASE WHEN p.estimated_end_date < NOW() THEN 1 ELSE 0 END) AS overdue,
            SUM(
                CASE
                WHEN NOT EXISTS (
                    SELECT 1
                    FROM ${taskTable} t
                    WHERE t.project_id = p.id
                    AND t.deleted_at IS NULL
                    AND (
                        t.created_at >= NOW() - INTERVAL '7 days'
                        OR t.updated_at >= NOW() - INTERVAL '14 days'
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
    }
  );

  return result;
};

module.exports = { getProjectHealthOverview, getProjectDeliverySnapshot };


  

  
