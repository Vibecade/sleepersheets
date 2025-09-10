
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';

interface TeamFAABDisplayProps {
  teamFAAB: { available: number; spent: number; total: number } | number;
  showFAAB: boolean;
}

const TeamFAABDisplay: React.FC<TeamFAABDisplayProps> = ({
  teamFAAB,
  showFAAB
}) => {
  const formatFAAB = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  if (!showFAAB) return null;

  // Handle both old number format and new object format
  const faabData = typeof teamFAAB === 'number' 
    ? { available: teamFAAB, spent: 0, total: teamFAAB }
    : teamFAAB;

  return (
    <>
      <Separator className="bg-white/10" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3 h-3 text-blue-400" />
            <span className="text-foreground text-sm font-medium">FAAB Budget</span>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
            Available: {formatFAAB(faabData.available)}
          </Badge>
        </div>
        {faabData.spent > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs">FAAB Spent:</span>
            <Badge variant="outline" className="text-destructive border-destructive text-xs">
              {formatFAAB(faabData.spent)}
            </Badge>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Total Budget:</span>
          <span className="text-foreground text-xs font-medium">{formatFAAB(faabData.total)}</span>
        </div>
        <div className="text-xs text-gray-400">
          Available for free agent acquisitions
        </div>
      </div>
    </>
  );
};

export default TeamFAABDisplay;
