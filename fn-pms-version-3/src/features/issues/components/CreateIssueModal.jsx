// Author: Copilot
// Created: 18th Mar 2026
// Description: Modal for creating a new issue
// Version: 1.1.0

import React, { useState, useMemo } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Box, CircularProgress, Autocomplete, IconButton, Typography } from "@mui/material";
import { Add as AddIcon, AccountTree as AccountTreeIcon, ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon, Close as CloseIcon } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useCreateIssue, useIssueTypes, useCreateIssueType, useProjectUserStories } from "../hooks/useIssues";
import { showToast } from "../../../util/feedback/ToastService";

// Tree building helper
const buildStoryTree = (items, parentId = null) => items.filter((s) => (s.parent_user_story_id ?? null) === parentId).map((s) => ({ ...s, children: buildStoryTree(items, s.id) }));

// Recursive story node used in the picker dialog
const StoryNodePicker = ({ story, depth, selectedId, onSelect }) => {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = story.children?.length > 0;
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          pl: depth * 2 + 0.5,
          py: 0.4,
          pr: 1,
          cursor: "pointer",
          borderRadius: 1,
          bgcolor: selectedId === story.id ? "primary.light" : "transparent",
          "&:hover": { bgcolor: selectedId === story.id ? "primary.light" : "action.hover" },
        }}
        onClick={() => onSelect(story.id, story.title)}
      >
        <IconButton
          size="small"
          sx={{ p: 0, mr: 0.25, visibility: hasChildren ? "visible" : "hidden" }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          {open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
        </IconButton>
        <AccountTreeIcon sx={{ fontSize: 13, mr: 0.75, color: "text.secondary" }} />
        <Typography variant="body2" sx={{ fontWeight: selectedId === story.id ? 600 : 400 }}>
          {story.title}
        </Typography>
      </Box>
      {hasChildren && open && story.children.map((c) => <StoryNodePicker key={c.id} story={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />)}
    </Box>
  );
};

// Story picker dialog
const StoryPickerDialog = ({ open, onClose, stories, selectedId, onSelect }) => {
  const tree = useMemo(() => buildStoryTree(stories), [stories]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Select User Story
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 1, maxHeight: 380, overflowY: "auto" }}>
        <Box
          sx={{ px: 1, py: 0.5, cursor: "pointer", borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }}
          onClick={() => {
            onSelect(null, null);
            onClose();
          }}
        >
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            — None —
          </Typography>
        </Box>
        {stories.length === 0 ? (
          <Typography variant="body2" color="text.secondary" p={1}>
            No user stories in this project.
          </Typography>
        ) : (
          tree.map((s) => (
            <StoryNodePicker
              key={s.id}
              story={s}
              depth={0}
              selectedId={selectedId}
              onSelect={(id, title) => {
                onSelect(id, title);
                onClose();
              }}
            />
          ))
        )}
      </DialogContent>
    </Dialog>
  );
};

