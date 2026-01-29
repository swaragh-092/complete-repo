import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as CsvIcon,
} from '@mui/icons-material';

export function ExportButton({ data, filename = 'export', onExport }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    handleClose();
    onExport?.('json');
  };

  const exportCSV = () => {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('Cannot export: data is not an array or is empty');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(','))
    ];

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    handleClose();
    onExport?.('csv');
  };

  const exportPDF = () => {
    // This would require a library like jsPDF or pdfmake
    console.log('PDF export not implemented yet');
    handleClose();
    onExport?.('pdf');
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleClick}
        size="small"
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={exportJSON}>
          <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export as JSON</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportCSV} disabled={!Array.isArray(data) || data.length === 0}>
          <ListItemIcon><CsvIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportPDF} disabled>
          <ListItemIcon><PdfIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export as PDF (Coming Soon)</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}










