/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState({ message: '', severity: 'info', duration: 3000 });

  const show = useCallback((message, severity = 'info', duration = 3000) => {
    setOpts({ message, severity, duration });
    setOpen(true);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <Snackbar open={open} autoHideDuration={opts.duration} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={opts.severity} sx={{ width: '100%' }}>
          {opts.message}
        </Alert>
      </Snackbar>
    </ToastCtx.Provider>
  );
}
