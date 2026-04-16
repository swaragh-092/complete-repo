// Author: Gururaj
// Created: 14th Oct 2025
// Description: Issue list page with filterable table of all issues within a project or globally.
// Version: 2.0.0
// Modified:

import { useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import { IssueList as IssueListTable, CreateIssueModal } from "../../../features/issues";
import BACKEND_ENDPOINT from "../../../util/urls";
import { colorCodes } from "../../../theme";
import Heading from "../../../components/Heading";
import CreateDialog from "../../../components/pms/CreateDialog";
import IssueHistoryDialog from "./IssueHistoryDialog";
import { useParams } from "react-router-dom";
import { useProjectMembers } from "../../../features/issues/hooks/useIssues";
import { useAuth } from "@spidy092/auth-client";

export default function IssuesPage() {
  const { projectId } = useParams();

  // currently modifing or request sent ids
  const [editIssueId, setEditIssueId] = useState(false);

  // data table refresh state
  const [, setDataTableRefresh] = useState(true);

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const { user } = useAuth();
  const { data: membersData } = useProjectMembers(projectId);
  const members = membersData?.data?.members?.data || [];

  // Only testers and leads are permitted to create issues.
  const ISSUE_CREATE_ROLES = ["tester", "lead"];
  const currentMember = members.find((m) => m.user_id === (user?.id || user?.sub));
  const canCreateIssue = Boolean(currentMember && ISSUE_CREATE_ROLES.includes(currentMember.project_role));

  const [openCreate, setOpenCreate] = useState(false);

  if (!projectId) {
    return (
      <Box p={2}>
        <Heading title={"Issues"} />
        <Typography textAlign="center" mt={10} color="text.secondary" fontSize={18}>
          Select a project from the sidebar to view issues.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Heading title={"Issues"} />

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        {canCreateIssue && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
            }}
          >
            Create Issue
          </Button>
        )}
      </Box>

      <IssueListTable projectId={projectId} />

      <CreateIssueModal open={openCreate} onClose={() => setOpenCreate(false)} projectId={projectId} />

      <CreateDialog
        isOpen={!!editIssueId.id && editIssueId.for === "reject"}
        onClose={() => {
          setEditIssueId(false);
        }}
        usefor={"Reject Issue"}
        backendEndpoint={BACKEND_ENDPOINT.reject_issue(editIssueId.id)}
        onSuccess={() => setDataTableRefresh(true)}
        formFields={[{ type: "textarea", name: "reject_reason", label: "Reason", require: true }]}
        useOnlyGivenName={true}
      />

      {/* for issue reopen reason */}
      <CreateDialog
        isOpen={!!editIssueId.id && editIssueId.for === "reopen"}
        onClose={() => {
          setEditIssueId(false);
        }}
        usefor={"Re-Open Issue"}
        backendEndpoint={BACKEND_ENDPOINT.issue_finilize(editIssueId.id)}
        onSuccess={() => setDataTableRefresh(true)}
        formFields={[{ type: "textarea", name: "comment", label: "Comment", require: true }]}
        useOnlyGivenName={true}
        extraData={{ status: "reopen" }}
      />

      <CreateDialog
        isOpen={!!editIssueId.id && editIssueId.for === "task"}
        onClose={() => {
          setEditIssueId(false);
        }}
        usefor={"Task"}
        backendEndpoint={BACKEND_ENDPOINT.create_issue_task(editIssueId.id)}
        formFields={IssueTaskFields}
      />

      <IssueHistoryDialog
        open={!!editIssueId.id && editIssueId.for === "history"}
        onClose={() => {
          setEditIssueId(false);
        }}
        issueId={editIssueId.id}
      />
    </Box>
  );
}

const IssueTaskFields = [
  { type: "text", name: "title" },
  { type: "textarea", name: "description", label: "Description" },
  {
    type: "select",
    name: "priority",
    options: [
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
    ],
  },
  { type: "date", name: "due_date", label: "Due Date", validationName: "futureDate" },
];
