import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

interface FAABPlayerRowProps {
  playerId: string;
  player: any;
  faabAmount: number;
  rosterId: number;
  userMap: Record<string, any>;
  transactionDate?: string;
}

const FAABPlayerRow: React.FC<FAABPlayerRowProps> = ({
  playerId,
  player,
  faabAmount,
  rosterId,
  userMap,
  transactionDate
}) => {
  const getPositionColor = (position: string) => {
    const colors = {
      QB: 'text-red-400 bg-red-400/10 border-red-400/20',
      RB: 'text-green-400 bg-green-400/10 border-green-400/20',
      WR: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      TE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      K: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      DEF: 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    };
    return colors[position as keyof typeof colors] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  const owner = Object.values(userMap).find((user: any) => 
    Object.values(userMap).some((u: any) => u.user_id === rosterId)
  );

  return (
    <div className="bg-accent/10 rounded-lg p-3 border border-blue-400/20 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-4 h-4 text-blue-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium text-foreground">
              {player?.first_name} {player?.last_name}
            </span>
            <Badge 
              variant="outline" 
              className={`text-xs ${getPositionColor(player?.position || '')}`}
            >
              {player?.position || 'N/A'}
            </Badge>
            <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
              {player?.team || 'FA'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-500 text-white">
            FAAB: ${faabAmount}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Salary: $0
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Acquired via FAAB bid</span>
        {transactionDate && (
          <span className="text-xs">
            {new Date(parseInt(transactionDate)).toLocaleDateString()}
          </span>
        )}
      </div>
      
      <div className="text-xs text-blue-400">
        💡 This player was acquired using FAAB and doesn't count toward salary cap
      </div>
    </div>
  );
};

export default FAABPlayerRow;