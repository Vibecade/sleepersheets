import { saveAs } from 'file-saver';
import { ExportOptionsData } from './exports/ExportOptions';

export const downloadCSV = (data: any[][], filename: string) => {
  const csv = data.map(row => row.map(String).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, filename);
};

export const formatPlayerName = (player: any): string => {
  if (!player) return 'Unknown Player';
  return `${player.first_name} ${player.last_name}`;
};

export const getPlayerFranchiseValue = (player: any): string => {
  const age = getPlayerAge(player);
  const experience = getPlayerExperience(player);

  let franchiseValue = 'Low';

  if (age <= 25 && experience <= 3) {
    franchiseValue = 'Elite';
  } else if ((age <= 28 && age > 25) && (experience <= 5 && experience > 3)) {
    franchiseValue = 'High';
  } else if ((age <= 30 && age > 28) && (experience <= 7 && experience > 5)) {
    franchiseValue = 'Medium';
  }

  return franchiseValue;
};

export const getPlayerAge = (player: any): number | null => {
  if (!player?.birth_date) return null;

  const birthDate = new Date(player.birth_date);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export const getPlayerExperience = (player: any): number | null => {
  return player?.years_exp || null;
};

export const getDataTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

export const addExportOptionsToCSV = (csvData: any[][], exportOptions: ExportOptionsData, leagueName: string): any[][] => {
  const optionsData = [];

  optionsData.push([`${leagueName} - Export Options`]);
  optionsData.push([`Export Date: ${getDataTimestamp()}`]);
  optionsData.push([]);

  if (exportOptions.includeLeagueRules) {
    optionsData.push(['League Rules & Scoring']);
    optionsData.push([exportOptions.leagueRules]);
    optionsData.push([]);
  }

  if (exportOptions.includeFAAB) {
    optionsData.push(['FAAB Information']);
    optionsData.push([`FAAB Budget per Team: ${exportOptions.faabBudget}`]);
    optionsData.push([`FAAB Notes: ${exportOptions.faabNotes}`]);
    optionsData.push([]);
  }

  if (exportOptions.includeDraftOrder) {
    optionsData.push(['Draft Order & Details']);
    optionsData.push([exportOptions.draftOrder]);
    optionsData.push([]);
  }

  return [...optionsData, ...csvData];
};

export const generateAnalyticsCSV = (analyticsData: any[], filename: string) => {
  const headers = Object.keys(analyticsData[0]);
  const csvData = [
    headers,
    ...analyticsData.map(item => headers.map(header => String(item[header])))
  ];

  downloadCSV(csvData, filename);
};
