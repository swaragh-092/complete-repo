import { Skeleton, Box, Card, CardContent, Grid } from '@mui/material';

export function SkeletonCard() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={24} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 1 }} />
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <Box>
      <Skeleton variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1 }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="rectangular" height={48} sx={{ flex: 1, borderRadius: 1 }} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export function SkeletonMetricCard() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="50%" height={20} />
        <Skeleton variant="text" width="70%" height={40} sx={{ mt: 1 }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}

export function SkeletonGrid({ items = 4 }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: items }).map((_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <SkeletonMetricCard />
        </Grid>
      ))}
    </Grid>
  );
}










