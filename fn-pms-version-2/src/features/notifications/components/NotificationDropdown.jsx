// Author: Copilot
// Created: 18th Mar 2026
// Description: Services for Notifications (React Component)
// Version: 1.0.0

import React, { useState } from "react";
import { Badge, IconButton, Menu, MenuItem, ListItemText, Typography, Box, Button, Divider, List, Avatar, ListItem } from "@mui/material";
import { NotificationsOutlined } from "@mui/icons-material";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    const { data: countData } = useUnreadCount();
    const unreadCount = countData?.unread_count || 0;
    
    // Only fetch list when open for performance optimization? Or prefetch?
    // Let's rely on standard query cache.
    const { data: notificationsData, isLoading } = useNotifications(1);
    const notifications = notificationsData?.notifications || [];

    const markReadMutation = useMarkAsRead();
    const markAllReadMutation = useMarkAllAsRead();

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        // Mark read
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        handleClose();
        // Determine navigation based on type?
        // Assume notification has redirect_url or type
        if (notification.redirect_url) {
             navigate(notification.redirect_url);
        } else {
             navigate("/notifications");
        }
    };

    const handleMarkAllRead = () => {
        markAllReadMutation.mutate();
    };

    return (
        <>
            <IconButton onClick={handleOpen} color="inherit">
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsOutlined />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: 480,
                        overflowY: 'auto'
                    }
                }}
            >
                <Box px={2} py={1} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllRead}>
                            Mark all read
                        </Button>
                    )}
                </Box>
                <Divider />
                {isLoading ? (
                    <Box p={2} textAlign="center"><Typography>Loading...</Typography></Box>
                ) : notifications.length === 0 ? (
                    <Box p={2} textAlign="center"><Typography color="textSecondary">No notifications</Typography></Box>
                ) : (
                    <List disablePadding>
                        {notifications.slice(0, 5).map((notification) => (
                            <ListItem 
                                key={notification.id} 
                                button 
                                onClick={() => handleNotificationClick(notification)}
                                sx={{ 
                                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" fontWeight={notification.is_read ? 'normal' : 'bold'}>
                                            {notification.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="caption" component="span" display="block" color="textPrimary">
                                                {notification.message}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </Typography>
                                        </>
                                    }
                                />
                                {!notification.is_read && (
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', ml: 1 }} />
                                )}
                            </ListItem>
                        ))}
                    </List>
                )}
                <Divider />
                <Box p={1} textAlign="center">
                    <Button fullWidth onClick={() => { handleClose(); navigate('/notifications'); }}>
                        View All
                    </Button>
                </Box>
            </Menu>
        </>
    );
};

export default NotificationDropdown;
