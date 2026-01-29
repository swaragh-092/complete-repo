import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import Notifications from '../components/Notifications';

export default function NotificationsPage() {
  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Notifications />
    </Box>
  );
}

