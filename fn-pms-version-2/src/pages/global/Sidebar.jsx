// Author: Gururaj
// Created: 23rd May 2025
// Description: Main sidebar for the project.
// Version: 3.0.0 (Persistent project context via localStorage)

import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Typography, useTheme, useMediaQuery, Drawer, Select, MenuItem as MuiMenuItem, FormControl } from "@mui/material";
import { Link, useLocation, useNavigate, matchPath } from "react-router-dom";
import { Sidebar as ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { useSelector } from "react-redux";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";

import { colorCodes } from "../../theme";
import { useSidebar } from "../../customHooks/useSidebar";
import SidebarSkeleton from "../../components/skeleton/SidebarSkeleton";
import { paths } from "../../util/urls";
import BACKEND_ENDPOINT from "../../util/urls";
import backendRequest from "../../util/request";

import * as MuiIcons from "@mui/icons-material";
import { useOrganization } from "../../context/OrganizationContext";

// ---------- HELPERS ----------

const STORAGE_KEY = "pms_current_project";

const normalizeIconName = (icon) => (typeof icon === "string" && icon.endsWith("Icon") ? icon.replace("Icon", "") : icon);

const getStoredProject = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storeProject = (project) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
};

// Path resolver — returns null when projectId is required but missing
const resolvePath = (internal_name, projectId) => {
  const route = paths[internal_name];

  if (!route) return null;

  if (typeof route === "string") return route;

  if (typeof route === "function") {
    let result;
    try {
      // Call without args first to determine if the path needs projectId
      result = route();
    } catch {
      return null;
    }

    // String result means the path is self-contained (e.g. /projects)
    if (typeof result === "string") return result;

    // Object result means the path needs projectId to resolve
    if (typeof result === "object") {
      if (!projectId) return null;
      try {
        result = route(projectId);
      } catch {
        return null;
      }
      return result?.actualPath || null;
    }
  }

  return null;
};

// ---------- ITEM ----------

const Item = ({ title, to, icon, onClick, disabled }) => {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const location = useLocation();

  const isActive = to ? matchPath({ path: to, end: to === "/" }, location.pathname) : false;

  if (disabled || !to) {
    return (
      <MenuItem icon={icon} active={false} style={{ color: colors.text["dark"], opacity: 0.4, cursor: "not-allowed" }} rootStyles={{ justifyContent: "flex-start" }}>
        <div style={{ width: "100%", textAlign: "left" }}>
          <Typography>{title}</Typography>
        </div>
      </MenuItem>
    );
  }

  return (
    <MenuItem icon={icon} active={!!isActive} onClick={onClick} component={<Link to={to} />} style={{ color: colors.text["dark"] }} rootStyles={{ justifyContent: "flex-start" }}>
      <div style={{ width: "100%", textAlign: "left" }}>
        <Typography>{title}</Typography>
      </div>
    </MenuItem>
  );
};

// ---------- SIDEBAR CONTENT ----------

