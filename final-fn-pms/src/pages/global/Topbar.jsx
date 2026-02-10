// // Author: Gururaj
// // Created: 23rd May 2025
// // Description: Main Top bar for the project.
// // Version: 1.0.0
// // pages/global/Topbar.jsx
// // Modified: 

// import { useNavigate } from "react-router-dom";
// import { useContext, useState } from "react";

// import { Box, IconButton, useTheme } from "@mui/material";
// import InputBase from "@mui/material/InputBase";
// import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
// import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
// import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
// import SearchIcon from "@mui/icons-material/Search";
// import Menu from "@mui/material/Menu";
// import MenuItem from "@mui/material/MenuItem";
// import { Badge } from "@mui/material";
// import { Link } from "react-router-dom";

// import { ColorModeContext, colorCodes } from "../../theme";
// import { paths } from "../../util/urls";
// import { useSelector } from "react-redux";

// const Topbar = () => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);

//   const navigate = useNavigate();

//   const unreadCount = useSelector(
//     (state) => state.notification.count
//   );


//   const handleMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };
//   const theme = useTheme();
//   const colors = colorCodes(theme.palette.mode);
//   const colorMode = useContext(ColorModeContext);

//   return (
//     <Box
//       display="flex"
//       justifyContent="space-between"
//       p={2}
//       position={"sticky"}
//       top={0}
//       bgcolor={colors.background["light"]}
//       zIndex={3}
//     >
//       {/* SEARCH BAR */}
//       <Box
//         display="flex"
//         backgroundColor={colors.mainBackground["dark"]}
//         borderRadius="3px"
//         sx={{
//           ml: {
//             xs: 4, // marginLeft = theme.spacing(5) → 40px on extra-small screens
//             md: 0, // marginLeft = 0 on medium and larger
//           },
//         }}
//       >
//         <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
//         <IconButton type="button" sx={{ p: 1 }}>
//           <SearchIcon />
//         </IconButton>
//       </Box>

//       {/* ICONS */}
//       <Box display="flex">
//         <IconButton onClick={colorMode.toggleColorMode}>
//           {theme.palette.mode === "dark" ? (
//             <DarkModeOutlinedIcon />
//           ) : (
//             <LightModeOutlinedIcon />
//           )}
//         </IconButton>
//         <IconButton
//           component={Link}
//           to="/notifications"
//           aria-label="notifications"
//         >
//           <Badge
//             badgeContent={unreadCount}
//             // color="error"
//             invisible={unreadCount === 0}
//           >
//             <NotificationsOutlinedIcon />
//           </Badge>
//         </IconButton>
//         {/* <IconButton>
//           <SettingsOutlinedIcon />
//         </IconButton> */}
//         <IconButton onClick={handleMenuOpen}>
//           <PersonOutlinedIcon />
//         </IconButton>
//         <Menu
//           anchorEl={anchorEl}
//           open={open}
//           onClose={handleMenuClose}
//           PaperProps={{
//             sx: {
//               backgroundColor: colors.mainBackground["light"],
//               color: colors.text["dark"],
//               width: "150px",
//             },
//           }}
//           anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//           transformOrigin={{ vertical: "top", horizontal: "right" }}
//         >
//           <MenuItem
//             onClick={() => {
//               handleMenuClose();
//               navigate(paths.profile);
//             }}
//           >
//             Profile
//           </MenuItem>
//           <MenuItem
//             onClick={() => {
//               handleMenuClose();
//               navigate(paths.reset_password);
//             }}
//           >
//             Reset Password
//           </MenuItem>
//           <MenuItem
//             onClick={() => {
//               handleMenuClose();
//               navigate(paths.logout);
//             }}
//           >
//             Logout
//           </MenuItem>
//         </Menu>
//       </Box>
//     </Box>
//   );
// };

// export default Topbar;
// pages/global/Topbar.jsx

import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Badge,
  useTheme,
  Divider,
  ListItemIcon,
} from "@mui/material";

