/*
  Notes:
  - Uses react-window for virtualization.
  - Dummy data generator simulates thousands of users per department.
  - Replace fetchDepartments / fetchUsers with real backendRequest calls later.
*/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "../../../../util/feedback/ToastService";
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, FormControl, IconButton, MenuItem, Select, TextField, Typography } from "@mui/material";
import DoButton from "../../../../components/button/DoButton";
import backendRequest from "../../../../util/request";
import { List } from "react-window";
// import { FixedSizeList as List } from "react-window";


import CloseIcon from "@mui/icons-material/Close";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { departments } from "../../../../dymmyData";
import { useWorkspace } from "../../../../context/WorkspaceContext";


// virtualization constants
const ITEM_HEIGHT = 64; // px per user row
const LIST_HEIGHT = 360; // px height for user list viewport
const LIST_WIDTH = "100%";


export default function AddMembersDialog ({isOpen, setOpen, projectId, setRefresher}) {

    const { workspaces, currentWorkspace, selectWorkspace, loading, isAdmin } = useWorkspace();

    // controlled states
    // const [departments, setDepartments] = useState([]);
    // const [departmentId, setDepartmentId] = useState("");
    // const [deptQuery, setDeptQuery] = useState("");

    const [users, setUsers] = useState([]); // entire list for selected department
    const [userQuery, setUserQuery] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);

    const [selectedUsers, setSelectedUsers] = useState([]); // array of user objects {id,name,email,role}
    const [userRoles, setUserRoles] = useState({}); // map id->role

    const [isSubmitting, setSubmitting] = useState(false);

    // debounce refs
    // const deptDebounceRef = useRef(null);
    const userDebounceRef = useRef(null);

    // open dialog: load departments (dummy or backend)
    // const fetchDepartments = async () => {
    //     // Dummy:
    //     const d = makeDummyDepartments();
    //     setDepartments(d);

    //     // If using backend:
    //     // try {
    //     //   const res = await backendRequest({ endpoint: BACKEND_ENDPOINT.organization_departments(organizationId) });
    //     //   setDepartments(res.data || []);
    //     // } catch (err) { showToast({message:'Failed to load departments', type:'error'}) }
    // };

    // fetch users for a department (dummy)
    const fetchUsers = async () => {
        if (!currentWorkspace?.id) {
        setUsers([]);
        return;
        }

        // A real backend would support pagination & server-side search.
        // Dummy: generate many users once and set.
        const list = makeDummyUsersFor();
        setUsers(list);
        setFilteredUsers(list); // initially same
    };

    

    // When department changes, clear previous selections and load users
    useEffect(() => {
        // clear selected users & roles when department changes
        setSelectedUsers([]);
        setUserRoles({});
        setUserQuery("");
        if (!currentWorkspace?.id) {
            setUsers([]);
            setFilteredUsers([]);
            return;
        }
        fetchUsers(currentWorkspace?.id);
    }, [currentWorkspace?.id]);

    const handleClose = () => {
        setOpen(false);
        // reset everything
        // setDepartmentId("");
        setUsers([]);
        setFilteredUsers([]);
        setUserQuery("");
        setSelectedUsers([]);
        setUserRoles({});
    };

    // // Debounced department search (client-side filtering)
    // useEffect(() => {
    //     if (deptDebounceRef.current) clearTimeout(deptDebounceRef.current);
    //     deptDebounceRef.current = setTimeout(() => {
    //         // client-side filter departments
    //         // For backend: call API to search departments
    //         setDepartments((prev) => {
    //           const all = makeDummyDepartments(); // ensure full list for dummy
    //           if (!deptQuery) return all;
    //           return all.filter((d) => d.name.toLowerCase().includes(deptQuery.toLowerCase()));
    //         });
    //     }, 200);
    //     return () => clearTimeout(deptDebounceRef.current);
    // }, [deptQuery]);

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


    
    // Save handler: builds payload and calls backend (or logs)
    const handleAddMembers = async () => {

        if (!projectId) {
            showToast({ message: "Invalid project", type: "error" });
            return;
        }
        if (!currentWorkspace?.id) {
            showToast({ message: "Please pick a department", type: "warning" });
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

        const result = await updateToBackend(payload, projectId, currentWorkspace?.id);

        

        if (!result.success) {
          showToast({ message: result.message || "Failed to update", type: "error" });
          return;
        }

        showToast({ message: `${selectedUsers.length} members added (simulated)`, type: "success" });
        // close and refresh
        handleClose();
        setRefresher(true);
    };

    // virtualization row renderer
    const Row = useCallback(
        ({ index, style }) => {
        const u = filteredUsers[index];
        if (!u) return null;
        const isSelected = !!selectedUsers.find((s) => s.id === u.id);
        return (
            <Box
            style={style}
            key={u.id}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={1.5}
            py={1}
            sx={{ borderBottom: "1px solid transparent" }}
            >
            <Box>
                <Typography fontWeight={600}>{u.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                {u.email}
                </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                    value={userRoles[u.id] || "member"}
                    onChange={(e) => setRoleForUser(u.id, e.target.value)}
                    size="small"
                >
                    <MenuItem value="lead">Lead</MenuItem>
                    <MenuItem value="member">Member</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
                </FormControl>

                <Button
                variant={isSelected ? "contained" : "outlined"}
                size="small"
                onClick={() => toggleSelectUser(u)}
                >
                {isSelected ? "Remove" : "Add"}
                </Button>
            </Box>
            </Box>
        );
        },
        [filteredUsers, selectedUsers, userRoles]
    );

    // memoized item count for virtualization
    const itemCount = useMemo(() => filteredUsers.length, [filteredUsers]);

    // simulate thousands of users for a dept
    const makeDummyUsersFor = () => {
        const department = currentWorkspace;
        const list = [];
        for (let i = 1; i <= 5; i++) {
            const id = `7b6709f5-57a5-48df-af22-771459865${i}d0`;
            list.push({
                id,
                name: `${department.name.toUpperCase()} User ${i}`,
                email: `user${i}@${department.name.toLowerCase()}.example.com`,
                department_id: department.id,
            });
        }
        console.log(list);
        return list;
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          Add Members to Project
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: "flex", gap: 2, pb: 2 }}>
          {/* LEFT: controls & user list */}
          <Box sx={{ flex: 1, minWidth: 420 }}>
            {/* Dept search */}
            {/* <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Department
            </Typography>
            <TextField
              placeholder="Search departments..."
              fullWidth
              size="small"
              value={deptQuery}
              onChange={(e) => setDeptQuery(e.target.value)}
              sx={{ mb: 1 }}
            /> */}

            {/* Dept list (clickable) */}
            {/* <Box
              sx={{
                border: "1px solid #ddd",
                borderRadius: 1,
                maxHeight: 160,
                overflowY: "auto",
                p: 1,
                mb: 2,
                backgroundColor: "background.paper",
              }}
            >
              {departments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No departments
                </Typography>
              ) : (
                departments
                  .filter((d) => d.name.toLowerCase().includes(deptQuery.toLowerCase()))
                  .map((d) => {
                    const sel = d.id === departmentId;
                    return (
                      <Box
                        key={d.id}
                        onClick={() => {
                          if (sel) {
                            // deselect -> clear users & selection
                            setDepartmentId("");
                            setUsers([]);
                            setFilteredUsers([]);
                            setSelectedUsers([]);
                            setUserRoles({});
                            setUserQuery("");
                          } else {
                            setDepartmentId(d.id);
                          }
                        }}
                        sx={{
                          px: 1,
                          py: 0.75,
                          borderRadius: 0.5,
                          cursor: "pointer",
                          bgcolor: sel ? "primary.main" : "transparent",
                          color: sel ? "#fff" : "inherit",
                          mb: 0.5,
                        }}
                      >
                        {d.name}
                      </Box>
                    );
                  })
              )}
            </Box> */}

            {/* users area */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Users {currentWorkspace?.id ? currentWorkspace?.name : ""}
            </Typography>

            <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
              <TextField
                placeholder="Search users..."
                fullWidth
                size="small"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* Virtualized list */}
            <Box
              sx={{
                border: "1px solid #eee",
                borderRadius: 1,
                height: LIST_HEIGHT,
                overflow: "hidden",
              }}
            >
              {itemCount === 0 ? (
                <Box p={2}>
                  <Typography variant="body2" color="text.secondary">
                    {currentWorkspace?.id ? "No users found" : "Select a department to view users"}
                  </Typography>
                </Box>
              ) : (
              //  <List
              //     height={400}
              //     width={600}
              //     itemCount={itemCount}
              //     itemSize={72}
              //   >
              //     {Row}
              //   </List>
              <Box
  sx={{
    border: "1px solid #eee",
    borderRadius: 1,
    maxHeight: 400,
    overflowY: "auto",
  }}
>
  {itemCount === 0 ? (
    <Box p={2}>
      <Typography variant="body2" color="text.secondary">
        {currentWorkspace?.id
          ? "No users found"
          : "Select a department to view users"}
      </Typography>
    </Box>
  ) : (
    filteredUsers.map((u) => {
      const isSelected = selectedUsers.some((s) => s.id === u.id);

      return (
        <Box
          key={u.id}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={1.5}
          py={1}
          sx={{ borderBottom: "1px solid #f0f0f0" }}
        >
          <Box>
            <Typography fontWeight={600}>{u.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {u.email}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={userRoles[u.id] || "member"}
                onChange={(e) => setRoleForUser(u.id, e.target.value)}
              >
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant={isSelected ? "contained" : "outlined"}
              size="small"
              onClick={() => toggleSelectUser(u)}
            >
              {isSelected ? "Remove" : "Add"}
            </Button>
          </Box>
        </Box>
      );
    })
  )}
</Box>
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
                  <Box
                    key={u.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Box>
                      <Typography fontWeight={600}>{u.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <FormControl size="small" sx={{ minWidth: 110 }}>
                        <Select
                          value={userRoles[u.id] || "member"}
                          onChange={(e) => setRoleForUser(u.id, e.target.value)}
                        >
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
              Quick add/remove: click "Add" on the left list. Selection persists until you change department or close.
            </Typography>

            <Box display="flex" gap={1}>
              <Button fullWidth onClick={handleClose}>Cancel</Button>
              <DoButton isDisable={isSubmitting} fullWidth onclick={async() => {setSubmitting(true);await handleAddMembers();setSubmitting(false);}}>{isSubmitting ? <CircularProgress size={20} /> : "Save"}</DoButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );

}







const updateToBackend = async (payload, projectId, departmentId) => {
  const endpoint = BACKEND_ENDPOINT["add_project_members"](projectId, departmentId);
  const response = await backendRequest({endpoint, bodyData: payload, });

  return response;
}