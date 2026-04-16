// Author: Gururaj
// Created: 19th Jun 2025
// Description: Generic single-line skeleton component for inline loading states.
// Version: 1.0.0
// Modified:

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function SimpleSkeleton() {
  return (
    <Box width={"100%"}>
      <Skeleton />
      <Skeleton animation="wave" />
      <Skeleton animation={false} />
    </Box>
  );
}
