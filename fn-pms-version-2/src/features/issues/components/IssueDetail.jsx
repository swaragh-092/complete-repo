// Author: Copilot
// Modified: 24th Mar 2026
// Description: Issue Detail — compact layout, user enrichment, attachment management, sub-task tree
// Version: 2.0.0

import React, { useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Grid, Chip, Select, MenuItem, FormControl, InputLabel, Avatar, List, ListItem, ListItemText, Divider, TextField, Button, CircularProgress, IconButton, Menu, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Collapse, Tooltip } from "@mui/material";
import { useIssue, useIssueTree, useComments, useProjectMembers, useProjectUserStories, useLinkIssueToUserStory, useWorkflow, useChangeStatus, useAddComment, useUpdateComment, useDeleteComment, useAttachments, useUploadAttachment, useDeleteAttachment, useCreateIssue, useIssueTypes } from "../hooks/useIssues";
import { format } from "date-fns";
import { paths } from "../../../util/urls";
import { useAuth } from "@spidy092/auth-client";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { showToast } from "../../../util/feedback/ToastService";
import * as issueService from "../api/issue.service";

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_COLOR = { high: "error", critical: "error", medium: "warning", low: "success" };

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const displayName = (userDetails) => {
  if (!userDetails) return null;
  if (userDetails.username) return userDetails.username;
  const fn = userDetails.first_name || "";
  const ln = userDetails.last_name || "";
  const full = `${fn} ${ln}`.trim();
  return full || userDetails.email || null;
};

// Build tree from flat array using a parentKey field
const buildStoryTree = (items, parentId = null) => items.filter((s) => (s.parent_user_story_id ?? null) === parentId).map((s) => ({ ...s, children: buildStoryTree(items, s.id) }));

// ─── User Story Tree Picker ──────────────────────────────────────────────────

