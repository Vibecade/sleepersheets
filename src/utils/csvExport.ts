
export const downloadCSV = (csvData: string[][], filename: string) => {
  // Convert to CSV string with proper escaping
  const csvContent = csvData.map(row => 
    row.map(field => {
      // Handle fields that contain commas, quotes, or newlines
      const fieldStr = String(field || '');
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    }).join(',')
  ).join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatPlayerName = (player: any): string => {
  return `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player';
};
