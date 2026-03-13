import { Box, CircularProgress, useTheme } from "@mui/material";
import { colorCodes } from "../../theme";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; 
import { showConfirmDialog } from "../../util/feedback/ConfirmService";


export default function ActionColumn({
  isEditing,
  params,
  editAction = null ,
  activeAction = null ,
  deleteAction = null ,
}) {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const handleDelete = () => {
    showConfirmDialog({
      message: "Are you sure you want to delete this item?",
      title: "Confirm Deletion",
      onConfirm: () => deleteAction && deleteAction(params.row),
    });
  };

  return (
    <Box display="flex" alignItems="center" gap="10px">
      {isEditing ? (
        <CircularProgress size={20} />
      ) : (
        <>
          {editAction && (
            <Box title="Edit">
              <EditIcon
                onClick={() => editAction(params.row)}
                sx={{
                  cursor: "pointer",
                  color: colors.text.dark,
                  "&:hover": { color: colors.secondary.dark },
                }}
              />
            </Box>
          )}

          {activeAction && (
            <Box title="Activate / Deactivate">
              <CheckCircleIcon
                onClick={() => activeAction(params.row)}
                sx={{
                  cursor: "pointer",
                  color: colors.success.light,
                  "&:hover": { color: colors.success.dark },
                }}
              />
            </Box>
          )}

          {deleteAction && (
            <Box title="Delete">
              <DeleteIcon
                onClick={handleDelete}
                sx={{
                  cursor: "pointer",
                  color: colors.error.light,
                  "&:hover": { color: colors.error.modrate },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
