// Author: Copilot
// Created: 18th Mar 2026
// Description: Modal to add issues to a Sprint
// Version: 1.0.0

import React, { useState, useMemo } from "react";
import { Modal, Box, Typography, Button, Checkbox, List, ListItem, ListItemText, ListItemIcon, TextField } from "@mui/material";
import { useIssues } from "../../issues/hooks/useIssues";
import { useAddIssuesToSprint } from "../hooks/useSprints";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxHeight: '80vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  display: 'flex',
  flexDirection: 'column',
};

const AddIssuesToSprintModal = ({ open, onClose, projectId, sprintId }) => {
  const [selectedIssues, setSelectedIssues] = useState([]);
  const { data: issuesData, isLoading } = useIssues(projectId);
  const addIssuesMutation = useAddIssuesToSprint();

  const issues = useMemo(() => {
    if (issuesData?.data?.data) return issuesData.data.data;
    if (Array.isArray(issuesData?.data)) return issuesData.data;
    if (Array.isArray(issuesData)) return issuesData;
    return [];
  }, [issuesData]);

  // Filter out closed issues or issues already in a sprint (if we had that info easily)
  // For now, list all non-closed issues
  const availableIssues = issues.filter(i => 
    !['closed', 'completed', 'done'].includes(i.issueStatus?.name?.toLowerCase())
  );

  const handleToggle = (value) => () => {
    const currentIndex = selectedIssues.indexOf(value);
    const newChecked = [...selectedIssues];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setSelectedIssues(newChecked);
  };

  const handleSubmit = () => {
    addIssuesMutation.mutate({ sprintId, issueIds: selectedIssues }, {
      onSuccess: () => {
        setSelectedIssues([]);
        onClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" mb={2}>
          Add Issues to Sprint
        </Typography>
        
        {isLoading ? (
            <Typography>Loading issues...</Typography>
        ) : (
            <List sx={{ overflow: 'auto', flexGrow: 1, mb: 2 }}>
                {availableIssues.length === 0 ? (
                    <Typography color="textSecondary">No eligible issues found.</Typography>
                ) : (
                    availableIssues.map((issue) => (
                        <ListItem key={issue.id} button onClick={handleToggle(issue.id)}>
                            <ListItemIcon>
                                <Checkbox
                                    edge="start"
                                    checked={selectedIssues.indexOf(issue.id) !== -1}
                                    tabIndex={-1}
                                    disableRipple
                                />
                            </ListItemIcon>
                            <ListItemText 
                                primary={issue.title} 
                                secondary={`${issue.issueType?.name || 'Issue'} - ${issue.issueStatus?.name || 'Status'}`} 
                            />
                        </ListItem>
                    ))
                )}
            </List>
        )}

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={addIssuesMutation.isPending || selectedIssues.length === 0}
          >
            {addIssuesMutation.isPending ? "Adding..." : `Add ${selectedIssues.length} Issues`}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddIssuesToSprintModal;
