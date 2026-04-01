// Author: Gururaj
// Created: 29th May 2025
// Description: Add Feature dialog for searching and linking existing features to a project.
// Version: 1.0.0
// Modified:


import BACKEND_ENDPOINT from "../../../../util/urls";
import { useWorkspace } from "../../../../context/WorkspaceContext";
import DynamicForm from "../../../../components/form/DynamicForm";
import CreateDialog from "../../../../components/pms/CreateDialog";

export default function AddFeatureDialog({ open, onClose, projectId }) {
  const { workspaces, currentWorkspace, selectWorkspace, loading } = useWorkspace();

  

  // const handleAddFeature = async (data) => {
  //     const response = await addFeatureToBackend(data, projectId, workspaces?.current?.id, );
  //     if (response.success) onClose(true);
  //     else showToast({ message: response.message || "Failed to add feature", type: "error" });
  //   } catch (err) {
  //     console.error("Error adding feature:", err);
  //     showToast({ message: "Error adding feature", type: "error" });
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  return (

    <CreateDialog 
      isOpen={open} 
      onSuccess={() => {onClose(true); }} 
      onClose={() => onClose(false)}
      formFields={featureFields} 
      extraData={{projectId}}  
      backendEndpoint={BACKEND_ENDPOINT.add_feature_to_project(currentWorkspace?.id)}  
      usefor={`Create Feature for ${currentWorkspace?.name}`}
      useOnlyGivenName={true}
    />
  );
}

const featureFields = [
  { type: "text", name: "name" },
  { type: "textarea", name: "description", label: "Description", require: false },
];


