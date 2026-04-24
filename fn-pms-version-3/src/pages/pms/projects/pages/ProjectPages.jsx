// Author: Copilot
// Description: Project pages tree for Site-type projects — shown in ProjectDetail.
// Version: 2.0.0

import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT, { paths } from "../../../../util/urls";
import DoButton from "../../../../components/button/DoButton";
import Heading from "../../../../components/Heading";
import CreateDialog from "../../../../components/pms/CreateDialog";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../../../context/WorkspaceContext";

function buildPageTree(pages) {
  const map = {};
  const roots = [];
  pages.forEach((p) => {
    map[p.id] = { ...p, children: [] };
  });
  pages.forEach((p) => {
    if (p.parent_page_id) {
      map[p.parent_page_id]?.children.push(map[p.id]);
    } else {
      roots.push(map[p.id]);
    }
  });
  return roots;
}

// Pages use 'name' field
const createFormFields = [
  { type: "text", name: "name", label: "Name" },
  { type: "textarea", name: "description", label: "Description", require: false },
];

export default function ProjectPages({ projectId, setTaskRefresher = () => {} }) {
  const [pages, setPages] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  const fetchPages = async () => {
    if (!projectId || !currentWorkspace?.id) return;
    const res = await backendRequest({
      endpoint: BACKEND_ENDPOINT.pages_by_project_dept(projectId, currentWorkspace.id),
      querySets: "?perPage=9999&page=1",
    });
    if (res?.success) {
      setPages(res.data?.data || res.data?.rows || res.data || []);
    }
  };

  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentWorkspace?.id]);

  useEffect(() => {
    const tree = buildPageTree(pages);
    setTreeData(tree);
    setExpandedItems(pages.map((p) => String(p.id)));
  }, [pages]);

  // Pages use 'name' not 'title'
  const renderTree = (nodes) =>
    nodes.map((node) => (
      <TreeItem
        key={node.id}
        itemId={String(node.id)}
        label={
          <Box
            display="flex"
            justifyContent="space-between"
            width="100%"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(paths.page_detail(node.id).actualPath)}
          >
            <span>{node.name}</span>
            <span style={{ opacity: 0.6, fontSize: "12px" }}>{node.status || "active"}</span>
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
          <Heading title="Project Pages" level={2} />
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="text"
              sx={{ textTransform: "none" }}
              onClick={() => navigate(`/pages?projectId=${projectId}`)}
            >
              All Pages →
            </Button>
            <DoButton onclick={() => setOpen(true)}>Add Page</DoButton>
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

      <CreateDialog
        isOpen={open}
        formFields={createFormFields}
        onClose={() => setOpen(false)}
        usefor="Page"
        backendEndpoint={BACKEND_ENDPOINT.create_page(currentWorkspace?.id)}
        extraData={{ projectId }}
        onSuccess={() => {
          setOpen(false);
          fetchPages();
          setTaskRefresher(true);
        }}
      />
    </>
  );
}

