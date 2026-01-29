import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import SecuritySettings from '../components/SecuritySettings';

export default function SecuritySettingsPage() {
  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <SecuritySettings />
    </Box>
  );
}

