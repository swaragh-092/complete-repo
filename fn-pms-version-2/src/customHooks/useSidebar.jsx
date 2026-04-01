// Author: Gururaj
// Created: 23rd May 2025
// Description: HOOK for to get sidebar from backend based on if it change.
// Version: 1.0.0
// customHooks/useSidebar.jsx
// Modified:

// this is a dummy sidebar data, will be replaced with actual data from backend once the role permission side bar is ready
const dummySidebar = [
  {
    is_parent: false,
    display_name: "Dashboard",
    internal_name: "dashboard",
    icon: "HomeOutlinedIcon",
    project_required: false,
  },
  {
    is_parent: false,
    display_name: "Projects",
    internal_name: "projects",
    icon: "WorkOutlineIcon",
    project_required: false,
  },

  // PROJECT CONTEXT
  {
    is_parent: true,
    display_name: "Project",
    internal_name: "project_section",
    icon: "FolderIcon",
    project_required: true,
    subNavs: [
      {
        display_name: "Backlog",
        internal_name: "project_backlog",
        icon: "ListAltIcon",
        project_required: true,
      },
      {
        display_name: "Sprints",
        internal_name: "project_sprints",
        icon: "DirectionsRunIcon",
        project_required: true,
      },
      {
        display_name: "Board",
        internal_name: "project_board",
        icon: "ViewKanbanIcon",
        project_required: true,
      },
      {
        display_name: "Issues",
        internal_name: "project_issues",
        icon: "BugReportIcon",
        project_required: true,
      },
      {
        display_name: "Reports",
        internal_name: "project_reports",
        icon: "AssessmentIcon",
        project_required: true,
      },
    ],
  },

  {
    is_parent: false,
    display_name: "Notifications",
    internal_name: "notifications",
    icon: "NotificationsIcon",
    project_required: false,
  },
];

import { useState, useEffect } from "react";

export function useSidebar(tokenAccessVersion) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Optional: for UI error display

  useEffect(() => {
    const storedVersion = localStorage.getItem("accessVersion");
    const storedSidebar = localStorage.getItem("sidebarConfig");

    const loadSidebar = async () => {
      try {
        // const response = await fetch(BACKEND_ENDPOINT.fetch_sidebar.path, {
        //   method: BACKEND_ENDPOINT.fetch_sidebar.method,
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   credentials: "include",
        // });

        // if (!response.ok) {
        //   throw new Error(`Sidebar fetch failed: ${response.status} ${response.statusText}`);
        // }

        // const responseData = await response.json();

        // const data = responseData.data;

        const data = { access_version: 3_1, items: dummySidebar };

        if (!data.items || !data.access_version) {
          throw new Error("Sidebar response is missing required fields.");
        }

        localStorage.setItem("accessVersion", data.access_version);
        localStorage.setItem("sidebarConfig", JSON.stringify(data.items));
        setItems(data.items);
      } catch (err) {
        console.error("Sidebar loading error:", err);
        setError(err.message);
        // Optionally fallback to previous sidebar if available
        if (storedSidebar) {
          try {
            setItems(JSON.parse(storedSidebar));
          } catch (parseErr) {
            console.error("Failed to parse fallback sidebar:", parseErr);
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // load sidebar only if the sidebar is not there or if the sidebar version is changed to previous version
    if (!storedSidebar || storedVersion !== tokenAccessVersion) {
      // console.log("Sidebar not found or version mismatch. Fetching new sidebar.");
      loadSidebar();
    } else {
      try {
        setItems(JSON.parse(storedSidebar));
      } catch (err) {
        console.error("Stored sidebar parsing failed:", err);
        setItems([]);
      }
      setLoading(false);
    }
  }, [tokenAccessVersion]);

  return { items, loading, error };
}
