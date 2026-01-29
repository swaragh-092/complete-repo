import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import PrivacySettings from '../components/PrivacySettings';

export default function PrivacyPage() {
  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <PrivacySettings />
    </Box>
  );
}

