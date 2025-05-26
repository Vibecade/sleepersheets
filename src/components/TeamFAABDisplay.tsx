
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';

interface TeamFAABDisplayProps {
  teamFAAB: number;
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

  return (
    <>
      <Separator className="bg-white/10" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3 h-3 text-blue-400" />
            <span className="text-gray-300 text-xs sm:text-sm">FAAB Budget:</span>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
            {formatFAAB(teamFAAB)}
          </Badge>
        </div>
        <div className="text-xs text-gray-400">
          Available for free agent acquisitions
        </div>
      </div>
    </>
  );
};

export default TeamFAABDisplay;