const CreateIssueModal = ({ open, onClose, projectId }) => {
  const { mutate: createIssue, isPending } = useCreateIssue();
  const { data: typesData, isLoading: typesLoading } = useIssueTypes();
  const { mutate: createIssueType, isPending: isCreatingType } = useCreateIssueType();
  const { data: storiesData } = useProjectUserStories(projectId);
  const [storyPickerOpen, setStoryPickerOpen] = useState(false);
  const [selectedStoryTitle, setSelectedStoryTitle] = useState("");

  // Only show non-subtask types (hierarchy_level < 3) for standalone issue creation
  const issueTypes = useMemo(() => (typesData?.data || []).filter((t) => t.hierarchy_level < 3), [typesData]);
  const stories = useMemo(() => storiesData?.data?.data || [], [storiesData]);

  const [typeInputValue, setTypeInputValue] = useState("");

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      issue_type_id: "",
      priority: "medium",
      user_story_id: "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      description: Yup.string(),
      issue_type_id: Yup.string().required("Issue Type is required"),
      priority: Yup.string().required("Priority is required"),
      user_story_id: Yup.string(),
    }),
    onSubmit: (values) => {
      createIssue(
        { projectId, ...values },
        {
          onSuccess: () => {
            formik.resetForm();
            setTypeInputValue("");
            setSelectedStoryTitle("");
            onClose();
          },
          onError: (error) => {
            showToast({ type: "error", message: error?.message || "Failed to create issue" });
          },
        },
      );
    },
  });

  // Build options: existing non-subtask types + "Create new" option if user typed something new
  const typeOptions = useMemo(() => {
    const opts = issueTypes.map((t) => ({ id: t.id, label: t.name, hierarchy_level: t.hierarchy_level }));
    const trimmed = typeInputValue.trim();
    if (trimmed && !issueTypes.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      opts.push({ id: "__new__", label: trimmed, isNew: true });
    }
    return opts;
  }, [issueTypes, typeInputValue]);

  const selectedTypeOption = typeOptions.find((o) => o.id === formik.values.issue_type_id) || null;

  const handleTypeSelect = (event, option) => {
    if (!option) {
      formik.setFieldValue("issue_type_id", "");
      return;
    }

    if (option.isNew) {
      // Create new issue type at Story level (2) — never Subtask — then select it
      createIssueType(
        { name: option.label, hierarchy_level: 2 },
        {
          onSuccess: (response) => {
            // response is the type object directly (after axios interceptor + .data unwrap)
            const id = response?.id || response?.data?.id;
            if (id) {
              formik.setFieldValue("issue_type_id", id);
            }
          },
        },
      );
    } else {
      formik.setFieldValue("issue_type_id", option.id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Issue</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Title */}
            <TextField fullWidth label="Title" name="title" value={formik.values.title} onChange={formik.handleChange} error={formik.touched.title && Boolean(formik.errors.title)} helperText={formik.touched.title && formik.errors.title} />

            {/* Description */}
            <TextField fullWidth multiline rows={4} label="Description" name="description" value={formik.values.description} onChange={formik.handleChange} />

            {/* Issue Type - Autocomplete with inline create */}
            <Autocomplete
              options={typeOptions}
              getOptionLabel={(option) => option.label || ""}
              value={selectedTypeOption}
              onChange={handleTypeSelect}
              inputValue={typeInputValue}
              onInputChange={(e, value) => setTypeInputValue(value)}
              loading={typesLoading || isCreatingType}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.isNew ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AddIcon fontSize="small" color="primary" />
                      <span>Create &quot;{option.label}&quot;</span>
                    </Box>
                  ) : (
                    option.label
                  )}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Issue Type"
                  error={formik.touched.issue_type_id && Boolean(formik.errors.issue_type_id)}
                  helperText={formik.touched.issue_type_id && formik.errors.issue_type_id}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {(typesLoading || isCreatingType) && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {/* Priority */}
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select name="priority" label="Priority" value={formik.values.priority} onChange={formik.handleChange}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            {/* User Story — tree picker button */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Link to User Story (optional)
              </Typography>
              <Button variant="outlined" size="small" fullWidth onClick={() => setStoryPickerOpen(true)} startIcon={<AccountTreeIcon sx={{ fontSize: 16 }} />} sx={{ justifyContent: "flex-start", textTransform: "none" }}>
                {selectedStoryTitle || (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    — Pick from project tree —
                  </Typography>
                )}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isPending} startIcon={isPending ? <CircularProgress size={20} /> : null}>
            Create
          </Button>
        </DialogActions>
      </form>

      <StoryPickerDialog
        open={storyPickerOpen}
        onClose={() => setStoryPickerOpen(false)}
        stories={stories}
        selectedId={formik.values.user_story_id}
        onSelect={(id, title) => {
          formik.setFieldValue("user_story_id", id || "");
          setSelectedStoryTitle(title || "");
        }}
      />
    </Dialog>
  );
};

export default CreateIssueModal;