const SidebarContent = ({ isCollapsed, handleToggle, isMobile }) => {
  const { user = {} } = useSelector((state) => state.auth || {});
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const { currentOrganization } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();

  const { items, loading } = useSidebar(2);
  const sidebarItems = items || [];

  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [userProjects, setUserProjects] = useState([]);

  // Extract projectId from URL
  const urlProjectId = (() => {
    const match = location.pathname.match(/\/projects\/([^/]+)/);
    return match ? match[1] : null;
  })();

  // Sync URL projectId to localStorage (during render, not in an effect)
  if (urlProjectId) {
    const stored = getStoredProject();
    if (!stored || stored.id !== urlProjectId) {
      storeProject({ id: urlProjectId, name: null });
    }
  }

  // The effective projectId: URL takes priority, then stored
  const storedProject = getStoredProject();
  const currentProjectId = urlProjectId || storedProject?.id || null;

  // Fetch the user's projects for the selector
  useEffect(() => {
    (async () => {
      const res = await backendRequest({
        endpoint: BACKEND_ENDPOINT.get_user_projects,
      });
      if (res?.success && Array.isArray(res.data)) {
        setUserProjects(res.data);
      }
    })();
  }, [currentOrganization]);

  // Update stored project name once we have the projects list
  useEffect(() => {
    if (urlProjectId && userProjects.length > 0) {
      const project = userProjects.find((p) => p.id === urlProjectId);
      if (project) {
        storeProject({ id: project.id, name: project.name });
      }
    }
  }, [urlProjectId, userProjects]);

  // When a project is picked from the dropdown, navigate to it
  const handleProjectSelect = (projectId) => {
    if (!projectId) return;
    const project = userProjects.find((p) => p.id === projectId);
    if (project) {
      storeProject({ id: project.id, name: project.name });
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        "& aside": { borderRight: "none !important" },
        "& .ps-sidebar-container": {
          background: `${colors.background["dark"]} !important`,
        },
        "& .ps-menu-button:hover": { color: "#868dfb !important" },
        "& .ps-active": { color: "#6870fa !important" },
        "& .ps-menu-button": {
          backgroundColor: "transparent !important",
        },
        "& .ps-submenu-content": {
          backgroundColor: `${colors.background.dark} !important`,
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu>
          {/* HEADER */}
          <MenuItem icon={isCollapsed ? <MenuOutlinedIcon /> : undefined} onClick={handleToggle} style={{ margin: "10px 0 20px 0", color: colors.text["light"] }}>
            {!isCollapsed && (
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" ml="15px">
                <Typography variant="h3" fontWeight={1000} color={colors.text["light"]}>
                  P M S
                </Typography>
                <IconButton onClick={handleToggle}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {/* USER */}
          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center">
                <img alt="profile" width="100px" height="100px" src={user.avatar_url || `/assets/user.png`} style={{ borderRadius: "50%" }} />
              </Box>
              <Box textAlign="center">
                <Typography variant="h2" color={colors.text["light"]} fontWeight="bold">
                  {user.fullName || "Name not found"}
                </Typography>
                <Typography variant="h5" color={colors.primary["dark"]}>
                  {user.email || "email not found"}
                </Typography>

                {currentOrganization && (
                  <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1, m: 1.5 }}>
                    <Typography variant="caption">Current Org</Typography>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {currentOrganization?.name || currentOrganization?.org_name}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* MENU */}
          <Box>
            {loading && <SidebarSkeleton isCollapsed={isCollapsed} />}

            {!loading &&
              sidebarItems.map((item, index) => {
                const { display_name, internal_name, icon, is_parent, subNavs } = item;
                const itemKey = internal_name || index;
                const IconComponent = (icon && MuiIcons[normalizeIconName(icon)]) || HomeOutlinedIcon;

                const path = resolvePath(internal_name, currentProjectId);

                if (!is_parent) {
                  return <Item key={itemKey} title={display_name} to={path || "/"} icon={<IconComponent />} onClick={isMobile ? handleToggle : undefined} />;
                }

                const isProjectSection = internal_name === "project_section";

                const isSubMenuActive = (subNavs || []).some((sub) => {
                  const subPath = resolvePath(sub.internal_name, currentProjectId);
                  return subPath && matchPath({ path: subPath, end: false }, location.pathname);
                });

                return (
                  <SubMenu
                    key={itemKey}
                    icon={
                      <IconComponent
                        sx={{
                          color: isSubMenuActive ? colors.secondary["dark"] : colors.text["light"],
                        }}
                      />
                    }
                    label={<Typography fontWeight={isSubMenuActive ? "bold" : "normal"}>{display_name}</Typography>}
                    defaultOpen={isSubMenuActive || openSubMenu === itemKey}
                    onOpenChange={(isOpen) => setOpenSubMenu(isOpen ? itemKey : null)}
                  >
                    {/* Project selector inside the Project submenu */}
                    {isProjectSection && !isCollapsed && (
                      <Box px={2} py={1}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={currentProjectId || ""}
                            displayEmpty
                            onChange={(e) => handleProjectSelect(e.target.value)}
                            sx={{
                              fontSize: "0.8rem",
                              color: colors.text.dark,
                              ".MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.text.dark + "40",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: colors.text.dark + "80",
                              },
                            }}
                          >
                            <MuiMenuItem value="" disabled>
                              <em>Select Project</em>
                            </MuiMenuItem>
                            {userProjects.map((p) => (
                              <MuiMenuItem key={p.id} value={p.id}>
                                {p.name}
                              </MuiMenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {(subNavs || []).map((sub, subIndex) => {
                      const SubIconComponent = (sub.icon && MuiIcons[normalizeIconName(sub.icon)]) || HomeOutlinedIcon;

                      const subPath = resolvePath(sub.internal_name, currentProjectId);

                      const noProject = isProjectSection && !currentProjectId;

                      return <Item key={subIndex} title={sub.display_name} to={subPath} icon={<SubIconComponent />} disabled={noProject} onClick={isMobile ? handleToggle : undefined} />;
                    })}
                  </SubMenu>
                );
              })}
          </Box>

          {/* Admin Monitor — visible to org owners and admins only */}
          {(() => {
            const orgRole = currentOrganization?.role?.name?.toLowerCase();
            if (!["owner", "admin"].includes(orgRole)) return null;
            return (
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1, mt: 1 }}>
                <Item title="Admin Monitor" to="/admin/monitor" icon={<MonitorHeartIcon />} onClick={isMobile ? handleToggle : undefined} />
              </Box>
            );
          })()}
        </Menu>
      </ProSidebar>
    </Box>
  );
};

// ---------- MAIN ----------

const Sidebar = () => {
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem("isSideBarOpen") === "true");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const prevIsMobile = useRef(isMobile);

  const handleToggle = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      localStorage.setItem("isSideBarOpen", !isCollapsed);
      setIsCollapsed(!isCollapsed);
    }
  };

  useEffect(() => {
    if (prevIsMobile.current && !isMobile) {
      setDrawerOpen(false);
    }
    prevIsMobile.current = isMobile;
  }, [isMobile]);

  return isMobile ? (
    <>
      {!drawerOpen && (
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ position: "fixed", top: 15, left: 10, zIndex: 2000 }}>
          <MenuOutlinedIcon />
        </IconButton>
      )}

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: (theme) => colorCodes(theme.palette.mode).background.dark,
          },
        }}
      >
        <SidebarContent isCollapsed={false} handleToggle={() => setDrawerOpen(false)} isMobile />
      </Drawer>
    </>
  ) : (
    <SidebarContent isCollapsed={isCollapsed} handleToggle={handleToggle} isMobile={false} />
  );
};

export default Sidebar;
