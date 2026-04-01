// Author: Copilot
// Created: 18th Mar 2026
// Description: Modal to create a new Sprint
// Version: 1.0.0

import React from "react";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useCreateSprint } from "../hooks/useSprints";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const CreateSprintModal = ({ open, onClose, projectId }) => {
  const createSprint = useCreateSprint();

  const formik = useFormik({
    initialValues: {
      name: "",
      goal: "",
      start_date: "",
      end_date: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Sprint Name is required"),
      goal: Yup.string(),
      start_date: Yup.date().nullable(),
      end_date: Yup.date().nullable().min(
        Yup.ref('start_date'),
        "End date can't be before start date"
      ),
    }),
    onSubmit: (values) => {
      createSprint.mutate({ projectId, ...values }, {
        onSuccess: () => {
          formik.resetForm();
          onClose();
        }
      });
    },
  });

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" mb={2}>
          Create Sprint
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label="Sprint Name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            margin="normal"
          />
          <TextField
            fullWidth
            id="goal"
            name="goal"
            label="Sprint Goal"
            multiline
            rows={2}
            value={formik.values.goal}
            onChange={formik.handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            id="start_date"
            name="start_date"
            label="Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formik.values.start_date}
            onChange={formik.handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            id="end_date"
            name="end_date"
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formik.values.end_date}
            onChange={formik.handleChange}
            error={formik.touched.end_date && Boolean(formik.errors.end_date)}
            helperText={formik.touched.end_date && formik.errors.end_date}
            margin="normal"
          />
          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createSprint.isPending}>
              {createSprint.isPending ? "Creating..." : "Create"}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default CreateSprintModal;
