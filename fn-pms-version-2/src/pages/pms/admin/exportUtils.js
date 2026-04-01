// Author: Gururaj
// Created: 1st Jan 2026
// Description: Export utilities for admin monitor data including CSV/Excel download helpers.
// Version: 1.0.0
// Modified:

/**
 * Excel export helper using SheetJS (xlsx).
 * Each key in `sheets` becomes a worksheet tab.
 * sheets = { "Sheet Name": [ {col1: val, col2: val}, ... ] }
 */
import * as XLSX from "xlsx";

export function exportToExcel(sheets, filename = "report.xlsx") {
  const wb = XLSX.utils.book_new();

  Object.entries(sheets).forEach(([sheetName, rows]) => {
    if (!rows || rows.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([["No data"]]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  });

  XLSX.writeFile(wb, filename);
}

/** Format minutes → "Xh Ym" string */
export function fmtMin(minutes) {
  const m = Math.round(minutes || 0);
  if (m <= 0) return "0m";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}
