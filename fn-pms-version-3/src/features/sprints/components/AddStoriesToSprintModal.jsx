// Author: Copilot
// Description: Modal to add User Stories (backlog) to a Sprint
// Version: 1.0.0

import React, { useState, useMemo } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, List, ListItem, ListItemText, ListItemIcon, Typography, Chip, CircularProgress, Alert, TextField, InputAdornment, Stack, Box } from "@mui/material";
import { Search } from "@mui/icons-material";
import { useBacklogStories } from "../../backlog/hooks/useBacklog";
import { useAddStoriesToSprint } from "../hooks/useSprints";
import { showToast } from "../../../util/feedback/ToastService";

const priorityColors = { critical: "error", high: "warning", medium: "info", low: "default" };

const AddStoriesToSprintModal = ({ open, onClose, projectId, sprintId }) => {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const { data: backlogData, isLoading } = useBacklogStories(projectId);
  const addMutation = useAddStoriesToSprint();

  const stories = useMemo(() => {
    const all = Array.isArray(backlogData?.data) ? backlogData.data : backlogData?.data?.data || [];
    // Only show stories that are not yet completed
    return all.filter((s) => s.status !== "completed" && s.issueStatus?.category !== "done");
  }, [backlogData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return stories;
    const q = search.toLowerCase();
    return stories.filter((s) => s.title.toLowerCase().includes(q) || s.feature?.name?.toLowerCase().includes(q));
  }, [stories, search]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((s) => s.id));
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    addMutation.mutate(
      { sprintId, storyIds: selected },
      {
        onSuccess: () => {
          showToast({ type: "success", message: `${selected.length} story(s) added to sprint` });
          setSelected([]);
          setSearch("");
          onClose();
        },
        onError: (err) => showToast({ type: "error", message: err?.message || "Failed to add stories" }),
      },
    );
  };

  const handleClose = () => {
    setSelected([]);
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Stories to Sprint</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Search bar */}
        <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
          <TextField
            size="small"
            fullWidth
            placeholder="Search stories or features…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : filtered.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            {stories.length === 0 ? "No backlog stories found. Create User Stories first." : "No stories match your search."}
          </Alert>
        ) : (
          <>
            {/* Select-all row */}
            <ListItem dense onClick={toggleAll} sx={{ cursor: "pointer", borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox edge="start" checked={selected.length === filtered.length && filtered.length > 0} indeterminate={selected.length > 0 && selected.length < filtered.length} size="small" disableRipple />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={500}>
                    {selected.length === filtered.length ? "Deselect all" : `Select all (${filtered.length})`}
                  </Typography>
                }
              />
            </ListItem>

            <List disablePadding sx={{ maxHeight: 400, overflowY: "auto" }}>
              {filtered.map((story) => (
                <ListItem key={story.id} dense onClick={() => toggle(story.id)} sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox edge="start" checked={selected.includes(story.id)} size="small" tabIndex={-1} disableRipple />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap>
                        {story.title}
                      </Typography>
                    }
                    secondary={
                      <Stack direction="row" spacing={0.5} mt={0.25} alignItems="center">
                        {story.feature?.name && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {story.feature.name}
                          </Typography>
                        )}
                        <Chip label={story.priority} size="small" color={priorityColors[story.priority] || "default"} sx={{ height: 16, fontSize: "0.6rem" }} />
                        {story.story_points && (
                          <Typography variant="caption" color="text.secondary">
                            {story.story_points} pts
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
          {selected.length} selected
        </Typography>
        <Button onClick={handleClose} disabled={addMutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={addMutation.isPending || selected.length === 0} startIcon={addMutation.isPending ? <CircularProgress size={14} /> : null}>
          {addMutation.isPending ? "Adding…" : `Add ${selected.length > 0 ? selected.length : ""} Stories`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStoriesToSprintModal;
