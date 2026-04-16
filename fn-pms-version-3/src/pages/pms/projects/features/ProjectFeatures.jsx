// Author: Gururaj
// Created: 29th May 2025
// Description: Project features tab for listing and linking features scoped to the current project.
// Version: 1.0.0
// Modified:

// import { useState } from "react";
// import DataTable from "../../../../components/tools/Datatable";
// import BACKEND_ENDPOINT from "../../../../util/urls";
// import { Box } from "@mui/material";
// import Heading from "../../../../components/Heading";
// import AddMembersDialog from "../members/AddMembersDialog";
// import DoButton from "../../../../components/button/DoButton";
// import AddFeatureDialog from "./AddFeatureDialog";

// const displayColumns = [
//   { field: "name", headerName: "Name", flex: 1 },
//   { field: "description", headerName: "Description", flex: 1 },
//   {
//     field: "status",
//     headerName: "Status",
//     flex: 0.5,
//     renderCell: (params) => {
//       const pf = params.row.projectFeatures?.[0];
//       return pf?.status?.replace("_", " ") || "—";
//     },
//   },
// ];
// export default function ProjectFeatures({ projectId, setTaskRefresher = () => {} }) {
//   const [refresh, setRefresher] = useState(true);
//   const [open, setOpen] = useState(false);
//   return (
//     <>
//       <Box p="20px" maxWidth={"49%"} width={"100%"}>
//         <Box display="flex" alignItems="center" justifyContent="space-between">
//           <Heading title={"Project Features"} level={2} />

//           <DoButton onclick={() => setOpen(true)}>Add Feature</DoButton>
//         </Box>
//         <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT.project_features(projectId)} refresh={refresh} setRefresh={setRefresher} defaultPageSize={5} />
//       </Box>

//       <AddFeatureDialog
//         open={open}
//         onClose={(refresh) => {
//           setOpen(false);
//           if (refresh) {
//             setRefresher(true);
//             setTaskRefresher(true);
//           }
//         }}
//         projectId={projectId}
//       />
//     </>
//   );
// }

import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import AddFeatureDialog from "./AddFeatureDialog";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import DoButton from "../../../../components/button/DoButton";
import Heading from "../../../../components/Heading";
import { useNavigate } from "react-router-dom";

function buildFeatureTree(features) {
  const map = {};
  const roots = [];

  features.forEach((f) => {
    map[f.id] = { ...f, children: [] };
  });

  features.forEach((f) => {
    if (f.parent_feature_id) {
      map[f.parent_feature_id]?.children.push(map[f.id]);
    } else {
      roots.push(map[f.id]);
    }
  });

  return roots;
}

export default function ProjectFeatures({ projectId, setTaskRefresher = () => {} }) {
  const [features, setFeatures] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchFeatures = async () => {
    const res = await backendRequest({
      endpoint: BACKEND_ENDPOINT.project_features(projectId),
      querySets: "?perPage=9999&page=1",
    });

    if (res?.success) {
      // paginate() returns { data: [...], pagination: {} } — key is "data" not "rows"
      setFeatures(res.data?.data || res.data?.rows || []);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  useEffect(() => {
    const tree = buildFeatureTree(features);
    setTreeData(tree);
    // Auto-expand all feature nodes so the tree is fully visible
    setExpandedItems(features.map((f) => String(f.id)));
  }, [features]);

  const renderTree = (nodes) =>
    nodes.map((node) => (
      <TreeItem
        key={node.id}
        itemId={String(node.id)}
        label={
          <Box display="flex" justifyContent="space-between" width="100%">
            <span>{node.name}</span>
            <span style={{ opacity: 0.6, fontSize: "12px" }}>{node.user_stories_count != null ? `${node.user_stories_count} stor${node.user_stories_count === 1 ? "y" : "ies"}` : ""}</span>
          </Box>
        }
      >
        {node.children.length > 0 && renderTree(node.children)}
      </TreeItem>
    ));

  return (
    <>
      <Box p="20px" maxWidth={"49%"} width={"100%"}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading title="Project Features" level={2} />
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="text"
              sx={{ textTransform: "none" }}
              onClick={() => navigate(`/features?projectId=${projectId}`)}
            >
              Manage Features →
            </Button>
            <DoButton onclick={() => setOpen(true)}>Add Feature</DoButton>
          </Box>
        </Box>

        <SimpleTreeView
          expandedItems={expandedItems}
          onExpandedItemsChange={(_, newItems) => setExpandedItems(newItems)}
          slots={{
            collapseIcon: ExpandMoreIcon,
            expandIcon: ChevronRightIcon,
          }}
        >
          {renderTree(treeData)}
        </SimpleTreeView>
      </Box>

      <AddFeatureDialog
        open={open}
        onClose={(refresh) => {
          setOpen(false);
          if (refresh) {
            fetchFeatures();
            setTaskRefresher(true);
          }
        }}
        projectId={projectId}
      />
    </>
  );
}
