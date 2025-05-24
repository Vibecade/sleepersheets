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

export interface ExportOptionsData {
  includeLeagueRules: boolean;
  leagueRules: string;
  includeFAAB: boolean;
  faabBudget: string;
  faabNotes: string;
  includeDraftOrder: boolean;
  draftOrder: string;
}

export const addExportOptionsToCSV = (
  csvData: string[][],
  options: ExportOptionsData,
  leagueName: string
): string[][] => {
  const enhancedData = [...csvData];

  // Add spacing and additional info sections
  if (options.includeLeagueRules || options.includeFAAB || options.includeDraftOrder) {
    enhancedData.push([]); // Empty row for spacing
    enhancedData.push(['=== ADDITIONAL LEAGUE INFORMATION ===']);
    enhancedData.push([]);
  }

  // Add League Rules
  if (options.includeLeagueRules && options.leagueRules.trim()) {
    enhancedData.push(['LEAGUE RULES & SCORING']);
    enhancedData.push([options.leagueRules]);
    enhancedData.push([]);
  }

  // Add FAAB Information
  if (options.includeFAAB && (options.faabBudget.trim() || options.faabNotes.trim())) {
    enhancedData.push(['FAAB INFORMATION']);
    if (options.faabBudget.trim()) {
      enhancedData.push(['Budget per Team:', options.faabBudget]);
    }
    if (options.faabNotes.trim()) {
      enhancedData.push(['FAAB Notes:', options.faabNotes]);
    }
    enhancedData.push([]);
  }

  // Add Draft Order
  if (options.includeDraftOrder && options.draftOrder.trim()) {
    enhancedData.push(['DRAFT ORDER & DETAILS']);
    enhancedData.push([options.draftOrder]);
    enhancedData.push([]);
  }

  return enhancedData;
};
