// Description: Reusable member picker for assigning project members to work items.
// Fetches project members from the API and renders an Autocomplete dropdown.
// Version: 1.0.0

import { useState, useEffect } from "react";
import { Autocomplete, TextField, useTheme } from "@mui/material";
import backendRequest from "../../util/request";
import BACKEND_ENDPOINT from "../../util/urls";
import { colorCodes } from "../../theme";

/**
 * MemberPicker
 * @param {string} projectId - required
 * @param {string} departmentId - required
 * @param {string|null} value - selected user_id
 * @param {function} onChange - called with (user_id | null)
 * @param {string} label
 * @param {boolean} required
 * @param {string} name - for DynamicForm compatibility (onChange emits { target: { name, value } })
 */
export default function MemberPicker({
  projectId,
  departmentId,
  value = null,
  onChange = () => {},
  label = "Assign To",
  required = false,
  name = "assignee_id",
  errorMessage = "",
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  useEffect(() => {
    if (!projectId) return;
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, departmentId]);

  const loadMembers = async () => {
    setLoading(true);
    const endpoint = departmentId
      ? BACKEND_ENDPOINT.project_members_by_dept(projectId, departmentId)
      : BACKEND_ENDPOINT.project_members(projectId);

    const res = await backendRequest({ endpoint });
    if (res?.success) {
      // project_members_by_dept returns res.data.members.data
      // project_members returns res.data.members.data or res.data.data
      const raw =
        res.data?.members?.data ||
        res.data?.data ||
        res.data ||
        [];
      setMembers(
        raw.map((m) => ({
          id: m.user_id,
          label:
            m.user_details?.name ||
            m.user_details?.email ||
            m.user_id,
          role: m.project_role,
        }))
      );
    }
    setLoading(false);
  };

  const selectedOption = members.find((m) => m.id === value) || null;

  return (
    <Autocomplete
      fullWidth
      loading={loading}
      options={loading ? [] : members}
      value={selectedOption}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(opt) => opt.label + (opt.role ? ` (${opt.role})` : "")}
      loadingText="Loading members…"
      onChange={(_, val) => {
        onChange({ target: { name, value: val?.id || "" } });
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          size="small"
          margin="dense"
          variant="filled"
          helperText={errorMessage}
          error={!!errorMessage}
          sx={{
            borderRadius: 1,
            "& .MuiFilledInput-root": {
              backgroundColor: colors.background.light,
              borderRadius: 1,
              color: colors.text.dark,
              "&:hover": { backgroundColor: colors.background.modrate },
              "&.Mui-focused": {
                backgroundColor: colors.background.modrate,
                color: colors.text.dark,
              },
            },
            "& .MuiInputLabel-root": {
              color: colors.text.light,
              "&.Mui-focused": { color: colors.text.modrate },
            },
          }}
        />
      )}
    />
  );
}
