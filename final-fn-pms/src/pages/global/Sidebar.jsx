// Author: Gururaj
// Created: 23rd May 2025
// Description: Main sidebar for the project.
// Version: 1.0.0
// pages/global/Sidebar.jsx
// Modified:

import React, { useState, useEffect } from "react";
import { Box, IconButton, Typography, useTheme, useMediaQuery, Drawer } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { Sidebar as ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { useSelector } from "react-redux";


import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

import { colorCodes } from "../../theme";
import { useSidebar } from "../../customHooks/useSidebar";
import SidebarSkeleton from "../../components/skeleton/SidebarSkeleton";
import { paths } from "../../util/urls";

import * as MuiIcons from '@mui/icons-material';
import { useOrganization } from "../../context/OrganizationContext";

const normalizeIconName = (icon) =>
  typeof icon === "string" && icon.endsWith("Icon")
    ? icon.replace("Icon", "")
    : icon;


// nav item
const Item = ({ title, to, icon, onClick }) => {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const location = useLocation();

  

  const isActive = location.pathname === to;

  return (
    <MenuItem
      icon={icon}
      active={isActive}
      onClick={onClick}
      component={<Link to={to} />}
      style={{ color: colors.text["dark"] }}
      rootStyles={{
        justifyContent: "flex-start", // align icon & text container to left
      }}
    >
      <div style={{ width: "100%", textAlign: "left" }}>
        <Typography>{title}</Typography>
      </div>
    </MenuItem>
  );
};

const deriveRoleFromDepartments = (departments) => {
  let departmentsAsName = "" ;
  departments.forEach((element, index) => {
    departmentsAsName += index === 0 ? element.name : `, ${element.name}`;
  });
  return departmentsAsName;

}

// complete sidebar content for dynamic mobile and closed
const SidebarContent = ({ isCollapsed, handleToggle, isMobile }) => {

  
  const { user = {}, accessVersion } = useSelector((state) => state.auth || {});
  // const { name, role } = user; 

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const { currentOrganization } = useOrganization();
  const location = useLocation();

  const { items, loading, error } = useSidebar(2); // change this later
  const sidebarItems = items || [];

  const [openSubMenu, setOpenSubMenu] = useState(null);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        "& aside": {
          borderRight: "none !important", // <== remove white line
        },
        "& .ps-sidebar-container": {
          background: `${colors.background["dark"]} !important`,
        },
        "& .ps-menu-button:hover": {
          color: "#868dfb !important",
        },
        "& .ps-active": {
          color: "#6870fa !important",
        },
        "& .ps-menu-button": {
          backgroundColor: "transparent !important", // <-- remove white
        },
        "& .ps-menu-button span": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        "& .ps-submenu-content": {
          backgroundColor: `${colors.background.dark} !important`, // <-- remove white for sub items
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu>
          <MenuItem
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            onClick={handleToggle}
            style={{
              margin: "10px 0 20px 0",
              color: colors.text["light"],
            }}
          >
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

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img alt="profile-user" width="100px" height="100px" src={user.avatar_url || `/assets/user.png`} style={{ cursor: "pointer", borderRadius: "50%" }} />
              </Box>
              <Box textAlign="center">
                <Typography variant="h2" color={colors.text["light"]} fontWeight="bold" sx={{ m: "10px 0 0 0" }}>
                  {user.fullName || "Name not found"}
                </Typography>
                <Typography variant="h5" color={colors.primary["dark"]}>
                  {user.email || "email not found"}
                </Typography>
                {/* Organization Info */}
                {currentOrganization && (
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, m: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Current Org</Typography> 
                    <Typography variant="subtitle2" fontWeight={600}>{currentOrganization?.name || currentOrganization?.org_name}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          <Box>
            {loading && <SidebarSkeleton isCollapsed={isCollapsed} />}
            {!loading &&
              sidebarItems.map((item, index) => {
                const { display_name, internal_name, icon, is_parent, subNavs } = item;
                const itemKey = internal_name || `unnamed-${index}`;
                const IconComponent = (icon && MuiIcons[normalizeIconName(icon)]) || HomeOutlinedIcon ;

                let path;

                if ( typeof paths[internal_name] === "string") {
                  path = paths[internal_name];
                } else if (typeof paths[internal_name] === "function") {
                  const pathFollowing = paths[internal_name]();
                  path = ( typeof pathFollowing === "object" ? pathFollowing.actualPath : pathFollowing ) || "/";
                }
                if (!is_parent) {
                  return <Item key={`single-${itemKey}`} title={display_name || "Unnamed"} to={path} icon={<IconComponent />} onClick={isMobile ? handleToggle : undefined} />;
                } else {
                  const isSubMenuActive = (subNavs || []).some(() => path && location.pathname === path);
                  return (
                    <SubMenu
                      key={`group-${itemKey}-${Math.random()}`}
                      icon={<IconComponent sx={{ color: isSubMenuActive ? colors.secondary["dark"] : colors.text["light"] }} />}
                      label={
                        <Box
                          sx={{
                            width: "100%",
                            textAlign: "left",
                            cursor: "pointer",
                            // "&:hover .sidebar-group": {
                            //   color: `${colors.secondary["light"]} !important`,
                            //   fontWeight: `bold !important`,
                            // },
                          }}
                        >
                          <Typography
                            // className="sidebar-group"
                            style={{
                              // color: isSubMenuActive ? colors.secondary["light"] : colors.text["light"],
                              fontWeight: isSubMenuActive ? "bold" : "normal",
                              // transition: "color 0.1s, font-weight 0.3s",
                            }}
                          >
                            {display_name || "Unnamed Group"}
                          </Typography>
                        </Box>
                      }
                      defaultOpen={openSubMenu === itemKey}
                      onOpenChange={(isOpen) => {
                        setOpenSubMenu(isOpen ? itemKey : null);
                      }}
                    >
                      {(subNavs || []).map(({ display_name, internal_name, icon }, subIndex) => {
                        const IconComponent = (icon && MuiIcons[normalizeIconName(icon)]) || HomeOutlinedIcon ;
                        const subKey = internal_name || `unnamed-sub-${subIndex}`;
                        return <Item key={`child-${itemKey}-${subKey}`} title={display_name || "Unnamed Sub"} to={paths[internal_name] || "/"} icon={<IconComponent />} onClick={isMobile ? handleToggle : undefined} />;
                      })}
                    </SubMenu>
                  );
                }
              })}
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

const Sidebar = () => {
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem("isSideBarOpen") === "true");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleToggle = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      localStorage.setItem("isSideBarOpen", !isCollapsed);
      setIsCollapsed(!isCollapsed);
    }
  };

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  return (
    <>
      {isMobile ? (
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
            variant="temporary"
            PaperProps={{
              sx: {
                backgroundColor: (theme) => colorCodes(theme.palette.mode).background.dark,
                height: "100vh",
              },
            }}
          >
            <SidebarContent isCollapsed={false} handleToggle={() => setDrawerOpen(false)} isMobile />
          </Drawer>
        </>
      ) : (
        <SidebarContent isCollapsed={isCollapsed} handleToggle={handleToggle} isMobile={false} />
      )}
    </>
  );
};

export default Sidebar;
