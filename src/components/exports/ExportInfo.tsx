
import React from 'react';

const ExportInfo: React.FC = () => {
  return (
    <div className="glass border border-emerald-400/30 rounded-lg p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
      <h4 className="font-medium text-emerald-300 mb-2">Clean CSV Format includes:</h4>
      <ul className="text-sm text-emerald-200 space-y-1 list-disc list-inside">
        <li><strong>Rosters:</strong> Player Name, NFL Team, Position, Fantasy Team, Roster Status</li>
        <li><strong>Transactions:</strong> Week, Fantasy Team, Player Name, NFL Team, Position, Action</li>
        <li><strong>Draft:</strong> Round, Pick, Fantasy Team, Player Name, NFL Team, Position, Is Keeper</li>
        <li><strong>No IDs or raw data:</strong> All columns use human-readable names and values</li>
      </ul>
    </div>
  );
};

export default ExportInfo;
