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
