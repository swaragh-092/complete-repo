/**
 * @fileoverview Session Debug Panel
 * @description Temporary debug component to visualize and test session configuration.
 * Shows token expiry countdown, refresh token status, and session validation.
 * Session lifetimes are controlled by Keycloak — this panel shows the reactive state.
 * 
 * Usage: Import and place anywhere in your authenticated layout.
 *   import SessionDebug from './components/SessionDebug';
 *   <SessionDebug />
 * 
 * ⚠️ Remove this component before deploying to production!
 */

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@spidy092/auth-client';
import {
  Box, Paper, Typography, Chip, Divider, IconButton, Collapse,
  Table, TableBody, TableRow, TableCell, LinearProgress, Button
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';

function SessionDebug() {
  const [open, setOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState({});
  const [refreshTokenExists, setRefreshTokenExists] = useState(false);
  const [lastValidation, setLastValidation] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [config, setConfig] = useState({});

  const updateState = useCallback(() => {
    const token = auth.getToken();
    const cfg = auth.getConfig();
    setConfig(cfg);

    if (token) {
      const timeUntilExpiry = auth.getTimeUntilExpiry(token);
      const expiryTime = auth.getTokenExpiryTime(token);
      const decoded = auth.decodeToken(token);

      setTokenInfo({
        exists: true,
        timeUntilExpiry,
        expiryTime: expiryTime?.toLocaleTimeString(),
        issuedAt: decoded?.iat ? new Date(decoded.iat * 1000).toLocaleTimeString() : 'N/A',
        subject: decoded?.sub || 'N/A',
        clientId: decoded?.azp || decoded?.client_id || 'N/A',
        willRefreshIn: Math.max(0, timeUntilExpiry - (cfg.tokenRefreshBuffer || 60)),
      });
    } else {
      setTokenInfo({ exists: false });
    }

    // Check refresh token in localStorage
    const rt = auth.getRefreshToken();
    const lsRefresh = localStorage.getItem('auth_refresh_token');
    setRefreshTokenExists(!!rt || !!lsRefresh);

  }, []);

  useEffect(() => {
    updateState();
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [updateState]);

  const handleForceRefresh = async () => {
    try {
      setLastRefresh('Refreshing...');
      await auth.refreshToken();
      setLastRefresh(`✅ ${new Date().toLocaleTimeString()}`);
      updateState();
    } catch (err) {
      setLastRefresh(`❌ ${err.message}`);
    }
  };

  const handleValidateSession = async () => {
    try {
      setLastValidation('Validating...');
      const valid = await auth.validateCurrentSession();
      setLastValidation(`${valid ? '✅ Valid' : '❌ Invalid'} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setLastValidation(`❌ ${err.message}`);
    }
  };

  const expiryPercent = tokenInfo.exists
    ? Math.max(0, Math.min(100, (tokenInfo.timeUntilExpiry / 300) * 100))
    : 0;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
        maxWidth: 420, bgcolor: 'background.paper', borderRadius: 2,
        border: '2px solid', borderColor: 'warning.main',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, cursor: 'pointer', bgcolor: 'warning.main', color: 'warning.contrastText' }}
        onClick={() => setOpen(!open)}
      >
        <BugReportIcon fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Session Debug (Keycloak-Authoritative)
        </Typography>
        <Chip
          label={tokenInfo.exists ? `${tokenInfo.timeUntilExpiry}s` : 'NO TOKEN'}
          size="small"
          color={tokenInfo.exists ? (tokenInfo.timeUntilExpiry > 60 ? 'success' : 'error') : 'default'}
          sx={{ mr: 1, fontWeight: 700 }}
        />
        <IconButton size="small" sx={{ color: 'inherit' }}>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Box sx={{ p: 1.5, maxHeight: 400, overflow: 'auto' }}>

          {/* Token Status */}
          <Typography variant="caption" fontWeight={700} color="text.secondary">ACCESS TOKEN (from Keycloak JWT exp)</Typography>
          {tokenInfo.exists ? (
            <>
              <LinearProgress
                variant="determinate"
                value={expiryPercent}
                color={tokenInfo.timeUntilExpiry > 60 ? 'success' : 'error'}
                sx={{ height: 6, borderRadius: 3, my: 0.5 }}
              />
              <Table size="small" sx={{ '& td': { py: 0.25, px: 0.5, fontSize: '0.75rem', border: 0 } }}>
                <TableBody>
                  <TableRow><TableCell>Expires in</TableCell><TableCell><b>{tokenInfo.timeUntilExpiry}s</b></TableCell></TableRow>
                  <TableRow><TableCell>Expires at</TableCell><TableCell>{tokenInfo.expiryTime}</TableCell></TableRow>
                  <TableRow><TableCell>Issued at</TableCell><TableCell>{tokenInfo.issuedAt}</TableCell></TableRow>
                  <TableRow><TableCell>Subject</TableCell><TableCell sx={{ wordBreak: 'break-all' }}>{tokenInfo.subject}</TableCell></TableRow>
                  <TableRow><TableCell>Client</TableCell><TableCell>{tokenInfo.clientId}</TableCell></TableRow>
                  <TableRow>
                    <TableCell>Proactive refresh in</TableCell>
                    <TableCell><b>{tokenInfo.willRefreshIn}s</b></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          ) : (
            <Chip label="No token" color="error" size="small" sx={{ my: 0.5 }} />
          )}

          <Divider sx={{ my: 1 }} />

          {/* Refresh Token */}
          <Typography variant="caption" fontWeight={700} color="text.secondary">REFRESH TOKEN</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
            <Chip
              label={refreshTokenExists ? '✅ In localStorage' : '❌ Not in localStorage'}
              size="small"
              color={refreshTokenExists ? 'success' : 'error'}
            />
            <Chip
              label={`persist: ${config.persistRefreshToken ? 'ON' : 'OFF'}`}
              size="small"
              variant="outlined"
              color={config.persistRefreshToken ? 'info' : 'default'}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Config Summary — values from auth-client defaults (Keycloak-reactive) */}
          <Typography variant="caption" fontWeight={700} color="text.secondary">SESSION CONFIG (auth-client defaults)</Typography>
          <Table size="small" sx={{ '& td': { py: 0.2, px: 0.5, fontSize: '0.7rem', border: 0 } }}>
            <TableBody>
              <TableRow><TableCell>tokenRefreshBuffer</TableCell><TableCell>{config.tokenRefreshBuffer}s</TableCell></TableRow>
              <TableRow><TableCell>sessionValidationInterval</TableCell><TableCell>{(config.sessionValidationInterval || 0) / 1000}s</TableCell></TableRow>
              <TableRow><TableCell>enableSessionValidation</TableCell><TableCell>{config.enableSessionValidation ? '✅' : '❌'}</TableCell></TableRow>
              <TableRow><TableCell>enableProactiveRefresh</TableCell><TableCell>{config.enableProactiveRefresh ? '✅' : '❌'}</TableCell></TableRow>
              <TableRow><TableCell>validateOnVisibility</TableCell><TableCell>{config.validateOnVisibility ? '✅' : '❌'}</TableCell></TableRow>
              <TableRow><TableCell>persistRefreshToken</TableCell><TableCell>{config.persistRefreshToken ? '✅' : '❌'}</TableCell></TableRow>
            </TableBody>
          </Table>

          <Divider sx={{ my: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleForceRefresh}>
              Force Refresh
            </Button>
            <Button size="small" variant="outlined" onClick={handleValidateSession}>
              Validate Session
            </Button>
          </Box>
          {lastRefresh && <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>Refresh: {lastRefresh}</Typography>}
          {lastValidation && <Typography variant="caption" display="block">Validation: {lastValidation}</Typography>}

        </Box>
      </Collapse>
    </Paper>
  );
}

export default SessionDebug;