const StoryTreeNode = ({ story, depth, selectedId, onSelect }) => {
  const hasChildren = story.children?.length > 0;
  const [open, setOpen] = useState(depth === 0);
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
      {hasChildren && open && (
        <Box>
          {story.children.map((child) => (
            <StoryTreeNode key={child.id} story={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const UserStoryTreePickerDialog = ({ open, onClose, stories, selectedId, onSelect }) => {
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
            — Unlink story —
          </Typography>
        </Box>
        {stories.length === 0 ? (
          <Typography variant="body2" color="text.secondary" p={1}>
            No user stories found.
          </Typography>
        ) : (
          tree.map((s) => (
            <StoryTreeNode
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

// ─── Add Sub-task Dialog ─────────────────────────────────────────────────────

const AddSubTaskDialog = ({ open, onClose, projectId, parentIssueId, parentHierarchyLevel }) => {
  const { data: typesData } = useIssueTypes();
  const createMutation = useCreateIssue();
  const [form, setForm] = useState({ title: "", priority: "medium", issue_type_id: "" });

  // Only allow types strictly deeper than the parent's hierarchy level
  const eligibleTypes = useMemo(() => {
    const all = typesData?.data || [];
    if (parentHierarchyLevel != null) {
      return all.filter((t) => t.hierarchy_level > parentHierarchyLevel);
    }
    // Parent level unknown — exclude top-level (1) types to stay safe
    return all.filter((t) => t.hierarchy_level > 1);
  }, [typesData, parentHierarchyLevel]);

  const hasEligibleTypes = eligibleTypes.length > 0;
  // Pre-select first eligible type when list loads
  const typeId = form.issue_type_id || eligibleTypes[0]?.id || "";

  const handleSubmit = () => {
    if (!form.title.trim() || !typeId) return;
    createMutation.mutate(
      { projectId, title: form.title, priority: form.priority, issue_type_id: typeId, parent_id: parentIssueId },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Sub-task created!" });
          setForm({ title: "", priority: "medium", issue_type_id: "" });
          onClose();
        },
        onError: (err) => showToast({ type: "error", message: err?.message || "Failed to create sub-task" }),
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>Add Sub-task</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={1.5} pt={0.5}>
          {!hasEligibleTypes ? (
            <Typography variant="body2" color="error.main">
              No sub-task types available for this issue level. Please create an issue type with a deeper hierarchy level first.
            </Typography>
          ) : (
            <>
              <TextField fullWidth label="Title" size="small" autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              {eligibleTypes.length > 1 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={typeId} onChange={(e) => setForm((f) => ({ ...f, issue_type_id: e.target.value }))}>
                    {eligibleTypes.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select label="Priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ pt: 0 }}>
        <Button size="small" onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button size="small" variant="contained" onClick={handleSubmit} disabled={createMutation.isPending || !hasEligibleTypes || !form.title.trim()} startIcon={createMutation.isPending ? <CircularProgress size={14} /> : <AddIcon />}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Comment Item ────────────────────────────────────────────────────────────

const CommentItem = ({ comment, currentUserId, issueId, userMap }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [anchorEl, setAnchorEl] = useState(null);

  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();

  // author name from enriched user_details, falling back to userMap (project members), then truncated id
  const authorName = displayName(comment.user_details) || displayName(userMap?.[comment.user_id]) || `User …${comment.user_id?.slice(-6) || ""}`;

  const authorInitial = authorName?.[0]?.toUpperCase() || "?";

  const isAuthor = currentUserId && comment.user_id === currentUserId;

  const handleSave = () => {
    if (!editContent.trim()) return;
    updateMutation.mutate({ issueId, commentId: comment.id, content: editContent }, { onSuccess: () => setIsEditing(false) });
  };

  return (
    <>
      <ListItem
        alignItems="flex-start"
        sx={{ px: 0, py: 0.75 }}
        secondaryAction={
          isAuthor && !isEditing ? (
            <>
              <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(comment.content);
                    setAnchorEl(null);
                  }}
                >
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (window.confirm("Delete this comment?")) {
                      deleteMutation.mutate({ issueId, commentId: comment.id });
                    }
                    setAnchorEl(null);
                  }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : null
        }
      >
        <Box display="flex" gap={1} width="100%" pr={isAuthor ? 4 : 0}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, mt: 0.25, flexShrink: 0 }}>{authorInitial}</Avatar>
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="baseline" gap={1} flexWrap="wrap">
              <Typography variant="subtitle2" fontSize="0.8rem">
                {authorName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(comment.created_at), "MMM d, yyyy HH:mm")}
              </Typography>
            </Box>
            {isEditing ? (
              <Box mt={0.5}>
                <TextField fullWidth multiline size="small" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                <Box display="flex" justifyContent="flex-end" mt={0.5} gap={0.5}>
                  <IconButton size="small" onClick={() => setIsEditing(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="primary" onClick={handleSave} disabled={updateMutation.isPending}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-wrap", mt: 0.25, wordBreak: "break-word" }}>
                {comment.content}
              </Typography>
            )}
          </Box>
        </Box>
      </ListItem>
      <Divider component="li" />
    </>
  );
};

// ─── Attachment List ─────────────────────────────────────────────────────────

const AttachmentList = ({ issueId, currentUserId }) => {
  const { data: attachmentsData, isLoading } = useAttachments(issueId);
  const deleteMutation = useDeleteAttachment();

  const attachments = useMemo(() => {
    const raw = attachmentsData?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(attachmentsData)) return attachmentsData;
    return [];
  }, [attachmentsData]);

  const handleDownload = async (attachmentId, fileName) => {
    try {
      const blob = await issueService.downloadAttachment(attachmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showToast({ type: "error", message: "Failed to download file" });
    }
  };

  const handleDelete = (attachmentId) => {
    if (!window.confirm("Delete this attachment?")) return;
    deleteMutation.mutate(
      { issueId, attachmentId },
      {
        onSuccess: () => showToast({ type: "success", message: "Attachment deleted" }),
        onError: () => showToast({ type: "error", message: "Failed to delete attachment" }),
      },
    );
  };

  if (isLoading) return <CircularProgress size={18} />;

  if (attachments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        No attachments.
      </Typography>
    );
  }

  return (
    <List dense disablePadding>
      {attachments.map((file) => {
        const isOwner = file.user_id === currentUserId;
        const name = file.file_name || file.filename || file.name || "file";
        return (
          <ListItem
            key={file.id}
            disablePadding
            sx={{ py: 0.25 }}
            secondaryAction={
              <Box display="flex" gap={0.5}>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={() => handleDownload(file.id, name)}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isOwner && (
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(file.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            }
          >
            <ListItemIcon sx={{ minWidth: 30 }}>
              <InsertDriveFileIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {name}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(file.file_size)} · {format(new Date(file.created_at || new Date()), "MMM d, yyyy")}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const IssueDetail = () => {
  const { projectId, issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id || user?.sub;

  // Queries
  const { data: issueData, isLoading: issueLoading, isError: issueError, error: issueQueryError } = useIssue(issueId);
  const { data: treeData, isLoading: treeLoading } = useIssueTree(issueId);
  const { data: commentsData } = useComments(issueId);
  const { data: membersData } = useProjectMembers(projectId);
  const { data: workflowData } = useWorkflow(projectId);
  const { data: storiesData } = useProjectUserStories(projectId);

  // Mutations
  const changeStatusMutation = useChangeStatus();
  const linkUserStoryMutation = useLinkIssueToUserStory();
  const addCommentMutation = useAddComment();
  const uploadAttachmentMutation = useUploadAttachment();

  // UI state
  const [newComment, setNewComment] = useState("");
  const [storyPickerOpen, setStoryPickerOpen] = useState(false);
  const [addSubTaskOpen, setAddSubTaskOpen] = useState(false);
  const fileInputRef = useRef(null);

  // ── Derived data (all before early returns) ──────────────────────────────

  const issue = issueData?.data || (issueData?.success !== false ? issueData : null);

  // userMap: auth user_id → user_details (for comment display)
  const userMap = useMemo(() => {
    const membersList = membersData?.data?.members?.data || membersData?.data?.members || [];
    const map = {};
    membersList.forEach((m) => {
      if (m.user_id && m.user_details) map[m.user_id] = m.user_details;
    });
    return map;
  }, [membersData]);

  const statuses = workflowData?.data?.statuses || [];
  const comments = commentsData?.data || [];

  const stories = useMemo(() => storiesData?.data?.data || [], [storiesData]);

  // Determine whether the current user is a lead in this project.
  // membersData contains full member records with project_role ('member' | 'lead' | 'viewer' | 'tester').
  // isLead gates lead-only UI actions (e.g., linking stories, managing workflow transitions).
  const membersList = useMemo(
    () => membersData?.data?.members?.data || membersData?.data?.members || [],
    [membersData],
  );
  const currentMember = membersList.find((m) => m.user_id === currentUserId);
  const isLead = currentMember?.project_role === "lead";

  const children = treeData?.data?.children || [];

  // ── Early returns ──────────────────────────────────────────────────────────

  if (issueLoading || treeLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (issueError) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" gutterBottom>
          Failed to load issue
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {issueQueryError?.message}
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 1 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!issue) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" gutterBottom>
          Issue not found
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 1 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusChange = (e) => {
    changeStatusMutation.mutate({ id: issueId, statusId: e.target.value }, { onError: (err) => showToast({ type: "error", message: err?.message || "Failed to change status" }) });
  };

  const handleLinkUserStory = (storyId) => {
    linkUserStoryMutation.mutate(
      { issueId, userStoryId: storyId || null },
      {
        onSuccess: () => showToast({ type: "success", message: storyId ? "User story linked" : "User story unlinked" }),
        onError: (err) => showToast({ type: "error", message: err?.message || "Failed to link user story" }),
      },
    );
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(
      { issueId, content: newComment },
      {
        onSuccess: () => setNewComment(""),
        onError: (err) => showToast({ type: "error", message: err?.message || "Failed to post comment" }),
      },
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    uploadAttachmentMutation.mutate(
      { issueId, formData },
      {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = "";
          showToast({ type: "success", message: "Attachment uploaded successfully!" });
        },
        onError: (err) => showToast({ type: "error", message: err?.message || "Upload failed" }),
      },
    );
  };

  const projectName = issue.project?.name || null;
  const issueLinkStoryId = issue.user_story_id || "";
  const linkedStoryTitle = stories.find((s) => s.id === issueLinkStoryId)?.title || issue.userStory?.title || null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
      {/* Breadcrumb */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
        {projectName ? projectName : "Project"} / {issue.type?.name || "Issue"}
      </Typography>

      {/* Header */}
      <Box sx={{ mb: 1.5, display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, flex: 1, minWidth: 200 }}>
          {issue.title}
        </Typography>
        <Chip label={issue.issueStatus?.name || "Unknown"} size="small" sx={{ mt: 0.5 }} color={issue.issueStatus?.name?.toLowerCase()?.includes("done") ? "success" : issue.issueStatus?.name?.toLowerCase()?.includes("progress") ? "info" : "default"} />
      </Box>

      <Grid container spacing={2}>
        {/* ── Left Column (main content) ─────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          {/* Description */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Description
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: issue.description ? "text.primary" : "text.secondary", fontStyle: issue.description ? "normal" : "italic" }}>
              {issue.description || "No description provided."}
            </Typography>
          </Paper>

          {/* Attachments */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Attachments
              </Typography>
              <Box>
                <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
                <Button size="small" startIcon={uploadAttachmentMutation.isPending ? <CircularProgress size={14} /> : <CloudUploadIcon />} variant="outlined" onClick={() => fileInputRef.current?.click()} disabled={uploadAttachmentMutation.isPending}>
                  Upload
                </Button>
              </Box>
            </Box>
            <AttachmentList issueId={issueId} currentUserId={currentUserId} />
          </Paper>

          {/* Sub-tasks / Hierarchy */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Sub-tasks {children.length > 0 ? `(${children.length})` : ""}
              </Typography>
              <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setAddSubTaskOpen(true)}>
                Add Sub-task
              </Button>
            </Box>

            {children.length === 0 ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No sub-tasks.
              </Typography>
            ) : (
              <List dense disablePadding>
                {children.map((child) => (
                  <React.Fragment key={child.id}>
                    <ListItem disablePadding sx={{ py: 0.25, cursor: "pointer", borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }} onClick={() => navigate(paths.issue_detail(projectId, child.id).actualPath)}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">{child.title}</Typography>
                            {child.issueStatus?.name && <Chip label={child.issueStatus.name} size="small" sx={{ height: 18, fontSize: 10 }} />}
                          </Box>
                        }
                      />
                    </ListItem>
                    {/* Grandchildren */}
                    {child.children?.length > 0 && (
                      <Box pl={2}>
                        {child.children.map((gc) => (
                          <ListItem key={gc.id} disablePadding sx={{ py: 0.1, cursor: "pointer", borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }} onClick={() => navigate(paths.issue_detail(projectId, gc.id).actualPath)}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" color="text.secondary">
                                  ↳ {gc.title}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </Box>
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>

          {/* Comments */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Comments {comments.length > 0 ? `(${comments.length})` : ""}
            </Typography>
            <Box sx={{ mb: 1.5 }}>
              <TextField fullWidth multiline rows={2} size="small" placeholder="Write a comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} sx={{ mb: 1 }} />
              <Button variant="contained" size="small" onClick={handleAddComment} disabled={addCommentMutation.isPending || !newComment.trim()} startIcon={addCommentMutation.isPending ? <CircularProgress size={14} /> : null}>
                Post Comment
              </Button>
            </Box>
            {comments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No comments yet.
              </Typography>
            ) : (
              <List disablePadding>
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} issueId={issueId} userMap={userMap} />
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* ── Right Column (sidebar details) ────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Details
            </Typography>

            <Stack spacing={1.5}>
              {/* Status */}
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={issue.status_id || ""} label="Status" onChange={handleStatusChange} disabled={changeStatusMutation.isPending}>
                  {statuses.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* User Story — tree picker */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  User Story
                </Typography>
                <Button variant="outlined" size="small" fullWidth onClick={() => setStoryPickerOpen(true)} disabled={linkUserStoryMutation.isPending} startIcon={<AccountTreeIcon sx={{ fontSize: 16 }} />} sx={{ justifyContent: "flex-start", textTransform: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {linkedStoryTitle || (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      — Link a story —
                    </Typography>
                  )}
                </Button>
              </Box>

              {/* Assignee */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                  Assignee
                </Typography>
                {issue.assignee ? (
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>{displayName(userMap[issue.assignee.user_id])?.[0]?.toUpperCase() || "?"}</Avatar>
                    <Typography variant="body2">{displayName(userMap[issue.assignee.user_id]) || `Member …${issue.assignee.user_id?.slice(-6)}`}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    Unassigned
                  </Typography>
                )}
              </Box>

              {/* Priority */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                  Priority
                </Typography>
                <Chip label={issue.priority} size="small" color={PRIORITY_COLOR[issue.priority] || "default"} sx={{ textTransform: "capitalize" }} />
              </Box>

              {/* Reporter */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                  Reporter
                </Typography>
                <Box display="flex" alignItems="center" gap={0.75}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>{displayName(userMap[issue.created_by])?.[0]?.toUpperCase() || "?"}</Avatar>
                  <Typography variant="body2">
                    {displayName(userMap[issue.created_by]) || (
                      <Typography component="span" variant="body2" color="text.secondary" fontStyle="italic">
                        Unknown
                      </Typography>
                    )}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Dates */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {format(new Date(issue.created_at), "MMM d, yyyy")}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Updated: {format(new Date(issue.updated_at), "MMM d, yyyy")}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* User Story Tree Picker Dialog */}
      <UserStoryTreePickerDialog
        open={storyPickerOpen}
        onClose={() => setStoryPickerOpen(false)}
        stories={stories}
        selectedId={issueLinkStoryId}
        onSelect={(id) => {
          handleLinkUserStory(id);
          setStoryPickerOpen(false);
        }}
      />

      {/* Add Sub-task Dialog */}
      <AddSubTaskDialog open={addSubTaskOpen} onClose={() => setAddSubTaskOpen(false)} projectId={projectId} parentIssueId={issueId} parentHierarchyLevel={issue.type?.hierarchy_level} />
    </Box>
  );
};

export default IssueDetail;