import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";


import {
  Menu as MenuIcon,
  NotificationsOutlined as NotificationsIcon,
  Brightness4,
  Brightness7,
  Logout as LogoutIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Business as OrgIcon,
} from "@mui/icons-material";

import { ColorModeContext, colorCodes } from "../../theme";
import { paths } from "../../util/urls";
import { useOrganization } from "../../context/OrganizationContext";
import WorkspaceSwitcher from "../../components/WorkspaceSwitcher";
import CreateOrganizationModal from "../../components/organization/CreateOrganizationModal";
import { auth } from "@spidy092/auth-client";

const Topbar = () => {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();

  const { currentOrganization, organizations, switchOrganization, loading: orgLoading } = useOrganization();

  console.log('currentOrganization', currentOrganization);


  const unreadCount = useSelector((state) => state.notification.count);

  const [orgMenuAnchor, setOrgMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
   const { user = {} } = useSelector((state) => state.auth || {});

   console.log(user);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);


  // Redirect if no organization selected
  useEffect(() => {
    if (!orgLoading && !currentOrganization) {
      navigate('/select-organization', { replace: true });
    }
  }, [currentOrganization, orgLoading, navigate]);

  /* ----------------------------------
     Fetch user (optional)
  ---------------------------------- */
  const getUserInitial = () => {
    const name = user?.firstName || user?.lastName || "U";
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
      setUserMenuAnchor(null);
      try {
        await auth.logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: colors.background.light,
        color: colors.text.dark,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* Left: Logo / App Name */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* <Typography variant="h6" fontWeight={700}>
            final-fn-pms
          </Typography> */}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Right Actions */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* Theme Toggle */}

          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlinedIcon />
            ) : (
              <LightModeOutlinedIcon />
            )}
          </IconButton>

          {/* Notifications */}
          <IconButton
            component={Link}
            to="/notifications"
            aria-label="notifications"
          >
            <Badge badgeContent={unreadCount} invisible={unreadCount === 0}>
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Organization Switcher */}
          <Tooltip title="Switch Organization">
            <IconButton onClick={(e) => setOrgMenuAnchor(e.currentTarget)}>
              <OrgIcon />
            </IconButton>
          </Tooltip>

          {/* Workspace Switcher */}
          {currentOrganization && (
            <Box sx={{ mx: 1 }}>
              <WorkspaceSwitcher variant="button" />
            </Box>
          )}

          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  fontSize: "1rem",
                }}
              >
                {getUserInitial()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Organization Menu */}
      <Menu
        anchorEl={orgMenuAnchor}
        open={Boolean(orgMenuAnchor)}
        onClose={() => setOrgMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 250, borderRadius: 2, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Switch Organization</Typography>
        </Box>
        <Divider />
        {organizations?.map((org, index) => (
          <MenuItem
            key={`org-${org.id || org.org_id}-${index}`}
            selected={(currentOrganization?.id || currentOrganization?.org_id) === (org.id || org.org_id)}
            onClick={() => { switchOrganization(org.id || org.org_id); setOrgMenuAnchor(null); }}
          >
            <ListItemIcon><OrgIcon fontSize="small" /></ListItemIcon>
            {org.name || org.org_name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { setOrgMenuAnchor(null); setCreateOrgModalOpen(true); }}>
          <ListItemIcon><OrgIcon fontSize="small" /></ListItemIcon>
          Create New Organization
        </MenuItem>
      </Menu>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        open={createOrgModalOpen}
        onClose={() => setCreateOrgModalOpen(false)}
        onSuccess={(newOrg) => console.log('Created org:', newOrg?.name)}
      />
      

      {/* User Dropdown */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{
          sx: {
            minWidth: 200,
            borderRadius: 2,
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user?.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            navigate(paths.profile);
          }}
        >
          <ProfileIcon fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>

        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            navigate('/settings');
          }}
        >
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          settings
        </MenuItem>

        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Topbar;


