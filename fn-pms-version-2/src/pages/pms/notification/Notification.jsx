import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  CircularProgress,
  IconButton,
  ListItemIcon,
  useTheme
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import backendRequest from "../../../util/request";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";

import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { formatTextForDataTable } from "../../../util/helper";
import { colorCodes } from "../../../theme";
import { Link as RouterLink } from "react-router-dom";
import { Link } from "@mui/material";
import { useDispatch } from "react-redux";
import { decrementNotificationCount, setNotificationCount } from "../../../store/notificationSlice";

export default function NotificationPanel() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const dispatch = useDispatch();


  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  // fetch page
  const fetchPage = useCallback(async (p = 1) => {
    if (loading || (!hasNextPage && p !== 1)) return;

    setLoading(true);
    try {
      const res = await backendRequest({
        endpoint: BACKEND_ENDPOINT.notification,
        querySets: `?page=${p}`,
      });

      const newData = res?.data?.data || [];
      const pagination = res?.data?.pagination || {};

      setItems(prev => (p === 1 ? newData : [...prev, ...newData]));
      setHasNextPage(Boolean(pagination.hasNextPage ?? newData.length > 0));
    } catch (err) {
      console.error("Failed fetching notifications", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage]);

  useEffect(() => {
    fetchPage(1);
    setPage(1);
  }, []);

  useEffect(() => {
    if (page === 1) return;
    fetchPage(page);
  }, [page, fetchPage]);

  // infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && hasNextPage && !loading) {
            setPage(prev => prev + 1);
          }
        });
      },
      { rootMargin: "200px" }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, loading]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const openNotification = (item) => {
    setActive(item);

    if (!item.is_read) {
      setItems(prev =>
        prev.map(n => n.id === item.id ? { ...n, is_read: 1 } : n)
      );

      backendRequest({
        endpoint: BACKEND_ENDPOINT.mark_read(item.id),
      })
        .then(res => {
          if (res?.success) {
            dispatch(decrementNotificationCount());
          } else {
            setItems(prev =>
              prev.map(n =>
                n.id === item.id ? { ...n, is_read: 0 } : n
              )
            );
          }
        })
        .catch(err => {
          console.error("mark_read failed", err);
           setItems(prev =>
            prev.map(n =>
              n.id === item.id ? { ...n, is_read: 0 } : n
            )
          );
        });
    }
  };

  // left list item
  const renderListItem = (n) => (
    <Box key={n.id}>
      <ListItem
        alignItems="flex-start"
        sx={{
          px: 2,
          py: 1.5,
          "&:hover": { backgroundColor: "action.hover" },
          backgroundColor: n.is_read
            ? "background.paper"
            : "rgba(25,118,210,0.05)",
          cursor: "pointer",
          display: "flex",
          gap: 1.5
        }}
        onClick={() => openNotification(n)}
      >

        {/* Icon */}
        <ListItemIcon style={{minWidth: "unset", margin: "auto"}}>
          {n.is_read ? (
            <NotificationsNoneIcon color="action" />
          ) : (
            <NotificationsActiveIcon color="primary" />
          )}
        </ListItemIcon>

        <ListItemText
          primary={
            <Box display="flex" justifyContent="space-between">
              <Typography sx={{ fontWeight: 600 }}>{n.entity_type}</Typography>
              <Typography variant="caption" color="text.secondary">
                {timeAgo(n.created_at)}
              </Typography>
            </Box>
          }
          secondary={
            <Typography variant="body2" color="text.secondary">
              {formatTextForDataTable(n.title)}
            </Typography>
          }
        />
      </ListItem>

      <Divider />
    </Box>
  );

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Notifications
      </Typography>

      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 160px)",
          bgcolor: "background.paper",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 2
        }}
      >
        {/* LEFT LIST */}
        <Box
          sx={{
            width: { xs: active ? "0%" : "40%", sm: "35%", md: "30%" },
            minWidth: { xs: active ? "0" : "260px", sm: "260px" },
            borderRight: "1px solid",
            borderColor: "divider",
            overflowY: "auto",
            transition: "0.25s"
          }}
        >
          <List disablePadding>
            {items.map(renderListItem)}

            <Box ref={sentinelRef} sx={{ height: 20 }} />

            {loading && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </List>
        </Box>

        {/* RIGHT PREVIEW */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            transition: "0.25s",
            display: active ? "block" : { xs: "none", sm: "block" }
          }}
        >
          {/* Mobile Back Button */}
          <Box sx={{ display: { xs: "block", sm: "none" }, mb: 2 }}>
            <IconButton onClick={() => setActive(null)}>
              <ArrowBackIcon />
            </IconButton>
          </Box>

          {!active && (
            <Box sx={{ textAlign: "center", mt: 10 }}>
              <Typography color="text.secondary">
                Select a notification to view details
              </Typography>
            </Box>
          )}

          {active && (
            <>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Avatar sx={{ bgcolor: colors.background.light, color: colors.info.dark, width: 48, height: 48 }}>
                  {active.title?.[0]?.toUpperCase()}
                </Avatar>

                <Box>
                  <Typography variant="h6" fontSize={"16px"}>{active.title}</Typography>
                  <Typography variant="caption" >
                    {new Date(active.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontSize={"15px"}>{active.title}</Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", fontWeight:"bold" }}>
                {active.message}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary"> • Scope: {active.scope || "—"}</Typography>
                <Typography variant="body2" color="text.secondary"> • Type: {active.entity_type || "—"}</Typography>
              </Box>

              {
                active.entity_type === "issue" && (
                  <Box sx={{ mt: 2 }}>
                    <Link
                        component={RouterLink}
                        to={`${paths.issues}?department=${active.department_id}&project=${active.project_id}&issue=${active.entity_id}`}
                        sx={{
                          fontSize: 14,
                          color: "primary.main",
                          fontWeight: 500,
                          textDecoration: "none",
                          "&:hover": {
                            textDecoration: "underline",
                            color: "primary.dark",
                          }
                        }}
                      >
                        Visit
                      </Link>
                  </Box>
                )
              }
              

            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
