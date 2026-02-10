// Author: Gururaj
// Created: 23rd May 2025
// Description: component for loading skeliton for sidebar menus (not for user info in sidebar) .
// Version: 1.0.0
// components/skeleton/SidebarSkeleton.jsx
// Modified: 


import { Box, List, ListItem, ListItemIcon, ListItemText, Skeleton, Typography } from "@mui/material";

const SidebarSkeleton = ({ isCollapsed }) => {
  return (
    <Box paddingLeft={isCollapsed ? undefined : "10%"} pt={2}>
      {/* Simulate a group heading */}
      <Typography variant="h6" color="text.secondary" sx={{ m: "15px 0 5px 20px" }}>
        <Skeleton width={isCollapsed ? 24 : 100} />
      </Typography>

      <List>
        {[...Array(5)].map((_, i) => (
          <ListItem key={i} disablePadding sx={{ px: 2, py: 1.5 }}>
            <ListItemIcon>
              <Skeleton variant="circular" />
            </ListItemIcon>
            {!isCollapsed && <ListItemText primary={<Skeleton variant="text" />} />}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SidebarSkeleton;
