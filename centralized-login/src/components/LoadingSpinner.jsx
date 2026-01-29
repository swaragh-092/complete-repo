import { Box, CircularProgress, Stack, Typography } from '@mui/material';

export default function LoadingSpinner({ message = 'Loading…', compact = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: compact ? 120 : '60vh',
        width: '100%',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <CircularProgress color="primary" thickness={4} />
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
