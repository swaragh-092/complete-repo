/*
  Notes:
  - A user can belong to multiple departments (workspaces) within the same project.
  - Dept selector lets you pick which department/workspace to add members to.
  - Fetches real workspace members from auth-service for the selected department.
  - Submits to PMS addMembers endpoint: POST /project/member/:projectId/department/:departmentId
*/

import { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "../../../../util/feedback/ToastService";
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import DoButton from "../../../../components/button/DoButton";
import backendRequest from "../../../../util/request";

import CloseIcon from "@mui/icons-material/Close";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { useWorkspace } from "../../../../context/WorkspaceContext";
import { getWorkspaceMembers } from "../../../../api/workspaces";

export default function AddMembersDialog({ isOpen, setOpen, projectId, setRefresher }) {
  const { workspaces } = useWorkspace();

  // Department (workspace) selection
  const [selectedDeptId, setSelectedDeptId] = useState("");

  // Users for selected department
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState([]); // array of {id,name,email}
  const [userRoles, setUserRoles] = useState({}); // map id->role

  const [isSubmitting, setSubmitting] = useState(false);

  const userDebounceRef = useRef(null);

  // fetch users for the selected department/workspace
  const fetchUsers = useCallback(async (deptId) => {
    if (!deptId) {
      setUsers([]);
      setFilteredUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const members = await getWorkspaceMembers(deptId);

      if (members && Array.isArray(members)) {
        const mappedUsers = members.map((member) => ({
          id: member.user_id,
          name: member.name || member.UserMetadata?.email || "Unknown",
          email: member.UserMetadata?.email || "",
          workspace_role: member.role,
        }));
        setUsers(mappedUsers);
        setFilteredUsers(mappedUsers);
      } else {
        showToast({ message: "Failed to load workspace members", type: "error" });
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch workspace members:", error);
      showToast({ message: "Error loading workspace members", type: "error" });
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Reset everything when dialog opens/closes
  useEffect(() => {
    if (!isOpen) return;
    setSelectedDeptId("");
    setSelectedUsers([]);
    setUserRoles({});
    setUserQuery("");
    setUsers([]);
    setFilteredUsers([]);
  }, [isOpen]);

  // Fetch users when selected department changes
  useEffect(() => {
    setSelectedUsers([]);
    setUserRoles({});
    setUserQuery("");
    fetchUsers(selectedDeptId);
  }, [selectedDeptId, fetchUsers]);

  // Debounced user search (client-side)
  useEffect(() => {
    if (userDebounceRef.current) clearTimeout(userDebounceRef.current);
    userDebounceRef.current = setTimeout(() => {
      if (!userQuery) {
        setFilteredUsers(users);
        return;
      }
      const q = userQuery.toLowerCase();
      // for scalability, filter on fields known (name/email)
      const res = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
      setFilteredUsers(res);
    }, 180);
    return () => clearTimeout(userDebounceRef.current);
  }, [userQuery, users]);

  const handleClose = () => {
    setOpen(false);
    setSelectedDeptId("");
    setUsers([]);
    setFilteredUsers([]);
    setUserQuery("");
    setSelectedUsers([]);
    setUserRoles({});
  };

  // helper: toggle selection (selectedUsers stores full user objects)
  const toggleSelectUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((p) => p.id === user.id);
      if (exists) {
        // remove
        return prev.filter((p) => p.id !== user.id);
      } else {
        // add with default role
        setUserRoles((r) => ({ ...r, [user.id]: r[user.id] || "member" }));
        return [...prev, user];
      }
    });
  };

  // set role for a user (updates map)
  const setRoleForUser = (userId, role) => {
    setUserRoles((prev) => ({ ...prev, [userId]: role }));
  };

  // remove selected user
  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    setUserRoles((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  };

  // Save handler: builds payload and calls backend
  const handleAddMembers = async () => {
    if (!projectId) {
      showToast({ message: "Invalid project", type: "error" });
      return;
    }
    if (!selectedDeptId) {
      showToast({ message: "Please select a department first", type: "warning" });
      return;
    }
    if (selectedUsers.length === 0) {
      showToast({ message: "Select at least one user", type: "warning" });
      return;
    }

    const payload = {
      users: selectedUsers.map((u) => ({
        user_id: u.id,
        project_role: userRoles[u.id] || "member",
      })),
    };

    const result = await updateToBackend(payload, projectId, selectedDeptId);

    if (!result.success) {
      showToast({ message: result.message || "Failed to update", type: "error" });
      return;
    }

    showToast({ message: `${selectedUsers.length} member(s) added successfully`, type: "success" });
    handleClose();
    setRefresher(true);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        Add Members to Project
        <IconButton aria-label="close" onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", gap: 2, pb: 2 }}>
        {/* LEFT: department selector + user list */}
        <Box sx={{ flex: 1, minWidth: 420 }}>
          {/* Department selector */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Department (Workspace)
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Department</InputLabel>
            <Select label="Select Department" value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)}>
              {workspaces.length === 0 ? (
                <MenuItem disabled>No departments available</MenuItem>
              ) : (
                workspaces.map((ws) => (
                  <MenuItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Users area */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Users {selectedDeptId ? `— ${workspaces.find((w) => w.id === selectedDeptId)?.name || ""}` : ""}
          </Typography>

          <Box sx={{ mb: 1 }}>
            <TextField placeholder="Search users..." fullWidth size="small" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} disabled={!selectedDeptId} />
          </Box>

          <Divider sx={{ mb: 1 }} />

          <Box
            sx={{
              border: "1px solid #eee",
              borderRadius: 1,
              maxHeight: 340,
              overflowY: "auto",
            }}
          >
            {!selectedDeptId ? (
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                  Select a department above to view users
                </Typography>
              </Box>
            ) : loadingUsers ? (
              <Box p={2} display="flex" justifyContent="center">
                <CircularProgress size={24} />
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                  No users found in this department
                </Typography>
              </Box>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUsers.some((s) => s.id === u.id);
                return (
                  <Box key={u.id} display="flex" alignItems="center" justifyContent="space-between" px={1.5} py={1} sx={{ borderBottom: "1px solid #f0f0f0" }}>
                    <Box>
                      <Typography fontWeight={600}>{u.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select value={userRoles[u.id] || "member"} onChange={(e) => setRoleForUser(u.id, e.target.value)}>
                          <MenuItem value="lead">Lead</MenuItem>
                          <MenuItem value="member">Member</MenuItem>
                          <MenuItem value="viewer">Viewer</MenuItem>
                        </Select>
                      </FormControl>

                      <Button variant={isSelected ? "contained" : "outlined"} size="small" onClick={() => toggleSelectUser(u)}>
                        {isSelected ? "Remove" : "Add"}
                      </Button>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* RIGHT: selected users panel */}
        <Box sx={{ width: 360, minWidth: 280 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Selected Users ({selectedUsers.length})
          </Typography>

          <Box
            sx={{
              border: "1px solid #eee",
              borderRadius: 1,
              minHeight: 200,
              maxHeight: 420,
              overflowY: "auto",
              p: 1,
              mb: 2,
              backgroundColor: "background.paper",
            }}
          >
            {selectedUsers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No users selected
              </Typography>
            ) : (
              selectedUsers.map((u) => (
                <Box key={u.id} display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box>
                    <Typography fontWeight={600}>{u.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {u.email}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select value={userRoles[u.id] || "member"} onChange={(e) => setRoleForUser(u.id, e.target.value)}>
                        <MenuItem value="lead">Lead</MenuItem>
                        <MenuItem value="member">Member</MenuItem>
                        <MenuItem value="viewer">Viewer</MenuItem>
                      </Select>
                    </FormControl>

                    <IconButton size="small" onClick={() => removeSelectedUser(u.id)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Select a department, pick users, then click Save. To add the same person to another department, open this dialog again and select a different department.
          </Typography>

          <Box display="flex" gap={1}>
            <Button fullWidth onClick={handleClose}>
              Cancel
            </Button>
            <DoButton
              isDisable={isSubmitting}
              fullWidth
              onclick={async () => {
                setSubmitting(true);
                await handleAddMembers();
                setSubmitting(false);
              }}
            >
              {isSubmitting ? <CircularProgress size={20} /> : "Save"}
            </DoButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

const updateToBackend = async (payload, projectId, departmentId) => {
  const endpoint = BACKEND_ENDPOINT["add_project_members"](projectId, departmentId);
  const response = await backendRequest({ endpoint, bodyData: payload });
  return response;
};
