import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RefreshCw, X } from 'lucide-react';
import type { SleeperUser } from '@/types/sleeper';

interface SleeperAccountCardProps {
  user: SleeperUser;
  onRefresh: () => void;
  onDisconnect: () => void;
  refreshing?: boolean;
}

export const SleeperAccountCard: React.FC<SleeperAccountCardProps> = ({
  user,
  onRefresh,
  onDisconnect,
  refreshing = false
}) => {
  return (
    <Card className="border-green-500/20 shadow-[0_0_30px_-12px] shadow-green-500/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">SLEEPER ACCOUNT</h3>
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/20">
            Connected
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-12 h-12">
            {user.avatar ? (
              <AvatarImage 
                src={`https://sleepercdn.com/avatars/thumbs/${user.avatar}`} 
                alt={user.display_name || user.username}
              />
            ) : null}
            <AvatarFallback className="text-lg bg-primary/20">
              {(user.display_name || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate">
              {user.display_name || user.username}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              @{user.username}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 flex-1"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Leagues</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="flex items-center space-x-2 text-red-400 border-red-400/50 hover:bg-red-400/10"
          >
            <X className="w-4 h-4" />
            <span>Disconnect</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};