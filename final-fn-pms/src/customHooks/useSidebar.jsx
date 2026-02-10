// Author: Gururaj
// Created: 23rd May 2025
// Description: HOOK for to get sidebar from backend based on if it change.
// Version: 1.0.0
// customHooks/useSidebar.jsx
// Modified: 

// this is a dummy sidebar data, will be replaced with actual data from backend once the role permission side bar is ready
const dummySidebar = [
  {
    "is_parent": false,
    "display_name": "Dashboard",
    "internal_name": "dashboard",
    "icon": "HomeOutlinedIcon",
    "order_index": 1,
    "subNavs": []
  },
  {
    "is_parent": false,
    "display_name": "Projects",
    "internal_name": "projects",
    "icon": "WorkOutlineIcon",
    "order_index": 2,
    "subNavs": []
  },
  {
    "is_parent": false,
    "display_name": "Features",
    "internal_name": "features",
    "icon": "BlurLinearIcon",
    "order_index": 3,
    "subNavs": []
  },
  {
    "is_parent": true,
    "display_name": "Work",
    "internal_name": "work",
    "icon": "GroupWorkIcon",
    "order_index": 4,
    "subNavs": [
      {
        "is_parent": false,
        "display_name": "Tasks",
        "internal_name": "tasks",
        "icon": "LineAxisIcon",
        "order_index": 4,
        "subNavs": []
      },
      {
        "is_parent": false,
        "display_name": "Issues",
        "internal_name": "issues",
        "icon": "BugReportIcon",
        "order_index": 5,
        "subNavs": []
      },
    ]
  },
  
  {
    "is_parent": false,
    "display_name": "Logs",
    "internal_name": "daily_logs",
    "icon": "DocumentScannerIcon",
    "order_index": 6,
    "subNavs": []
  },
  {
    "is_parent": false,
    "display_name": "Invite Members",
    "internal_name": "invite_members",
    "icon": "PersonAddAltIcon",
    "order_index": 6,
    "subNavs": []
  },


  // {
  //   "is_parent": true,
  //   "display_name": "Data",
  //   "internal_name": "data",
  //   "icon": null,
  //   "order_index": 2,
  //   "subNavs": [
  //     {
  //       "is_parent": false,
  //       "display_name": "Form",
  //       "internal_name": "form",
  //       "icon": "PersonOutlinedIcon",
  //       "order_index": 0,
  //       "subNavs": []
  //     },
  //     {
  //       "is_parent": false,
  //       "display_name": "Contact Info",
  //       "internal_name": "contacts",
  //       "icon": "ContactsOutlinedIcon",
  //       "order_index": 3,
  //       "subNavs": []
  //     }
  //   ]
  // },
  // {
  //   "is_parent": true,
  //   "display_name": "Tools",
  //   "internal_name": "tools",
  //   "icon": null,
  //   "order_index": 4,
  //   "subNavs": [
  //     {
  //       "is_parent": false,
  //       "display_name": "FAQs",
  //       "internal_name": "faq",
  //       "icon": null,
  //       "order_index": 5,
  //       "subNavs": []
  //     },
  //     {
  //       "is_parent": false,
  //       "display_name": "Chart",
  //       "internal_name": "chart",
  //       "icon": "BarChartOutlinedIcon",
  //       "order_index": 5,
  //       "subNavs": []
  //     },
  //     {
  //       "is_parent": false,
  //       "display_name": "Calendar",
  //       "internal_name": "calendar",
  //       "icon": "CalendarTodayOutlinedIcon",
  //       "order_index": 6,
  //       "subNavs": []
  //     }
  //   ]
  // }
]









import { useState, useEffect } from "react";

export function useSidebar(tokenAccessVersion)  {
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

        const data = {access_version : 3_1, items : dummySidebar};


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
};


