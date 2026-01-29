import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import Preferences from '../components/Preferences';

export default function PreferencesPage() {
  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Preferences />
    </Box>
  );
}

