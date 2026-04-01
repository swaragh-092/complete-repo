// Author: Gururaj
// Created: 19th Jun 2025
// Description: Skeleton placeholder rendered while a data table is loading.
// Version: 1.0.0
// Modified:

import { Box, Skeleton, useTheme } from "@mui/material";

export default function DataTableSkeleton () {

    const theme = useTheme();

    return (
        <>
        <Box>
          {[...Array(5)].map((_, idx) => (
            <Box
              key={idx}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              p={2}
              mb={1}
              sx={{
                backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f4f4f4",
                borderRadius: 2,
              }}
            >
              <Skeleton variant="text" width="30%" height={30} />
              <Skeleton variant="text" width="40%" height={30} />
              <Skeleton variant="text" width="10%" height={30} />
            </Box>
          ))}
        </Box>
        </>
    );
}