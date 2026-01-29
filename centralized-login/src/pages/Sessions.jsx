import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import Sessions from '../components/Sessions';

export default function SessionsPage() {
  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Sessions />
    </Box>
  );
}

