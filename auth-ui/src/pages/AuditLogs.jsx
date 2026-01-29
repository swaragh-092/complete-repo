import { Box, Typography } from '@mui/material';
import AuditLogTable from '../components/AuditLogTable.jsx';

function AuditLogs() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        Audit Logs
      </Typography>
      <AuditLogTable />
    </Box>
  );
}

export default AuditLogs;