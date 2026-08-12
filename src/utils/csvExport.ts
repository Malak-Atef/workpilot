/**
 * Utility for RFC 4180 compliant CSV export
 */

export function escapeCSVField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }
  const str = String(field);
  // If string contains comma, double-quote, or newline, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const headerLine = headers.map(escapeCSVField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCSVField).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
