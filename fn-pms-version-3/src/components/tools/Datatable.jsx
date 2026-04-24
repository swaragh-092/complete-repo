// Author: Gururaj
// Created: 30th May 2025
// Description: data table component to show data table wiht dynamic content
// Version: 1.0.0
// pages/pms/organization/Organization.jsx
// Modified:

import { useEffect, useMemo, useState } from "react";

import { useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Box, CircularProgress, Typography } from "@mui/material";

import { colorCodes } from "../../theme";
import DoButton from "../button/DoButton";

import backendRequest from "../../util/request";
import { showToast } from "../../util/feedback/ToastService";

// external install dependencies
import debounce from "lodash/debounce";

import { GridFooterContainer, GridPagination } from "@mui/x-data-grid";

const CustomFooter = ({ selectedRows, selectedAction }) => {
  if (!selectedAction)
    return (
      <GridFooterContainer>
        <GridPagination />
      </GridFooterContainer>
    );

  const { action, buttonName, buttonColor } = selectedAction;

  return (
    <GridFooterContainer sx={{ justifyContent: "space-between", px: 1 }}>
      <DoButton onclick={() => action(selectedRows)} isDisable={selectedRows.length === 0} extraStyles={{ bgcolor: buttonColor }}>
        {buttonName || "Perform Action"} ({selectedRows.length})
      </DoButton>
      <GridPagination />
    </GridFooterContainer>
  );
};

export default function DataTable({ columns, fetchEndpoint, selectedAction = false, refresh, setRefresh = () => {}, dataPath = null, defaultPageSize = 10, transformRows = null, extraParams = "" }) {
  // datapath represents the where the actal data will be in response and should be array
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryData, setQueryData] = useState({ page: 0, pageSize: defaultPageSize, sortField: null, sortOrder: "desc", searchText: "", searchField: "", searchOperator: "" });
  const [selectedRows, setSelectedRows] = useState([]);
  const [isReadyToFetch, setIsReadyToFetch] = useState(false);

  const callFetchData = async (querySets) => {
    setLoading(true);
    const data = await fetchData(fetchEndpoint, querySets + extraParams, dataPath);
    setLoading(false);
    setResponseData(data);
  };

  const normalizedRowsSource = responseData?.data ?? responseData ?? [];
  const rows = transformRows ? transformRows(normalizedRowsSource) : Array.isArray(normalizedRowsSource) ? normalizedRowsSource : [];

  // Data fetching effects - setState in callbacks is the intended pattern
  useEffect(() => {
    if (refresh) {
      if (transformRows) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        callFetchData(`?page=1&perPage=9999`);
      } else {
         
        callFetchData(`?page=${queryData.page + 1}&perPage=${queryData.pageSize}&sortField=${queryData.sortField}&sortOrder=${queryData.sortOrder}&searchText=${queryData.searchText}&searchField=${queryData.searchField}&searchOperator=${queryData.searchOperator}`);
      }
      setRefresh(false);
      setIsReadyToFetch(true);
    }
  }, [refresh]);

  useEffect(() => {
    if (isReadyToFetch && !transformRows) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      callFetchData(`?page=${queryData.page + 1}&perPage=${queryData.pageSize}&sortField=${queryData.sortField}&sortOrder=${queryData.sortOrder}&searchText=${queryData.searchText}&searchField=${queryData.searchField}&searchOperator=${queryData.searchOperator}`);
    }
  }, [queryData]);

  const handleFilterChange = useMemo(
    () =>
      debounce((filterModel = "") => {
        // Only handle search if there's actual search criteria
        if (filterModel?.items?.[0]) {
          const searchOperator = filterModel?.items[0]?.operator || "";
          const searchField = filterModel?.items[0]?.field || "";
          const searchText = filterModel?.items[0]?.value || "";

          setQueryData((prev) => {
            return { ...prev, searchOperator, searchField, searchText };
          });
        }
      }, 500),
    [],
  );

  const handlePageChange = (page, pageSize) => {
    setQueryData((prev) => {
      return { ...prev, page, pageSize };
    });
  };

  const handleSortModelChange = (newModel) => {
    if (newModel.length === 0) {
      setQueryData((prev) => {
        return { ...prev, sortField: "", sortOrder: "" };
      });
    } else {
      setQueryData((prev) => {
        return { ...prev, sortField: newModel[0].field || "", sortOrder: newModel[0].sort || "" };
      });
    }
  };

  return (
    <Box
      sx={{
        "& .MuiDataGrid-root": { border: "none" },
        "& .MuiDataGrid-cell": { borderBottom: "none" },
        "& .name-column--cell": { color: colors.secondary["dark"] },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: colors.primary["light"],
          borderBottom: "none",
        },
        "& .MuiDataGrid-virtualScroller": {
          backgroundColor: colors.mainBackground["light"],
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: "none",
          backgroundColor: colors.primary["light"],
        },
        "& .MuiCheckbox-root": {
          color: `${colors.secondary["light"]} !important`,
        },
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
          color: `${colors.primary["light"]} !important`,
        },
      }}
    >
      <DataGrid
        checkboxSelection={!!selectedAction}
        disableSelectionOnclick={true}
        onRowSelectionModelChange={setSelectedRows}
        rows={rows}
        columns={columns}
        components={{ Toolbar: GridToolbar }}
        sx={{ fontSize: "14px" }}
        pagination
        pageSizeOptions={[5, 10, 20, 50]}
        loading={loading}
        paginationMode={transformRows ? "client" : "server"}
        filterMode={transformRows ? "client" : "server"}
        sortingMode={transformRows ? "client" : "server"}
        {...(transformRows
          ? { initialState: { pagination: { paginationModel: { pageSize: defaultPageSize } } } }
          : {
              rowCount: responseData?.pagination?.totalItems || rows.length,
              paginationModel: { page: queryData.page, pageSize: queryData.pageSize },
              onPaginationModelChange: ({ page, pageSize }) => handlePageChange(page, pageSize),
              onFilterModelChange: (filterModel) => handleFilterChange(filterModel),
              sortModel: queryData.sortModel,
              onSortModelChange: handleSortModelChange,
            })}
        slots={{
          footer: () =>
            selectedAction ? (
              <CustomFooter selectedRows={Array.from(selectedRows?.ids || [])} selectedAction={selectedAction} />
            ) : (
              <GridFooterContainer>
                <GridPagination />
              </GridFooterContainer>
            ),
        }}
      />
    </Box>
  );
}

async function fetchData(endpoint, querySets, dataPath) {
  const response = await backendRequest({
    endpoint,
    querySets,
  });

  if (!response.success) {
    showToast({ message: response.message, type: "error" });
    return;
  }

  let data = response.data;
  if (Array.isArray(dataPath)) {
    dataPath.forEach((key) => {
      data = data?.[key];
    });
  }

  return data;
}
