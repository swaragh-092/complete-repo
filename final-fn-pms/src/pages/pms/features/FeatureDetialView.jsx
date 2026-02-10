/* eslint-disable react-refresh/only-export-components */

// Author: Gururaj
// Created: 16th June 2025
// Description: Organization page to view organization details and manage departments.
// Version: 1.0.0
// pages/pms/department/DepartmentManage.jsx
// Modified:

import { redirect, useLoaderData, useRevalidator } from "react-router-dom";
import BACKEND_ENDPOINT from "../../../util/urls";
import Heading from "../../../components/Heading";
import backendRequest from "../../../util/request";

// import { useLoaderData } from "react-router-dom";
import { Typography, Stack, Chip, Box } from "@mui/material";
import { useEffect, useState } from "react";
import DoButton from "../../../components/button/DoButton";
import EditDialog from "../../../components/pms/EditDialog";
import ChecklistLists from "./checklist/ChecklistLists";

export default function FeatureDetail() {
  const response = useLoaderData();
  const [feature, setFeature] = useState(response?.data);

  const [editFeatureDialog, setEditFeatureDialog] = useState(false);
  const revalidator = useRevalidator();

  useEffect(() => {
    if (response?.data) {
      setFeature(response.data);
    }
  }, [response?.data]);

  const onEditSuccess = (updatedData) => {
    setEditFeatureDialog(false);
    // temporary local update
    setFeature((prev) => ({ ...prev, ...updatedData }));
    // optional re-fetch for fresh data
    revalidator.revalidate();
  };

  return (
    <>
      <Box m="20px" marginBottom={"35px"}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading title={feature.name} subtitle={feature.description || "-"} giveMarginBottom={false} />
          <DoButton onclick={() => setEditFeatureDialog(true)}>Edit Feature</DoButton>
        </Box>

        <EditDialog initialData={feature} onSuccess={onEditSuccess} isOpen={editFeatureDialog} formFields={editFormFields} updateBackendEndpoint={BACKEND_ENDPOINT.edit_feature_detail(feature.id)} onClose={() => setEditFeatureDialog(false)} useFor={"feature"} />

      </Box>
      <ChecklistLists featureId={feature.id} />
    </>
  );
}

export async function featureFetchLoader({ params }) {
  const { id } = params;

  const endpoint = BACKEND_ENDPOINT.feature_detail(id);

  const response = await backendRequest({
    endpoint,
    navigate: redirect,
  });

  if (response.status === 404 || response.status === 422) {
    throw new Response("Project not found", {
      status: 404,
      statusText: "Project not found",
    });
  }

  if (!response.ok) {
    throw new Error(response.message || "Failed to load Project");
  }
  return response;
}

const editFormFields = [
  { type: "text", name: "name" },
  { type: "textarea", name: "description", label: "Description" },
];
